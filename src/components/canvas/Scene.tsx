import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { ReactNode } from 'react'
import { useMissionStore } from '../../stores/mission'

interface SceneProps {
  children?: ReactNode
}

function Controls() {
  const isDragging = useMissionStore((s) => s.isDraggingWaypoint)

  return (
    <OrbitControls
      enabled={!isDragging}
      enableDamping
      dampingFactor={0.05}
      minDistance={50}
      maxDistance={5000}
    />
  )
}

export default function Scene({ children }: SceneProps) {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0 }}
      camera={{ position: [0, 0, 1500], fov: 50, near: 0.1, far: 10000 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.3} />
      <pointLight position={[200, 200, 200]} intensity={1} />

      <Controls />

      {children}
    </Canvas>
  )
}
