/**
 * RPO Library - Spacecraft Rendezvous & Proximity Operations
 *
 * TypeScript implementation of ROE-based mission planning algorithms.
 * Based on Koenig et al. (2017) and D'Amico (2010).
 */

// Types
export type {
  DragConfig,
  DragConfigArbitrary,
  DragConfigEccentric,
} from './types/config';
export type {
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
} from './types/orbital-elements';
export type {
  Maneuver,
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  TargetingValidationCode,
  TargetingValidationResult,
  TrajectoryPoint,
  Waypoint,
} from './types/targeting';
export type { RelativeState, Vector3 } from './types/vectors';

// Validation
export { validateTargetingConfig } from './targeting/validation';

// Constants
export { J2, MU_EARTH, R_EARTH, SECONDS_PER_DAY } from './constants';

// Kepler utilities
export {
  angularVelocity,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  trueAnomalyFromMean,
} from './math/kepler';

// Mission planning
export {
  extractWaypointPositions,
  getMissionStateAtTime,
  getMissionSummary,
  planMission,
  replanFromWaypoint,
} from './targeting/planner';

// Trajectory generation
export {
  generateLegTrajectory,
  generateMissionTrajectory,
  generateTrajectoryWithManeuvers,
  sampleTrajectoryUniform,
} from './targeting/trajectory';

// ROE transforms
export { ricToROE, roeToRIC } from './transforms/roe-ric';
