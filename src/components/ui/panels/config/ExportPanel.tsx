import { useMemo } from "react";
import { useMissionStore } from "@stores/mission";
import { exportMissionJSON, exportTrajectoryCSV } from "@utils/export";
import Panel from "../Panel";
import Button from "../../../shared/Button";
import type { DragConfig, TargetingOptions } from "@orbital";

/** Eccentricity threshold for eccentric drag model (from Koenig et al. 2017) */
const ECCENTRICITY_THRESHOLD = 0.05;

export default function ExportPanel() {
  const missionPlan = useMissionStore((state) => state.missionPlan);
  const waypoints = useMissionStore((state) => state.waypoints);
  const chief = useMissionStore((state) => state.chief);
  const scenario = useMissionStore((state) => state.scenario);
  const trajectoryPoints = useMissionStore((state) => state.trajectoryPoints);
  const initialPosition = useMissionStore((state) => state.initialPosition);
  const includeJ2 = useMissionStore((state) => state.includeJ2);
  const includeDrag = useMissionStore((state) => state.includeDrag);
  const daDotDrag = useMissionStore((state) => state.daDotDrag);
  const dexDotDrag = useMissionStore((state) => state.dexDotDrag);
  const deyDotDrag = useMissionStore((state) => state.deyDotDrag);

  // Build targeting options for exports
  const targetingOptions = useMemo((): TargetingOptions | undefined => {
    if (!includeJ2 && !includeDrag) return undefined;

    const isNearCircular = chief.eccentricity < ECCENTRICITY_THRESHOLD;
    const dragConfig: DragConfig = isNearCircular
      ? { type: "arbitrary", daDotDrag, dexDotDrag, deyDotDrag }
      : { type: "eccentric", daDotDrag };

    return {
      includeJ2,
      includeDrag,
      dragConfig: includeDrag ? dragConfig : undefined,
    };
  }, [
    includeJ2,
    includeDrag,
    chief.eccentricity,
    daDotDrag,
    dexDotDrag,
    deyDotDrag,
  ]);

  const handleExportJSON = () => {
    if (missionPlan) {
      exportMissionJSON(
        missionPlan,
        waypoints,
        chief,
        initialPosition,
        scenario,
        targetingOptions
      );
    }
  };

  const handleExportCSV = () => {
    if (missionPlan && trajectoryPoints.length > 0) {
      exportTrajectoryCSV(
        [...trajectoryPoints],
        missionPlan,
        chief,
        initialPosition,
        targetingOptions
      );
    }
  };

  const hasData = missionPlan !== null;
  const hasTrajectory = trajectoryPoints.length > 0;

  return (
    <Panel title="Export" defaultOpen>
      {hasData ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleExportJSON}
            className="flex-1"
          >
            Mission
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            disabled={!hasTrajectory}
            className="flex-1"
          >
            Ephemeris
          </Button>
        </div>
      ) : (
        <div className="text-xs text-zinc-600 italic">
          Add waypoints to enable export
        </div>
      )}
    </Panel>
  );
}
