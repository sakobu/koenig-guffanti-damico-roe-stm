import { Line } from "@react-three/drei";
import type { Vector3 } from "three";
import { useMissionStore } from "../../../stores/mission";
import { ricToThreePosition } from "../../../utils/coordinates";

export default function Trajectory() {
  const trajectoryPoints = useMissionStore((state) => state.trajectoryPoints);
  const initialPosition = useMissionStore((state) => state.initialPosition);

  if (trajectoryPoints.length === 0) {
    return null;
  }

  // Convert RIC trajectory points to Three.js coordinates for rendering
  // Include initial position as the starting point
  const points: Vector3[] = [
    ricToThreePosition(initialPosition),
    ...trajectoryPoints.map((pt) => ricToThreePosition(pt.position)),
  ];

  return (
    <Line
      points={points}
      color="#22d3ee"
      lineWidth={2}
      dashed
      dashSize={3}
      gapSize={2}
    />
  );
}
