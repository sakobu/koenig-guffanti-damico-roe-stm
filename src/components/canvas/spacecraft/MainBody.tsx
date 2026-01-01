export interface MainBodyProps {
  width: number;
  height: number;
  depth: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
}

export function MainBody({
  width,
  height,
  depth,
  color,
  emissive,
  emissiveIntensity = 0.3,
  metalness = 0.6,
  roughness = 0.4,
}: MainBodyProps) {
  return (
    <mesh>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
      />
    </mesh>
  );
}
