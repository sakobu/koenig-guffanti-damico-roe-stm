import { Line, Text, Cone, GizmoHelper } from '@react-three/drei'

interface AxisProps {
  direction: [number, number, number]
  color: string
  label: string
  length: number
}

function Axis({ direction, color, label, length }: AxisProps) {
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
        lineWidth={2}
      />
      <Cone
        args={[0.06, 0.15, 8]}
        position={end}
        rotation={rotation}
      >
        <meshBasicMaterial color={color} />
      </Cone>
      <Text
        position={labelPos}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

function AxesContent() {
  const length = 0.8
  return (
    <group>
      <Axis direction={[0, 1, 0]} color="#22c55e" label="R" length={length} />
      <Axis direction={[1, 0, 0]} color="#ef4444" label="I" length={length} />
      <Axis direction={[0, 0, 1]} color="#3b82f6" label="C" length={length} />
    </group>
  )
}

export default function RICAxes() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <group scale={40}>
        <AxesContent />
      </group>
    </GizmoHelper>
  )
}
