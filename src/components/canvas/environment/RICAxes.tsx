import { Line, Text, Cone, GizmoHelper, Billboard } from '@react-three/drei'

interface AxisProps {
  direction: [number, number, number]
  color: string
  label: string
  length: number
}

function AxisLine({ direction, color, label, length }: AxisProps) {
  const [dx, dy, dz] = direction
  const end: [number, number, number] = [dx * length, dy * length, dz * length]
  const labelPos: [number, number, number] = [
    dx * (length + 0.3),
    dy * (length + 0.3),
    dz * (length + 0.3),
  ]

  let rotation: [number, number, number] = [0, 0, 0]
  if (dx === 1) rotation = [0, 0, -Math.PI / 2]
  if (dz === 1) rotation = [Math.PI / 2, 0, 0]

  return (
    <group>
      <Line
        points={[[0, 0, 0], end]}
        color={color}
        lineWidth={3}
      />
      <Cone
        args={[0.06, 0.15, 8]}
        position={end}
        rotation={rotation}
      >
        <meshBasicMaterial color={color} />
      </Cone>
      <Billboard position={labelPos}>
        <Text
          fontSize={0.25}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  )
}

function AxesGroup() {
  const length = 0.8
  return (
    <group>
      <AxisLine direction={[0, 1, 0]} color="#20df80" label="R" length={length} />
      <AxisLine direction={[1, 0, 0]} color="#ff2060" label="I" length={length} />
      <AxisLine direction={[0, 0, 1]} color="#2080ff" label="C" length={length} />
    </group>
  )
}

export default function RICAxes() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <group scale={55}>
        <AxesGroup />
      </group>
    </GizmoHelper>
  )
}
