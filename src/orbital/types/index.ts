/**
 * Type Definitions
 *
 * Centralized type exports for the koenig-roe library.
 */

// Vectors and state
export type {
  Vector3,
  RelativeState,
  ROEVector,
  ROEVector7,
  ROEVector9,
} from "./vectors";

// Matrices
export type {
  Row6,
  Row7,
  Row9,
  DragRow3,
  STM6,
  STM7,
  STM9,
  DragColumns6x3,
} from "./matrices";

// Orbital elements
export type {
  TrueAnomaly,
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
  OrbitalFactors,
  ApsidalState,
} from "./orbital-elements";

// Configuration
export type {
  DragConfig,
  DragConfigEccentric,
  DragConfigArbitrary,
  ROEPropagationOptions,
} from "./config";

// Targeting
export type {
  ControlMatrix6x3,
  Matrix3x3,
  Matrix3x6,
  Waypoint,
  Maneuver,
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  TrajectoryPoint,
  TargetingValidationCode,
  TargetingValidationResult,
} from "./targeting";
