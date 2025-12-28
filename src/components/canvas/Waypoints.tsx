import { useMissionStore } from "../../stores/mission";
import Waypoint from "./Waypoint";

export default function Waypoints() {
  const waypoints = useMissionStore((state) => state.waypoints);

  return (
    <>
      {waypoints.map((wp, index) => (
        <Waypoint
          key={index}
          position={wp.position as [number, number, number]}
          index={index}
        />
      ))}
    </>
  );
}
