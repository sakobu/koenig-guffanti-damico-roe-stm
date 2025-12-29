import { Sphere, Billboard, Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { Vector3 } from "@orbital";

interface WaypointProps {
  position: Vector3;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function Waypoint({
  position,
  index,
  isSelected,
  onSelect,
}: WaypointProps) {
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };

  const color = isSelected ? "#22d3ee" : "#f59e0b";
  const labelColor = isSelected ? "#67e8f9" : "#fbbf24";

  return (
    <group position={position}>
      {/* Waypoint sphere */}
      <Sphere
        args={[5, 16, 16]}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={isSelected ? 0.7 : 0.5}
        />
      </Sphere>

      {/* Label */}
      <Billboard position={[0, 15, 0]}>
        <Text
          fontSize={10}
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
