/**
 * Targeting Module
 *
 * Multi-waypoint RPO trajectory planning with J2+Drag support.
 * Computes impulsive maneuvers for waypoint-based mission planning.
 *
 * Main API:
 * - planMission: Plan a complete multi-waypoint mission
 * - solveRendezvous: Solve a single two-burn rendezvous leg
 * - optimizeTOF: Find optimal time-of-flight for minimum delta-v
 * - generateMissionTrajectory: Generate dense output for visualization
 *
 * Reference: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit,"
 * PhD Thesis, TU Delft, 2010
 */

// Main mission planning API
export {
  extractWaypointPositions,
  getMissionStateAtTime,
  getMissionSummary,
  planMission,
  replanFromWaypoint,
} from './planner';

// Single-leg rendezvous solver
export { solveRendezvous } from './rendezvous';

// TOF optimization
export { optimizeTOF, optimizeTOFMultiStart } from './tof-optimizer';

// Trajectory output for visualization
export {
  generateLegTrajectory,
  generateMissionTrajectory,
  generateTrajectoryWithManeuvers,
  sampleTrajectoryUniform,
} from './trajectory';

// Control matrix (for advanced users)
export {
  applyDeltaV,
  computeApproximateDeltaV,
  computeControlMatrix,
} from './control-matrix';

// Validation (for UI-friendly error handling)
export { validateTargetingConfig } from './validation';

// Types (re-exported from centralized types)
export type {
  ControlMatrix6x3,
  Maneuver,
  ManeuverLeg,
  Matrix3x3,
  Matrix3x6,
  MissionPlan,
  TargetingOptions,
  TargetingValidationCode,
  TargetingValidationResult,
  TrajectoryPoint,
  Waypoint,
} from '../types/targeting';
