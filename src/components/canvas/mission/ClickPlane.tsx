import { Plane } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Vector3 } from 'three';

import { useCameraDistance } from '@hooks/useCameraDistance';
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

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (e.shiftKey) {
      // Shift+click: add waypoint on the grid plane (C=0)
      // Convert Three.js position to RIC
      addWaypoint(threeToRicPosition(new Vector3(e.point.x, e.point.y, 0)));
    } else {
      // Regular click: deselect
      selectWaypoint(null);
    }
  };

  return (
    <Plane
      args={[effectiveSize, effectiveSize]}
      position={[0, 0, 0]}
      onClick={handleClick}
      visible={false}
    >
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  );
}
