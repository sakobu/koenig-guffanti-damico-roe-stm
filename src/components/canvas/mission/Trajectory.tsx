import { Line } from "@react-three/drei";
import { useMissionStore } from "../../../stores/mission";

export default function Trajectory() {
  const trajectoryPoints = useMissionStore((state) => state.trajectoryPoints);
  const initialPosition = useMissionStore((state) => state.initialPosition);

  if (trajectoryPoints.length === 0) {
    return null;
  }

  // Convert trajectory points to line points
  // Include initial position as the starting point
  const points: [number, number, number][] = [
    initialPosition as [number, number, number],
    ...trajectoryPoints.map(
      (pt) => pt.position as [number, number, number]
    ),
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
