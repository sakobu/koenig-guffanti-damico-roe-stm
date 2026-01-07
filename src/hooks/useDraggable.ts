import { useCallback,useEffect, useRef, useState } from 'react';

import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import type { Vector3 } from '@orbital';

import { threeToRicPosition } from '@utils/coordinates';

/**
 * Configuration options for the useDraggable hook.
 */
interface UseDraggableOptions {
  /**
   * Current position in RIC (Radial-Intrack-Crosstrack) coordinates.
   * The Z component (Crosstrack) determines the drag plane's position.
   * This should be the controlled position from parent state.
   */
  position: Vector3;

  /**
   * Three.js camera used for raycasting.
   * Obtain via `useThree((state) => state.camera)`.
   */
  camera: THREE.Camera;

  /**
   * Canvas DOM element for attaching wheel event listeners.
   * Obtain via `useThree((state) => state.gl.domElement)`.
   */
  domElement: HTMLCanvasElement;

  /**
   * Callback fired continuously during drag with the new position.
   * Position is in RIC coordinates. Update your state here.
   *
   * Note: Does not need to be memoized - the hook stores it in a ref internally.
   */
  onDrag: (position: Vector3) => void;

  /**
   * Callback fired when drag starts (pointer down on mesh).
   * Use this to disable other controls (e.g., OrbitControls).
   *
   * Note: Does not need to be memoized - the hook stores it in a ref internally.
   */
  onDragStart?: () => void;

  /**
   * Callback fired when drag ends (pointer up or component unmounts while dragging).
   * Use this to re-enable other controls.
   *
   * Note: Does not need to be memoized - the hook stores it in a ref internally.
   */
  onDragEnd?: () => void;

  /**
   * When true, enables scroll wheel Z-adjustment even when not actively dragging.
   * Use this for "selected" states where scroll should work without holding pointer down.
   *
   * @example
   * ```tsx
   * useDraggable({
   *   // ... other options
   *   isActive: isSelected,  // Enable scroll when waypoint is selected
   * });
   * ```
   */
  isActive?: boolean;
}

/**
 * Return value from the useDraggable hook.
 */
interface UseDraggableReturn {
  /**
   * Whether the object is currently being dragged.
   * Use this to conditionally style the object or disable other interactions.
   */
  isDragging: boolean;

  /**
   * Pointer event handlers to spread onto a R3F mesh.
   *
   * @example
   * ```tsx
   * <Sphere {...handlers} />
   * ```
   */
  handlers: {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
    onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
  };
}

/**
 * Hook for dragging 3D objects on a plane at constant Z (Crosstrack).
 *
 * ## Features
 * - Drags objects in the X-Y plane (Radial-Intrack) at constant Z (Crosstrack)
 * - Scroll wheel adjusts Z position while dragging
 * - Automatically manages cursor styles (grab/grabbing)
 * - Uses pointer capture for reliable drag tracking
 * - Properly cleans up if component unmounts mid-drag
 *
 * ## Coordinate System
 * Uses RIC (Radial-Intrack-Crosstrack) coordinates:
 * - R (X): Radial direction (away from Earth)
 * - I (Y): Intrack direction (velocity direction)
 * - C (Z): Crosstrack direction (normal to orbital plane)
 *
 * ## Implementation Notes
 *
 * ### Why refs for callbacks?
 * Callbacks are stored in refs to avoid re-running effects when callback
 * references change. This prevents the cleanup effect from firing mid-drag
 * when the parent re-renders (which would incorrectly call onDragEnd).
 *
 * ### Why both state and ref for isDragging?
 * - `isDragging` state: Triggers re-renders, used for UI updates
 * - `isDraggingRef`: Synchronous access in event handlers (React state is async)
 *
 * ### Pointer capture
 * Uses the Pointer Capture API to ensure pointer events continue firing
 * even if the pointer moves outside the mesh bounds during fast drags.
 *
 * @param options - Configuration options
 * @returns Object containing `isDragging` state and `handlers` to spread on mesh
 */
export function useDraggable({
  position,
  camera,
  domElement,
  onDrag,
  onDragStart,
  onDragEnd,
  isActive = false,
}: UseDraggableOptions): UseDraggableReturn {
  // Drag state - both state (for re-renders) and ref (for sync access in handlers)
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  // Current Z position - maintained separately for wheel adjustments
  const currentZ = useRef(position[2]);

  // Raycasting objects - reused across drags to avoid allocations
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const intersection = useRef(new THREE.Vector3());

  // Store callbacks in refs to avoid effect re-runs when references change.
  // This is critical - without this, the cleanup effect would fire on every
  // render during a drag, incorrectly calling onDragEnd.
  const onDragRef = useRef(onDrag);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  // Sync callback refs on every render (no deps = runs every render)
  useEffect(() => {
    onDragRef.current = onDrag;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  });

  // Keep position ref in sync for wheel handler access
  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
    currentZ.current = position[2];
  }, [position]);

  /**
   * Converts screen coordinates to RIC world position on the drag plane.
   * Uses raycasting to find the intersection point with a plane at currentZ.
   */
  const getWorldPosition = useCallback(
    (clientX: number, clientY: number): Vector3 | null => {
      // Convert screen coords to normalized device coordinates (-1 to 1)
      const rect = domElement.getBoundingClientRect();
      mouse.current.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      // Cast ray from camera through mouse position
      raycaster.current.setFromCamera(mouse.current, camera);

      // Set plane at current Z (negative because plane.constant is -distance from origin)
      dragPlane.current.constant = -currentZ.current;

      // Find intersection with drag plane
      if (
        raycaster.current.ray.intersectPlane(
          dragPlane.current,
          intersection.current
        )
      ) {
        // Ensure Z is exactly currentZ (avoid floating point drift)
        intersection.current.z = currentZ.current;
        return threeToRicPosition(intersection.current);
      }
      return null;
    },
    [camera, domElement]
  );

  // Event handlers to spread onto the mesh
  const handlers = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();

      // Set refs synchronously for immediate access in other handlers
      isDraggingRef.current = true;
      pointerIdRef.current = e.pointerId;

      // Set state for UI updates (async)
      setIsDragging(true);

      // Notify parent (e.g., to disable OrbitControls)
      onDragStartRef.current?.();

      // Visual feedback
      document.body.style.cursor = 'grabbing';

      // Capture pointer to receive events even when pointer leaves mesh
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },

    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      // Early exit if not dragging (uses ref for sync check)
      if (!isDraggingRef.current) return;
      e.stopPropagation();

      // Calculate new position and notify parent
      const newPos = getWorldPosition(e.clientX, e.clientY);
      if (newPos) {
        onDragRef.current(newPos);
      }
    },

    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      // Early exit if not dragging (uses ref for sync check)
      if (!isDraggingRef.current) return;
      e.stopPropagation();

      // Reset drag state
      isDraggingRef.current = false;
      pointerIdRef.current = null;
      setIsDragging(false);

      // Notify parent (e.g., to re-enable OrbitControls)
      onDragEndRef.current?.();

      // Reset cursor (back to grab, not auto - we're still hovering)
      document.body.style.cursor = 'grab';

      // Release pointer capture
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
  };

  // Scroll wheel and two-finger touch for Z (Crosstrack) adjustment
  // Enabled while dragging or when active (selected)
  const scrollEnabled = isDragging || isActive;

  // Track active touches for two-finger gesture
  const touchesRef = useRef<Map<number, { startY: number; currentY: number }>>(
    new Map()
  );

  useEffect(() => {
    if (!scrollEnabled) return;

    // Capture ref value at effect setup for cleanup
    const touches = touchesRef.current;

    // Mouse wheel handler (desktop/trackpad)
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Normalize delta: deltaMode 0 = pixels, 1 = lines, 2 = pages
      // Trackpads typically use mode 0 with small values
      // Mouse wheels typically use mode 0 with larger values or mode 1
      const delta = e.deltaMode === 0 ? e.deltaY * 0.1 : e.deltaY * 3;

      // Update Z position
      currentZ.current -= delta;

      // Notify parent with updated position (keep X, Y from current position)
      onDragRef.current([
        positionRef.current[0],
        positionRef.current[1],
        currentZ.current,
      ]);
    };

    // Two-finger touch handlers (tablet)
    const handleTouchStart = (e: TouchEvent) => {
      // Track all new touches
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        touchesRef.current.set(touch.identifier, {
          startY: touch.clientY,
          currentY: touch.clientY,
        });
      }

      // If exactly 2 fingers, prevent default to stop OrbitControls zoom
      if (e.touches.length === 2) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Update tracked touch positions
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const tracked = touchesRef.current.get(touch.identifier);
        if (tracked) {
          tracked.currentY = touch.clientY;
        }
      }

      // Two-finger vertical drag for Z adjustment
      if (e.touches.length === 2 && touchesRef.current.size >= 2) {
        e.preventDefault();

        // Calculate average vertical delta of both fingers
        let totalDeltaY = 0;
        let count = 0;
        touchesRef.current.forEach((touch) => {
          totalDeltaY += touch.currentY - touch.startY;
          count++;
        });

        if (count === 0) return;
        const avgDeltaY = totalDeltaY / count;

        // Apply Z adjustment (inverted: drag up = increase Z)
        // Scale factor tuned for natural feel
        const zDelta = -avgDeltaY * 0.5;

        // Reset start positions for continuous adjustment
        touchesRef.current.forEach((touch) => {
          touch.startY = touch.currentY;
        });

        // Only apply if there's meaningful movement
        if (Math.abs(zDelta) > 0.1) {
          currentZ.current += zDelta;
          onDragRef.current([
            positionRef.current[0],
            positionRef.current[1],
            currentZ.current,
          ]);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Remove ended touches from tracking
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        touchesRef.current.delete(touch.identifier);
      }
    };

    // passive: false allows preventDefault() to work
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    domElement.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    domElement.addEventListener('touchend', handleTouchEnd);
    domElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
      domElement.removeEventListener('touchcancel', handleTouchEnd);
      touches.clear();
    };
  }, [scrollEnabled, domElement]);

  // Cleanup on unmount - ensures proper state reset if component unmounts mid-drag
  // Empty deps = only runs cleanup on unmount, not on every render
  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        // Notify parent that drag ended (e.g., re-enable OrbitControls)
        onDragEndRef.current?.();
      }
      // Always reset cursor on unmount
      document.body.style.cursor = 'auto';
    };
  }, []);

  return { isDragging, handlers };
}
