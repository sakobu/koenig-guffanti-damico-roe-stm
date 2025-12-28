import { Text } from "@react-three/drei";
import * as THREE from "three";

export function RICAxes() {
  return (
    <group>
      {/* R axis (Radial) - Green - Y axis */}
      <arrowHelper
        args={[
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          10,
          0x00ff00,
        ]}
      />
      <Text position={[0, 11, 0]} fontSize={0.8} color="green">
        R (Radial)
      </Text>

      {/* I axis (In-track) - Red - X axis */}
      <arrowHelper
        args={[
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          10,
          0xff0000,
        ]}
      />
      <Text position={[13, 0, 0]} fontSize={0.8} color="red">
        I (In-track)
      </Text>

      {/* C axis (Cross-track) - Blue - Z axis */}
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          10,
          0x0000ff,
        ]}
      />
      <Text position={[0, 0, 11]} fontSize={0.8} color="blue">
        C (Cross-track)
      </Text>

      {/* Grid on the R-I plane (Orbital Plane) - X-Y */}
      <gridHelper
        args={[60, 60, 0x444444, 0x222222]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Text
        position={[30, 30, 0]}
        fontSize={0.8}
        color="#666666"
        rotation={[0, 0, 0]}
      >
        Orbital Plane (R-I)
      </Text>
    </group>
  );
}
