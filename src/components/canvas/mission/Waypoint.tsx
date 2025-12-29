import { Sphere, Billboard, Text } from "@react-three/drei";

interface WaypointProps {
  position: [number, number, number];
  index: number;
}

export default function Waypoint({ position, index }: WaypointProps) {
  return (
    <group position={position}>
      {/* Waypoint sphere */}
      <Sphere args={[3, 16, 16]}>
        <meshStandardMaterial
          color="#f59e0b"
          transparent
          opacity={0.8}
          emissive="#f59e0b"
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Label */}
      <Billboard position={[0, 6, 0]}>
        <Text
          fontSize={4}
          color="#fbbf24"
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
