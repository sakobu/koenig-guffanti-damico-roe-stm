import { Grid as DreiGrid, Text } from '@react-three/drei'
import { useMemo } from 'react'

interface GridProps {
  size?: number
  markerInterval?: number
}

export default function Grid({
  size = 2000,
  markerInterval = 250
}: GridProps) {
  const markers = useMemo(() => {
    const half = size / 2
    const result: { position: [number, number, number]; label: string; axis: 'I' | 'R' }[] = []

    // Distance markers along I axis (at R=0)
    for (let d = -half; d <= half; d += markerInterval) {
      if (d !== 0) {
        result.push({
          position: [d, -8, 0],
          label: `${d}`,
          axis: 'I'
        })
      }
    }

    // Distance markers along R axis (at I=0)
    for (let d = -half; d <= half; d += markerInterval) {
      if (d !== 0) {
        result.push({
          position: [-12, d, 0],
          label: `${d}`,
          axis: 'R'
        })
      }
    }

    return result
  }, [size, markerInterval])

  return (
    <group>
      <DreiGrid
        args={[size, size]}
        rotation={[Math.PI / 2, 0, 0]}
        cellSize={50}
        cellThickness={0.4}
        cellColor="#1a3d5c"
        sectionSize={250}
        sectionThickness={0.8}
        sectionColor="#2a5478"
        fadeDistance={2000}
        fadeStrength={1.5}
      />
      {markers.map((marker, i) => (
        <Text
          key={`marker-${i}`}
          position={marker.position}
          fontSize={7}
          color="#4a6a8a"
          anchorX={marker.axis === 'I' ? 'center' : 'right'}
          anchorY={marker.axis === 'I' ? 'top' : 'middle'}
        >
          {marker.label}
        </Text>
      ))}
    </group>
  )
}
