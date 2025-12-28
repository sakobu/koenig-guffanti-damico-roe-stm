import { Plane } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMissionStore } from "../../stores/mission";

export default function ClickPlane() {
  const addWaypoint = useMissionStore((state) => state.addWaypoint);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Only add waypoint on Shift+click
    if (!e.shiftKey) return;

    // Stop propagation to prevent orbit controls interference
    e.stopPropagation();

    // Waypoint [R, I, C] maps directly to Three.js [x, y, z]
    // Plane lies in XY plane (z=0), so point.x = R, point.y = I
    const point = e.point;
    addWaypoint([point.x, point.y, 0]); // [R, I, C]
  };

  return (
    <Plane
      args={[4000, 4000]}
      position={[0, 0, 0]}
      onClick={handleClick}
      visible={false}
    >
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  );
}
