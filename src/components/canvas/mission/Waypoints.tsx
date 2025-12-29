import { useMissionStore } from "../../../stores/mission";
import Waypoint from "./Waypoint";

export default function Waypoints() {
  const waypoints = useMissionStore((state) => state.waypoints);
  const selectedIndex = useMissionStore((state) => state.selectedWaypointIndex);
  const selectWaypoint = useMissionStore((state) => state.selectWaypoint);
  const updateWaypoint = useMissionStore((state) => state.updateWaypoint);

  return (
    <>
      {waypoints.map((wp, index) => (
        <Waypoint
          key={index}
          position={wp.position}
          index={index}
          isSelected={selectedIndex === index}
          onSelect={() => selectWaypoint(index)}
          onDrag={(newPosition) => updateWaypoint(index, newPosition)}
        />
      ))}
    </>
  );
}
