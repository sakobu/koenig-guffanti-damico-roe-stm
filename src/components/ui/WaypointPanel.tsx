import { useEffect } from "react";
import { useMissionStore } from "../../stores/mission";
import Panel from "./Panel";
import Button from "../shared/Button";

export default function WaypointPanel() {
  const waypoints = useMissionStore((state) => state.waypoints);
  const selectedIndex = useMissionStore((state) => state.selectedWaypointIndex);
  const selectWaypoint = useMissionStore((state) => state.selectWaypoint);
  const removeWaypoint = useMissionStore((state) => state.removeWaypoint);
  const clearWaypoints = useMissionStore((state) => state.clearWaypoints);

  // Keyboard handling for waypoint selection/deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        selectWaypoint(null);
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIndex !== null
      ) {
        // Prevent browser back navigation on Backspace
        e.preventDefault();
        removeWaypoint(selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, selectWaypoint, removeWaypoint]);

  const handleDeleteSelected = () => {
    if (selectedIndex !== null) {
      removeWaypoint(selectedIndex);
    }
  };

  return (
    <Panel title="Waypoints" defaultOpen>
      <div className="space-y-2">
        <div className="text-xs text-zinc-500">Shift+click on grid to add</div>

        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={handleDeleteSelected}
            disabled={selectedIndex === null}
            className="flex-1"
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Waypoint list */}
        {waypoints.length > 0 && (
          <div className="space-y-1 mt-3">
            {waypoints.map((wp, i) => (
              <div
                key={i}
                onClick={() => selectWaypoint(i)}
                className={`text-xs font-mono px-2 py-1 rounded cursor-pointer
                  transition-colors ${
                    selectedIndex === i
                      ? "bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/50"
                      : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50"
                  }`}
              >
                WP{i + 1}: [{Math.round(wp.position[0])},{" "}
                {Math.round(wp.position[1])}, {Math.round(wp.position[2])}]
              </div>
            ))}
          </div>
        )}

        {waypoints.length === 0 && (
          <div className="text-xs text-zinc-600 italic">No waypoints</div>
        )}
      </div>
    </Panel>
  );
}
