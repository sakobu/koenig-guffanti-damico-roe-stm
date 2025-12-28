/**
 * Multi-Waypoint Mission Planner
 *
 * Plans complete RPO missions by chaining two-burn rendezvous legs
 * between sequential waypoints. Each waypoint is reached stationary.
 *
 * Architecture:
 *   [Deputy] --dv1--> coast --dv2--> [WP1] --dv1--> coast --dv2--> [WP2] ...
 */

import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { RelativeState, Vector3 } from "../types/vectors";
import type {
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  Waypoint,
} from "../types/targeting";

import { ZERO_VECTOR3 } from "../math/vectors";
import { solveRendezvous } from "./rendezvous";
import { optimizeTOF } from "./tof-optimizer";

/**
 * Plan a complete multi-waypoint mission.
 *
 * Computes the maneuver sequence to visit all waypoints in order,
 * arriving stationary at each one before departing to the next.
 * @param initialState - Deputy starting RIC state (position + velocity) [m, m/s]
 * @param waypoints - Ordered list of target waypoints
 * @param chief - Chief orbital elements at mission start
 * @param options - Targeting options (J2, drag, tolerances, etc.)
 * @returns Complete mission plan with all maneuver legs
 */
export const planMission = (
  initialState: RelativeState,
  waypoints: readonly Waypoint[],
  chief: ClassicalOrbitalElements,
  options?: TargetingOptions
): MissionPlan => {
  // Handle empty waypoint list
  if (waypoints.length === 0) {
    return {
      legs: [],
      totalDeltaV: 0,
      totalTime: 0,
      converged: true,
    };
  }

  const legs: ManeuverLeg[] = [];
  let currentState = initialState;
  let currentChief = chief;
  let totalDeltaV = 0;
  let totalTime = 0;
  let allConverged = true;

  for (const waypoint of waypoints) {
    // Solve this leg (optimize TOF if no hint provided)
    const leg: ManeuverLeg =
      waypoint.tofHint === undefined
        ? optimizeTOF(currentState, waypoint.position, currentChief, options)
        : solveRendezvous(
            currentState,
            waypoint.position,
            currentChief,
            waypoint.tofHint,
            options
          );

    legs.push(leg);
    totalDeltaV += leg.totalDeltaV;
    totalTime += leg.tof;
    allConverged = allConverged && leg.converged;

    // Update state for next leg:
    // After arriving and nulling velocity, deputy is stationary at waypoint
    currentState = {
      position: waypoint.position,
      velocity: ZERO_VECTOR3,
    };

    // Chief state at arrival becomes starting chief for next leg
    currentChief = leg.burn2.chief;
  }

  return {
    legs,
    totalDeltaV,
    totalTime,
    converged: allConverged,
  };
};

/**
 * Replan mission from a specific waypoint index.
 *
 * Useful for interactive editing: when a waypoint is moved, only
 * the legs affected by that change need to be recomputed.
 * @param existingPlan - Current mission plan
 * @param modifiedIndex - Index of the first modified waypoint (0-based)
 * @param newWaypoints - New waypoint list (may have different length)
 * @param initialChief - Chief orbital elements at mission start
 * @param initialState - Deputy starting RIC state
 * @param options - Targeting options
 * @returns Updated mission plan
 */
export const replanFromWaypoint = (
  existingPlan: MissionPlan,
  modifiedIndex: number,
  newWaypoints: readonly Waypoint[],
  initialChief: ClassicalOrbitalElements,
  initialState: RelativeState,
  options?: TargetingOptions
): MissionPlan => {
  // If modification is at or before first waypoint, replan entire mission
  if (modifiedIndex <= 0) {
    return planMission(initialState, newWaypoints, initialChief, options);
  }

  // Keep legs before the modification
  const keptLegs = existingPlan.legs.slice(0, modifiedIndex);

  // Compute state at the waypoint just before modification
  let priorChief = initialChief;
  let priorState = initialState;

  for (let i = 0; i < modifiedIndex; i++) {
    const leg = existingPlan.legs[i];
    if (leg) {
      priorState = {
        position: leg.to,
        velocity: ZERO_VECTOR3,
      };
      priorChief = leg.burn2.chief;
    }
  }

  // Plan remaining waypoints from the modification point
  const remainingWaypoints = newWaypoints.slice(modifiedIndex);
  const remainingPlan = planMission(
    priorState,
    remainingWaypoints,
    priorChief,
    options
  );

  // Combine kept legs with new legs
  const allLegs = [...keptLegs, ...remainingPlan.legs];

  return {
    legs: allLegs,
    totalDeltaV: allLegs.reduce((sum, leg) => sum + leg.totalDeltaV, 0),
    totalTime: allLegs.reduce((sum, leg) => sum + leg.tof, 0),
    converged: keptLegs.every((l) => l.converged) && remainingPlan.converged,
  };
};

/**
 * Compute the state at a specific point in the mission.
 *
 * Useful for determining intermediate positions during coast phases.
 * @param plan - Mission plan
 * @param time - Time from mission start [seconds]
 * @returns Leg index and time within that leg, or null if time exceeds mission
 */
export const getMissionStateAtTime = (
  plan: MissionPlan,
  time: number
): { legIndex: number; timeInLeg: number } | null => {
  if (time < 0) {
    return null;
  }

  let accumulatedTime = 0;

  for (let i = 0; i < plan.legs.length; i++) {
    const leg = plan.legs[i];
    if (leg && accumulatedTime + leg.tof >= time) {
      return {
        legIndex: i,
        timeInLeg: time - accumulatedTime,
      };
    }
    if (leg) {
      accumulatedTime += leg.tof;
    }
  }

  // Time exceeds mission duration
  return null;
};

/**
 * Extract waypoint positions from a mission plan.
 *
 * Convenience function for visualization.
 * @param plan - Mission plan
 * @param includeStart - Whether to include the starting position
 * @returns Array of waypoint positions
 */
export const extractWaypointPositions = (
  plan: MissionPlan,
  includeStart: boolean = true
): Vector3[] => {
  const positions: Vector3[] = [];

  const firstLeg = plan.legs[0];
  if (includeStart && firstLeg) {
    positions.push(firstLeg.from);
  }

  for (const leg of plan.legs) {
    positions.push(leg.to);
  }

  return positions;
};

/**
 * Compute mission summary statistics.
 * @param plan - Mission plan
 * @returns Summary statistics
 */
export const getMissionSummary = (
  plan: MissionPlan
): {
  numWaypoints: number;
  numManeuvers: number;
  totalDeltaV: number;
  totalTime: number;
  averageLegDeltaV: number;
  averageLegTime: number;
  converged: boolean;
} => {
  const numWaypoints = plan.legs.length;
  const numManeuvers = plan.legs.length * 2; // 2 burns per leg

  return {
    numWaypoints,
    numManeuvers,
    totalDeltaV: plan.totalDeltaV,
    totalTime: plan.totalTime,
    averageLegDeltaV: numWaypoints > 0 ? plan.totalDeltaV / numWaypoints : 0,
    averageLegTime: numWaypoints > 0 ? plan.totalTime / numWaypoints : 0,
    converged: plan.converged,
  };
};
