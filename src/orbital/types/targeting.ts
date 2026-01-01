/**
 * Targeting Module Type Definitions
 *
 * Types for impulsive maneuver planning and multi-waypoint trajectory optimization.
 *
 * Reference: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit,"
 * PhD Thesis, TU Delft, 2010, Section 2.2.2 (Gauss Variational Equations)
 */

import type { DragConfig } from './config';
import type { ClassicalOrbitalElements } from './orbital-elements';
import type { Vector3 } from './vectors';

// ============================================================================
// Matrix Types
// ============================================================================

/**
 * 6x3 Control Influence Matrix.
 *
 * Maps RIC delta-v [dvR, dvI, dvC] to instantaneous ROE change.
 * Derived from Gauss Variational Equations (D'Amico 2010, Eq. 2.38).
 */
export type ControlMatrix6x3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

/**
 * 3x6 matrix for position extraction or transpose operations.
 */
export type Matrix3x6 = readonly [
  readonly [number, number, number, number, number, number],
  readonly [number, number, number, number, number, number],
  readonly [number, number, number, number, number, number],
];

/**
 * 3x3 matrix for linear system solving.
 */
export type Matrix3x3 = readonly [Vector3, Vector3, Vector3];

// ============================================================================
// Waypoint and Maneuver Types
// ============================================================================

/**
 * Target waypoint definition.
 *
 * Specifies a desired RIC position for the deputy to reach.
 * Velocity defaults to [0,0,0] (stationary arrival) if not specified.
 */
export type Waypoint = {
  /** Target RIC position [R, I, C] in meters */
  readonly position: Vector3;
  /** Target RIC velocity [vR, vI, vC] in m/s. Defaults to [0,0,0] (stationary arrival). */
  readonly velocity?: Vector3;
  /** Optional time-of-flight hint in seconds. If omitted, TOF is auto-optimized. */
  readonly tofHint?: number;
};

/**
 * Single impulsive maneuver result.
 *
 * Represents one delta-v burn at a specific point in the mission.
 */
export type Maneuver = {
  /** Delta-v vector in RIC frame [dvR, dvI, dvC] in m/s */
  readonly deltaV: Vector3;
  /** Magnitude of delta-v |dv| in m/s */
  readonly magnitude: number;
  /** Chief orbital elements at the time of this burn */
  readonly chief: ClassicalOrbitalElements;
};

/**
 * Two-burn rendezvous leg between waypoints.
 *
 * Each leg consists of:
 * 1. Departure burn (dv1) to initiate transfer
 * 2. Coast phase under natural dynamics (J2 + optional drag)
 * 3. Arrival burn (dv2) to achieve target velocity
 */
export type ManeuverLeg = {
  /** Starting RIC position [m] */
  readonly from: Vector3;
  /** Target RIC position [m] */
  readonly to: Vector3;
  /** Target RIC velocity [m/s]. Zero vector means stationary arrival. */
  readonly targetVelocity: Vector3;
  /** Time of flight for this leg [seconds] */
  readonly tof: number;
  /** Departure burn */
  readonly burn1: Maneuver;
  /** Arrival burn (achieves target velocity) */
  readonly burn2: Maneuver;
  /** Total delta-v for this leg: |dv1| + |dv2| [m/s] */
  readonly totalDeltaV: number;
  /** Whether the solver converged within tolerance */
  readonly converged: boolean;
  /** Number of iterations used by the solver */
  readonly iterations: number;
  /** Final position error magnitude [meters] */
  readonly positionError: number;
};

/**
 * Complete multi-waypoint mission plan.
 *
 * Contains all maneuver legs and summary statistics.
 */
export type MissionPlan = {
  /** Ordered list of maneuver legs */
  readonly legs: readonly ManeuverLeg[];
  /** Total delta-v for entire mission [m/s] */
  readonly totalDeltaV: number;
  /** Total mission duration [seconds] */
  readonly totalTime: number;
  /** Whether all legs converged successfully */
  readonly converged: boolean;
};

// ============================================================================
// Solver Configuration
// ============================================================================

/**
 * Configuration options for the targeting solver.
 *
 * Controls perturbation models, convergence criteria, and TOF search bounds.
 */
export type TargetingOptions = {
  /**
   * Include J2 perturbation effects.
   * Default: true
   */
  readonly includeJ2?: boolean;

  /**
   * Include differential drag effects.
   * Default: false
   *
   * When enabled, requires dragConfig to be provided.
   * J2 effects are always included with drag (per Koenig et al. 2017).
   */
  readonly includeDrag?: boolean;

  /**
   * Drag model configuration.
   * Required if includeDrag is true.
   */
  readonly dragConfig?: DragConfig;

  /**
   * Maximum iterations for Newton-Raphson solver.
   * Default: 50
   */
  readonly maxIterations?: number;

  /**
   * Position convergence tolerance [meters].
   * Default: 1.0
   */
  readonly positionTolerance?: number;

  /**
   * Velocity convergence tolerance [m/s].
   * Default: 0.001
   */
  readonly velocityTolerance?: number;

  /**
   * Target arrival velocity [m/s].
   * Default: [0,0,0] (arrive stationary)
   *
   * When specified, dv2 will be computed to achieve this velocity
   * rather than nulling all relative velocity.
   */
  readonly targetVelocity?: Vector3;

  /**
   * Search range for TOF optimization (in orbital periods).
   * Used when waypoint.tofHint is not provided.
   */
  readonly tofSearchRange?: {
    /** Minimum TOF in orbital periods. Default: 0.5 */
    readonly minOrbits: number;
    /** Maximum TOF in orbital periods. Default: 3.0 */
    readonly maxOrbits: number;
  };
};

// ============================================================================
// Trajectory Output Types
// ============================================================================

/**
 * Single point along a trajectory.
 *
 * Used for dense output generation (visualization, analysis).
 */
export type TrajectoryPoint = {
  /** Time from leg/mission start [seconds] */
  readonly time: number;
  /** RIC position [R, I, C] in meters */
  readonly position: Vector3;
  /** RIC velocity [vR, vI, vC] in m/s */
  readonly velocity: Vector3;
};

// ============================================================================
// Validation Types (for UI-friendly error handling)
// ============================================================================

/**
 * Error codes for targeting configuration validation.
 *
 * UI code can use these codes for conditional logic (e.g., show different
 * warnings, disable specific buttons, suggest fixes).
 */
export type TargetingValidationCode =
  | 'DRAG_MISSING_CONFIG'
  | 'DRAG_ECCENTRICITY_TOO_LOW'
  | 'INVALID_SEMI_MAJOR_AXIS'
  | 'INVALID_ECCENTRICITY'
  | 'INVALID_GRAVITATIONAL_PARAMETER'
  | 'NEAR_EQUATORIAL_ORBIT';

/**
 * Validation result for targeting configuration.
 *
 * Use `validateTargetingConfig()` BEFORE calling `planMission()` to catch
 * configuration errors upfront. This allows UI to show user-friendly messages
 * without needing try-catch around mission planning.
 */
export type TargetingValidationResult =
  | { readonly valid: true }
  | {
      readonly valid: false;
      /** Machine-readable error code for UI logic */
      readonly code: TargetingValidationCode;
      /** Human-readable error message for display */
      readonly message: string;
      /** Suggested fix for the user */
      readonly suggestion?: string;
    };
