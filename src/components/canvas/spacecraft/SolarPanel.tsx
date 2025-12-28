export interface SolarPanelProps {
  width: number
  height: number
  depth: number
  position: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  emissive?: string
  emissiveIntensity?: number
}

export function SolarPanel({
  width,
  height,
  depth,
  position,
  rotation = [0, 0, 0],
  color = '#2266ff',
  emissive = '#1144aa',
  emissiveIntensity = 0.4
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
  )
}
