import type { ReactNode } from 'react';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { useMissionStore } from '@stores/mission';

interface SceneProps {
  children?: ReactNode;
  cameraDistance?: number;
  maxZoomOut?: number;
}

interface ControlsProps {
  maxZoomOut: number;
}

function Controls({ maxZoomOut }: ControlsProps) {
  const isDragging = useMissionStore((s) => s.isDraggingWaypoint);
  const hasSelection = useMissionStore((s) => s.selectedWaypointIndex !== null);

  return (
    <OrbitControls
      enabled={!isDragging && !hasSelection}
      enableDamping
      dampingFactor={0.05}
      minDistance={50}
      maxDistance={maxZoomOut}
    />
  );
}

export default function Scene({
  children,
  cameraDistance = 1500,
  maxZoomOut = 5000,
}: SceneProps) {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0 }}
      camera={{
        position: [0, 0, cameraDistance],
        fov: 50,
        near: 0.1,
        far: maxZoomOut * 2,
      }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.3} />
      <pointLight position={[200, 200, 200]} intensity={1} />

      <Controls maxZoomOut={maxZoomOut} />

      {children}
    </Canvas>
  );
}
