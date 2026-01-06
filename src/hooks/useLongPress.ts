import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /**
   * Duration in milliseconds to trigger long-press.
   * @default 500
   */
  duration?: number;

  /**
   * Callback fired when long-press is detected.
   */
  onLongPress: () => void;

  /**
   * Movement threshold in pixels. If the pointer moves more than this
   * distance from the initial position, the long-press is cancelled.
   * @default 15
   */
  movementThreshold?: number;

  /**
   * Optional callback fired when long-press is cancelled (due to movement,
   * early release, or additional touches).
   */
  onCancel?: () => void;
}

interface UseLongPressReturn {
  /**
   * Handlers to spread onto a React Three Fiber mesh or DOM element.
   * Call these from your pointer event handlers.
   */
  handlers: {
    onPointerDown: (e: PointerEvent | React.PointerEvent) => void;
    onPointerMove: (e: PointerEvent | React.PointerEvent) => void;
    onPointerUp: (e: PointerEvent | React.PointerEvent) => void;
    onPointerCancel: (e: PointerEvent | React.PointerEvent) => void;
  };

  /**
   * Cancel the current long-press programmatically.
   */
  cancel: () => void;
}

/**
 * Hook for detecting long-press gestures on touch devices.
 *
 * Only activates for touch input (`pointerType === 'touch'`).
 * Mouse clicks are ignored to preserve desktop behavior.
 *
 * The long-press is cancelled if:
 * - The pointer moves more than `movementThreshold` pixels
 * - The pointer is released before `duration` ms
 * - A second pointer touches (multi-touch detected)
 * - The pointer event is cancelled
 */
export function useLongPress({
  duration = 500,
  onLongPress,
  movementThreshold = 15,
  onCancel,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isPressedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Store callbacks in refs to avoid stale closures
  const onLongPressRef = useRef(onLongPress);
  const onCancelRef = useRef(onCancel);
  onLongPressRef.current = onLongPress;
  onCancelRef.current = onCancel;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPressedRef.current) {
      isPressedRef.current = false;
      onCancelRef.current?.();
    }
    startPositionRef.current = null;
    activePointerIdRef.current = null;
  }, []);

  const handlers = {
    onPointerDown: (e: PointerEvent | React.PointerEvent) => {
      // Only handle touch input
      if (e.pointerType !== 'touch') return;

      // If there's already an active pointer, cancel (multi-touch)
      if (activePointerIdRef.current !== null) {
        cancel();
        return;
      }

      activePointerIdRef.current = e.pointerId;
      startPositionRef.current = { x: e.clientX, y: e.clientY };
      isPressedRef.current = true;

      timerRef.current = setTimeout(() => {
        if (isPressedRef.current) {
          onLongPressRef.current();
          isPressedRef.current = false;
        }
        timerRef.current = null;
        startPositionRef.current = null;
        activePointerIdRef.current = null;
      }, duration);
    },

    onPointerMove: (e: PointerEvent | React.PointerEvent) => {
      // Only track the active pointer
      if (e.pointerId !== activePointerIdRef.current) return;

      if (!isPressedRef.current || !startPositionRef.current) return;

      const dx = e.clientX - startPositionRef.current.x;
      const dy = e.clientY - startPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > movementThreshold) {
        cancel();
      }
    },

    onPointerUp: (e: PointerEvent | React.PointerEvent) => {
      // Only handle the active pointer
      if (e.pointerId !== activePointerIdRef.current) return;
      cancel();
    },

    onPointerCancel: (e: PointerEvent | React.PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      cancel();
    },
  };

  return {
    handlers,
    cancel,
  };
}
