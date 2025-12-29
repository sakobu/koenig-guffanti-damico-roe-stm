import { Plane } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useMissionStore } from "../../../stores/mission";

export default function ClickPlane() {
  const addWaypoint = useMissionStore((state) => state.addWaypoint);
  const selectWaypoint = useMissionStore((state) => state.selectWaypoint);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (e.shiftKey) {
      // Shift+click: add waypoint
      // Waypoint [R, I, C] maps directly to Three.js [x, y, z]
      const point = e.point;
      addWaypoint([point.x, point.y, 0]);
    } else {
      // Regular click: deselect
      selectWaypoint(null);
    }
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
