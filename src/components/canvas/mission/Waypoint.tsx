import { Billboard, Sphere, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';

import type { Vector3 } from '@orbital';

import { useDraggable } from '@hooks/useDraggable';
import { useMissionStore } from '@stores/mission';
import { ricToPosition } from '@utils/coordinates';

interface WaypointProps {
  position: Vector3;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (newPosition: Vector3) => void;
  scale?: number;
}

export default function Waypoint({
  position,
  index,
  isSelected,
  onSelect,
  onDrag,
  scale = 1,
}: WaypointProps) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const setDraggingWaypoint = useMissionStore((s) => s.setDraggingWaypoint);

  const { isDragging, handlers } = useDraggable({
    position,
    camera,
    domElement: gl.domElement,
    onDrag,
    onDragStart: () => setDraggingWaypoint(true),
    onDragEnd: () => setDraggingWaypoint(false),
    isActive: isSelected,
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isDragging) return;
    e.stopPropagation();
    onSelect();
  };

  const color = isSelected ? '#22d3ee' : '#f59e0b';
  const labelColor = isSelected ? '#67e8f9' : '#fbbf24';

  return (
    <group position={ricToPosition(position)}>
      <Sphere
        args={[5 * scale, 16, 16]}
        onClick={handleClick}
        {...handlers}
        onPointerOver={() => {
          if (!isDragging) document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          if (!isDragging) document.body.style.cursor = 'auto';
        }}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={isSelected ? 0.7 : 0.5}
        />
      </Sphere>

      <Billboard position={[0, 15 * scale, 0]}>
        <Text
          fontSize={10 * scale}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {`WP${index + 1}`}
        </Text>
      </Billboard>
    </group>
  );
}
