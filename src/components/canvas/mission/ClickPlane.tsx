import { Plane } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';

import { useCameraDistance } from '@hooks/useCameraDistance';
import { useTouchWaypointCreation } from '@hooks/useTouchWaypointCreation';
import { useMissionStore } from '@stores/mission';
import { threeToRicPosition } from '@utils/coordinates';

interface ClickPlaneProps {
  size?: number;
}

export default function ClickPlane({ size = 4000 }: ClickPlaneProps) {
  const addWaypoint = useMissionStore((state) => state.addWaypoint);
  const selectWaypoint = useMissionStore((state) => state.selectWaypoint);

  // Scale clickable area based on camera distance to ensure
  // users can always click within the viewport when zoomed out
  const cameraDistance = useCameraDistance();
  const effectiveSize = Math.max(size, cameraDistance * 3);

  // Touch: long-press to create waypoint
  const { handlers: touchHandlers, setTouchPosition } = useTouchWaypointCreation({
    onCreateWaypoint: (pos) => addWaypoint(threeToRicPosition(pos)),
  });

  // Desktop: shift+click to add waypoint
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    // Only handle mouse/pen clicks for shift+click (touch uses long-press)
    // Check if this was originally a touch event by looking at the native event
    const nativeEvent = e.nativeEvent as MouseEvent & { pointerType?: string };
    if (nativeEvent.pointerType === 'touch') {
      // For touch, regular tap deselects
      selectWaypoint(null);
      return;
    }

    if (e.shiftKey) {
      // Shift+click: add waypoint on the grid plane (C=0)
      // Convert Three.js position to RIC
      addWaypoint(threeToRicPosition(new Vector3(e.point.x, e.point.y, 0)));
    } else {
      // Regular click: deselect
      selectWaypoint(null);
    }
  };

  // Touch: store 3D position for long-press detection
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.pointerType === 'touch') {
      setTouchPosition(new Vector3(e.point.x, e.point.y, 0));
    }
    touchHandlers.onPointerDown(e);
  };

  return (
    <Plane
      args={[effectiveSize, effectiveSize]}
      position={[0, 0, 0]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={touchHandlers.onPointerMove}
      onPointerUp={touchHandlers.onPointerUp}
      onPointerCancel={touchHandlers.onPointerCancel}
      visible={false}
    >
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  );
}
