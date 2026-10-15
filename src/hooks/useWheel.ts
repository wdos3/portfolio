import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (notify: () => void) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};

export function useWheel(count: number) {
  const ref = useRef<HTMLElement>(null);
  const targetRef = useRef(0);
  const positionRef = useRef(0);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gesture = useRef<{ x: number; y: number; target: number; dragged: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  const keyboardFocusRequested = useRef(false);
  const [target, setTarget] = useState(0);
  const [position, setPosition] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false,
  );

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
    if (!element) return;

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
  }, [count]);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
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
    gesture.current = { x: event.clientX, y: event.clientY, target: targetRef.current, dragged: false };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start) return;
    const distance = start.y - event.clientY;
    if (!start.dragged && Math.abs(event.clientX - start.x) > Math.abs(distance)) return;
    if (Math.abs(distance) > 7 && !start.dragged) {
      start.dragged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!start.dragged) return;
    event.preventDefault();
    suppressClickUntil.current = performance.now() + 300;
    const rowHeight = event.currentTarget.clientHeight * 0.157;
    moveTo(start.target + distance / rowHeight);
  }

  function finishGesture(event: PointerEvent<HTMLElement>) {
    if (!gesture.current) return;
    if (gesture.current.dragged) moveTo(Math.round(targetRef.current));
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    ref,
    position,
    selected: Math.round(target),
    select: (index: number) => {
      clearTimeout(snapTimer.current);
      moveTo(index);
    },
    canActivate: () => performance.now() > suppressClickUntil.current,
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
