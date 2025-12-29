import { useState, useEffect } from "react";
import { useMissionStore } from "../../stores/mission";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const waypoints = useMissionStore((state) => state.waypoints);
  const missionPlan = useMissionStore((state) => state.missionPlan);
  const selectedIndex = useMissionStore((state) => state.selectedWaypointIndex);
  const selectWaypoint = useMissionStore((state) => state.selectWaypoint);
  const removeWaypoint = useMissionStore((state) => state.removeWaypoint);
  const clearWaypoints = useMissionStore((state) => state.clearWaypoints);

  // Keyboard handling
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
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-70 bg-zinc-900/90
          z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-sm font-semibold text-zinc-100 tracking-wide">
            Koenig & D'Amico RPO Simulator
          </h1>
        </div>

        {/* Content area */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
          {/* Waypoint controls */}
          <div className="space-y-2">
            <div className="text-xs text-zinc-500 uppercase tracking-wider">
              Waypoints
            </div>
            <div className="text-xs text-zinc-500 mb-2">
              Shift+click on grid to add
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIndex === null}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500
                  text-white text-sm font-medium rounded transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={clearWaypoints}
                disabled={waypoints.length === 0}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600
                  text-zinc-300 text-sm rounded transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
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
          </div>

          {/* Mission summary */}
          {missionPlan && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                Mission Summary
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Delta-V:</span>
                  <span className="font-mono text-cyan-400">
                    {missionPlan.totalDeltaV.toFixed(4)} m/s
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Total Time:</span>
                  <span className="font-mono text-cyan-400">
                    {(missionPlan.totalTime / 60).toFixed(1)} min
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Converged:</span>
                  <span
                    className={
                      missionPlan.converged ? "text-green-400" : "text-red-400"
                    }
                  >
                    {missionPlan.converged ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-0.5 z-50 w-7 h-7 flex items-center justify-center
          bg-zinc-900/80 rounded cursor-pointer
          text-zinc-400 hover:text-zinc-100 transition-all duration-300 ease-in-out
          ${isOpen ? "left-66" : "left-0"}`}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </>
  );
}
