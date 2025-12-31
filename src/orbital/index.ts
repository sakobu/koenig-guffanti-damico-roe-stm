/**
 * RPO Library - Spacecraft Rendezvous & Proximity Operations
 *
 * TypeScript implementation of ROE-based mission planning algorithms.
 * Based on Koenig et al. (2017) and D'Amico (2010).
 */

// Types
export type {
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
} from "./types/orbital-elements";
export type { RelativeState, Vector3 } from "./types/vectors";
export type {
  DragConfig,
  DragConfigEccentric,
  DragConfigArbitrary,
} from "./types/config";
export type {
  Waypoint,
  Maneuver,
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  TrajectoryPoint,
  TargetingValidationCode,
  TargetingValidationResult,
} from "./types/targeting";

// Validation
export { validateTargetingConfig } from "./targeting/validation";

// Constants
export { J2, MU_EARTH, R_EARTH, SECONDS_PER_DAY } from "./constants";

// Kepler utilities
export {
  trueAnomalyFromMean,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  angularVelocity,
} from "./math/kepler";

// Mission planning
export {
  planMission,
  replanFromWaypoint,
  getMissionStateAtTime,
  getMissionSummary,
  extractWaypointPositions,
} from "./targeting/planner";

// Trajectory generation
export {
  generateLegTrajectory,
  generateMissionTrajectory,
  generateTrajectoryWithManeuvers,
  sampleTrajectoryUniform,
} from "./targeting/trajectory";

// ROE transforms
export { ricToROE, roeToRIC } from "./transforms/roe-ric";
