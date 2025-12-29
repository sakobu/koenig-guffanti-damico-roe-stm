import { useMissionStore } from "../../stores/mission";
import Panel from "./Panel";

export default function MissionSummaryPanel() {
  const missionPlan = useMissionStore((state) => state.missionPlan);

  if (!missionPlan) {
    return (
      <Panel title="Mission Summary" defaultOpen>
        <div className="text-xs text-zinc-600 italic">
          Add waypoints to see mission summary
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Mission Summary" defaultOpen>
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
        <div className="flex justify-between text-zinc-400">
          <span>Legs:</span>
          <span className="font-mono text-zinc-300">
            {missionPlan.legs.length}
          </span>
        </div>
      </div>
    </Panel>
  );
}
