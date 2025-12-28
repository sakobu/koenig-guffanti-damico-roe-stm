export type { ClassicalOrbitalElements } from "./core/types/orbital-elements";
export type { RelativeState, Vector3 } from "./core/types/vectors";
export type { DragConfigAuto } from "./core/types/config";

export { J2, MU_EARTH, R_EARTH, SECONDS_PER_DAY } from "./core/constants";

export {
  trueAnomalyFromMean,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  angularVelocity,
} from "./core/kepler";

export type {
  Waypoint,
  Maneuver,
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  TrajectoryPoint,
} from "./mission/types";

export {
  planMission,
  replanFromWaypoint,
  getMissionStateAtTime,
  getMissionSummary,
  extractWaypointPositions,
} from "./mission/planner";

export {
  generateLegTrajectory,
  generateMissionTrajectory,
  generateTrajectoryWithManeuvers,
  sampleTrajectoryUniform,
} from "./mission/trajectory-output";
