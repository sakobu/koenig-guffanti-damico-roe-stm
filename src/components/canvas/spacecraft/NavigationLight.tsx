export interface NavigationLightProps {
  position: [number, number, number]
  color: string
  intensity?: number
  distance?: number
}

export function NavigationLight({
  position,
  color,
  intensity = 2,
  distance = 100
}: NavigationLightProps) {
  return (
    <group position={position}>
      {/* Visual marker - small glowing sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Actual light */}
      <pointLight
        color={color}
        intensity={intensity}
        distance={distance}
      />
    </group>
  )
}
