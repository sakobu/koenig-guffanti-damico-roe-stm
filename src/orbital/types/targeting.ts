/**
 * Targeting and mission planning type definitions.
 *
 * Types for impulsive maneuver planning and multi-waypoint trajectory optimization.
 *
 * Reference: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit,"
 * PhD Thesis, TU Delft, 2010, Section 2.2.2 (Gauss Variational Equations)
 */

import type { DragConfig } from "./config";
import type { ClassicalOrbitalElements } from "./orbital-elements";
import type { Vector3 } from "./vectors";

// ============================================================================
// Waypoint and Maneuver Types
// ============================================================================

/**
 * Target waypoint definition.
 *
 * Specifies a desired RIC position for the deputy to reach.
 * The deputy will arrive stationary (zero relative velocity) at each waypoint.
 */
export type Waypoint = {
  /** Target RIC position [R, I, C] in meters */
  readonly position: Vector3;
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
 * 3. Arrival burn (dv2) to null relative velocity
 */
export type ManeuverLeg = {
  /** Starting RIC position [m] */
  readonly from: Vector3;
  /** Target RIC position [m] */
  readonly to: Vector3;
  /** Time of flight for this leg [seconds] */
  readonly tof: number;
  /** Departure burn */
  readonly burn1: Maneuver;
  /** Arrival burn (nulls relative velocity) */
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
