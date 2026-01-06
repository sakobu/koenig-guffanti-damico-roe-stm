import { useCallback, useRef } from 'react';

import type { ThreeEvent } from '@react-three/fiber';
import type { Vector3 } from 'three';

import { useLongPress } from '@hooks/useLongPress';

interface UseTouchWaypointCreationOptions {
  /**
   * Callback fired when a waypoint should be created at the stored position.
   */
  onCreateWaypoint: (position: Vector3) => void;

  /**
   * Duration in milliseconds to trigger long-press.
   * @default 500
   */
  longPressDuration?: number;

  /**
   * Movement threshold in pixels to cancel long-press.
   * @default 15
   */
  movementThreshold?: number;
}

interface UseTouchWaypointCreationReturn {
  /**
   * Handlers to attach to a React Three Fiber mesh.
   * These filter for touch input only.
   */
  handlers: {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
    onPointerCancel: () => void;
  };

  /**
   * Store a 3D position for potential waypoint creation.
   * Call this with the intersection point from onPointerDown.
   */
  setTouchPosition: (position: Vector3) => void;
}

/**
 * Hook for creating waypoints via long-press on touch devices.
 *
 * Encapsulates long-press detection and position tracking for touch-based
 * waypoint creation. Only responds to touch input; mouse/pen input is ignored.
 *
 * Usage:
 * 1. Attach handlers to your mesh
 * 2. Call setTouchPosition in onPointerDown with the 3D intersection point
 * 3. The onCreateWaypoint callback fires after a successful long-press
 */
export function useTouchWaypointCreation({
  onCreateWaypoint,
  longPressDuration = 500,
  movementThreshold = 15,
}: UseTouchWaypointCreationOptions): UseTouchWaypointCreationReturn {
  const touchPositionRef = useRef<Vector3 | null>(null);

  // Store callback in ref to avoid stale closure in long-press handler
  const onCreateWaypointRef = useRef(onCreateWaypoint);
  onCreateWaypointRef.current = onCreateWaypoint;

  const handleLongPress = useCallback(() => {
    if (touchPositionRef.current) {
      onCreateWaypointRef.current(touchPositionRef.current);
      touchPositionRef.current = null;
    }
  }, []);

  const { handlers: longPressHandlers, cancel: cancelLongPress } = useLongPress({
    duration: longPressDuration,
    onLongPress: handleLongPress,
    movementThreshold,
  });

  const setTouchPosition = useCallback((position: Vector3) => {
    touchPositionRef.current = position;
  }, []);

  const handlers = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') {
        longPressHandlers.onPointerDown(e.nativeEvent);
      }
    },

    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') {
        longPressHandlers.onPointerMove(e.nativeEvent);
      }
    },

    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') {
        longPressHandlers.onPointerUp(e.nativeEvent);
        touchPositionRef.current = null;
      }
    },

    onPointerCancel: () => {
      cancelLongPress();
      touchPositionRef.current = null;
    },
  };

  return {
    handlers,
    setTouchPosition,
  };
}
