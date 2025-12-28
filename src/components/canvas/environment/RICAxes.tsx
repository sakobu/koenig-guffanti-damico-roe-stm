import { Line, Text, Sphere, GizmoHelper, Billboard } from "@react-three/drei";

interface AxisProps {
  direction: [number, number, number];
  color: string;
  label: string;
  length: number;
}

function AxisLine({ direction, color, label, length }: AxisProps) {
  const [dx, dy, dz] = direction;
  const end: [number, number, number] = [dx * length, dy * length, dz * length];

  return (
    <group>
      <Line points={[[0, 0, 0], end]} color={color} lineWidth={3} />
      <Sphere args={[0.12, 16, 16]} position={end}>
        <meshBasicMaterial color={color} />
      </Sphere>
      <Billboard position={end}>
        <Text
          fontSize={0.15}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          renderOrder={1}
          material-depthTest={false}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

function AxesGroup() {
  const length = 0.8;
  return (
    <group>
      <AxisLine
        direction={[0, 1, 0]}
        color="#20df80"
        label="R"
        length={length}
      />
      <AxisLine
        direction={[1, 0, 0]}
        color="#ff2060"
        label="I"
        length={length}
      />
      <AxisLine
        direction={[0, 0, 1]}
        color="#2080ff"
        label="C"
        length={length}
      />
    </group>
  );
}

export default function RICAxes() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
      <group scale={55}>
        <AxesGroup />
      </group>
    </GizmoHelper>
  );
}
