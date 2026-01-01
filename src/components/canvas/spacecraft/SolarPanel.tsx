import type { Vector3 } from '@orbital';

export interface SolarPanelProps {
  width: number;
  height: number;
  depth: number;
  position: Vector3;
  rotation?: Vector3;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
}

export function SolarPanel({
  width,
  height,
  depth,
  position,
  rotation = [0, 0, 0],
  color = '#d0d0d0',
  emissive = '#444444',
  emissiveIntensity = 0.2,
}: SolarPanelProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}
