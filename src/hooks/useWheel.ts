import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface WheelOptions {
  dragStepRatio: number;
  enabled?: boolean;
  requestedIndex?: number;
  initialIndex?: number;
  onHorizontalSwipe?: (direction: 'previous' | 'next') => void;
}

interface Gesture {
  id: number;
  x: number;
  y: number;
  lastY: number;
  step: number;
  axis: 'vertical' | 'horizontal' | null;
  capture: Element;
}

export function useWheel(count: number, { dragStepRatio, enabled = true, requestedIndex, initialIndex = 1, onHorizontalSwipe }: WheelOptions) {
  const initialPosition = Math.min(requestedIndex ?? initialIndex, Math.max(0, count - 1));
  const ref = useRef<HTMLElement>(null);
  const targetRef = useRef(initialPosition);
  const positionRef = useRef(initialPosition);
  const animation = useRef<number | undefined>(undefined);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const keyboardFocusRequested = useRef(false);
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();

  const stopAnimation = useCallback(() => {
    if (animation.current !== undefined) cancelAnimationFrame(animation.current);
    animation.current = undefined;
  }, []);

  const moveTo = useCallback((value: number, immediate = false) => {
    targetRef.current = Math.max(0, Math.min(Math.max(0, count - 1), value));
    if (immediate || reducedMotion) {
      stopAnimation();
      positionRef.current = targetRef.current;
      setPosition(targetRef.current);
      return;
    }
    // A running frame reads the latest target; input events never restart its
    // clock. Direct dragging bypasses interpolation entirely.
    if (animation.current !== undefined) return;
    let previousTime: number | undefined;
    function animate(time: number) {
      const elapsed = previousTime === undefined ? 16 : Math.min(time - previousTime, 48);
      previousTime = time;
      const remaining = targetRef.current - positionRef.current;
      const next = Math.abs(remaining) < 0.001
        ? targetRef.current
        : positionRef.current + remaining * (1 - Math.exp(-elapsed / 62));
      positionRef.current = next;
      setPosition(next);
      animation.current = next === targetRef.current ? undefined : requestAnimationFrame(animate);
    }
    animation.current = requestAnimationFrame(animate);
  }, [count, reducedMotion, stopAnimation]);

  useEffect(() => stopAnimation, [stopAnimation]);

  useEffect(() => {
    if (requestedIndex === undefined) return;
    const frame = requestAnimationFrame(() => moveTo(requestedIndex));
    return () => cancelAnimationFrame(frame);
  }, [requestedIndex, moveTo]);

  useEffect(() => {
    if (position !== targetRef.current || !keyboardFocusRequested.current) return;
    keyboardFocusRequested.current = false;
    ref.current?.querySelector<HTMLButtonElement>(`[data-index="${Math.round(position)}"]`)?.focus({ preventScroll: true });
  }, [position]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      if (gesture.current) return;
      keyboardFocusRequested.current = false;
      const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? element!.clientHeight : 1;
      moveTo(targetRef.current + event.deltaY * multiplier / 115);
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => moveTo(Math.round(targetRef.current)), 140);
    }

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
      clearTimeout(snapTimer.current);
    };
  }, [enabled, moveTo]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    suppressClick.current = false;
    const current = Math.round(targetRef.current);
    const destinations: Record<string, number> = {
      ArrowDown: current + 1,
      ArrowUp: current - 1,
      PageDown: current + 3,
      PageUp: current - 3,
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    clearTimeout(snapTimer.current);
    const next = Math.max(0, Math.min(count - 1, destinations[event.key]));
    keyboardFocusRequested.current = true;
    moveTo(next);
    ref.current?.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus({ preventScroll: true });
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return;
    clearTimeout(snapTimer.current);
    keyboardFocusRequested.current = false;
    suppressClick.current = false;
    stopAnimation();
    targetRef.current = positionRef.current;
    // Capture from the first press, including empty surface. Button capture
    // preserves native mouse activation when the gesture remains a tap.
    const capture = (event.target as Element).closest('.wheel-item') ?? event.currentTarget;
    capture.setPointerCapture(event.pointerId);
    gesture.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY,
      step: event.currentTarget.clientHeight * dragStepRatio,
      axis: null, capture,
    };
  }

  function finishGesture(event: PointerEvent<HTMLElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (start.capture.hasPointerCapture(event.pointerId)) start.capture.releasePointerCapture(event.pointerId);
    if (start.axis || cancelled) suppressClick.current = true;
    moveTo(Math.round(targetRef.current));
    if (!cancelled && start.axis === 'horizontal' && Math.abs(event.clientX - start.x) >= 55) {
      onHorizontalSwipe?.(event.clientX < start.x ? 'next' : 'previous');
    }
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) {
      finishGesture(event, true);
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis) {
      if (Math.hypot(dx, dy) <= 7) return;
      start.axis = Math.abs(dy) >= Math.abs(dx) ? 'vertical' : 'horizontal';
      start.capture = event.currentTarget;
      event.currentTarget.setPointerCapture(event.pointerId);
      suppressClick.current = true;
      setDragging(true);
    }
    event.preventDefault();
    if (start.axis === 'vertical') {
      // Clamped incremental movement allows immediate reversal at either end,
      // including after dragging far beyond the wheel or viewport.
      moveTo(positionRef.current + (start.lastY - event.clientY) / start.step, true);
      start.lastY = event.clientY;
    }
  }

  return {
    ref, position, dragging,
    selected: Math.round(position),
    select: (index: number) => {
      clearTimeout(snapTimer.current);
      moveTo(index);
    },
    canActivate: () => !suppressClick.current,
    isTap: (event: PointerEvent<HTMLElement>) => {
      const start = gesture.current;
      return !!start && start.id === event.pointerId && !start.axis
        && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 7;
    },
    consumeClick: () => { suppressClick.current = true; },
    handlers: {
      onKeyDown, onPointerDown, onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => finishGesture(event),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => finishGesture(event, true),
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
        // Ignore the bubbling event when capture transfers from a button to
        // its wheel. Unexpected loss of the wheel capture cancels the drag.
        if (event.target === event.currentTarget) finishGesture(event, true);
      },
    },
  };
}
