import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useWheel(count: number, { enabled = true, requestedIndex, initialIndex = 1 }: { enabled?: boolean; requestedIndex?: number; initialIndex?: number } = {}) {
  const initialPosition = Math.min(requestedIndex ?? initialIndex, Math.max(0, count - 1));
  const ref = useRef<HTMLElement>(null);
  const targetRef = useRef(initialPosition);
  const positionRef = useRef(initialPosition);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gesture = useRef<{ id: number; x: number; y: number; target: number; dragged: boolean } | null>(null);
  const suppressClick = useRef(false);
  const keyboardFocusRequested = useRef(false);
  const [target, setTarget] = useState(initialPosition);
  const [position, setPosition] = useState(initialPosition);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (requestedIndex === undefined) return;
    const frame = requestAnimationFrame(() => {
      targetRef.current = requestedIndex;
      setTarget(requestedIndex);
    });
    return () => cancelAnimationFrame(frame);
  }, [requestedIndex]);

  function moveTo(value: number) {
    const next = Math.max(0, Math.min(Math.max(0, count - 1), value));
    targetRef.current = next;
    setTarget(next);
  }

  useEffect(() => {
    let frame: number;
    let previousTime: number | undefined;

    function animate(time: number) {
      const elapsed = previousTime === undefined ? 16 : Math.min(time - previousTime, 48);
      previousTime = time;
      const remaining = target - positionRef.current;
      const next = reducedMotion || Math.abs(remaining) < 0.001
        ? target
        : positionRef.current + remaining * (1 - Math.exp(-elapsed / 62));
      positionRef.current = next;
      setPosition(next);
      if (next !== target) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);

  useEffect(() => {
    if (position !== target || !keyboardFocusRequested.current) return;
    keyboardFocusRequested.current = false;
    ref.current?.querySelector<HTMLButtonElement>(`[data-index="${Math.round(target)}"]`)?.focus({ preventScroll: true });
  }, [position, target]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? element!.clientHeight : 1;
      const next = Math.max(0, Math.min(Math.max(0, count - 1), targetRef.current + event.deltaY * multiplier / 115));
      targetRef.current = next;
      setTarget(next);
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => {
        const snapped = Math.round(targetRef.current);
        targetRef.current = snapped;
        setTarget(snapped);
      }, 140);
    }

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
      clearTimeout(snapTimer.current);
    };
  }, [count, enabled]);

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
    if (!event.isPrimary || event.button !== 0) return;
    clearTimeout(snapTimer.current);
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, target: targetRef.current, dragged: false };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const distance = start.y - event.clientY;
    if (!start.dragged && Math.abs(event.clientX - start.x) > Math.abs(distance)) return;
    if (Math.abs(distance) > 7 && !start.dragged) {
      start.dragged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!start.dragged) return;
    event.preventDefault();
    suppressClick.current = true;
    const rowHeight = event.currentTarget.clientHeight * 0.157;
    moveTo(start.target + distance / rowHeight);
  }

  function finishGesture(event: PointerEvent<HTMLElement>) {
    if (!gesture.current || gesture.current.id !== event.pointerId) return;
    if (gesture.current.dragged) moveTo(Math.round(targetRef.current));
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    ref,
    position,
    selected: Math.round(position),
    select: (index: number) => {
      clearTimeout(snapTimer.current);
      moveTo(index);
    },
    canActivate: () => !suppressClick.current,
    isTap: (event: PointerEvent<HTMLElement>) => {
      const start = gesture.current;
      return !!start && start.id === event.pointerId && !start.dragged
        && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 7;
    },
    consumeClick: () => { suppressClick.current = true; },
    handlers: {
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp: finishGesture,
      onPointerCancel: finishGesture,
      onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
        // Touch implicitly captures the pressed button. Its capture-loss event
        // bubbles when capture transfers to the wheel during a drag.
        if (event.target === event.currentTarget) finishGesture(event);
      },
    },
  };
}
