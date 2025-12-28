import { Text } from '@react-three/drei'

interface ChiefProps {
  size?: number
}

export default function Chief({ size = 5 }: ChiefProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
      <Text
        position={[0, size + 8, 0]}
        fontSize={10}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        Chief
      </Text>
    </group>
  )
}
