/**
 * Type Definitions
 *
 * Centralized type exports for the koenig-roe library.
 */

// Vectors and state
export type {
  RelativeState,
  ROEVector,
  ROEVector7,
  ROEVector9,
  Vector3,
} from './vectors';

// Matrices
export type {
  DragColumns6x3,
  DragRow3,
  Row6,
  Row7,
  Row9,
  STM6,
  STM7,
  STM9,
} from './matrices';

// Orbital elements
export type {
  ApsidalState,
  ClassicalOrbitalElements,
  OrbitalFactors,
  QuasiNonsingularROE,
  TrueAnomaly,
} from './orbital-elements';

// Configuration
export type {
  DragConfig,
  DragConfigArbitrary,
  DragConfigEccentric,
  ROEPropagationOptions,
} from './config';

// Targeting
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
} from './targeting';
