/**
 * Trajectory Output Generator
 *
 * Generates dense trajectory data for visualization (e.g., R3F rendering).
 * Propagates ROE state at regular intervals and converts to RIC positions.
 */

import type { ROEPropagationOptions } from "../core/types/config";
import type { ClassicalOrbitalElements } from "../core/types/orbital-elements";
import type { Vector3 } from "../core/types/vectors";
import type {
  ManeuverLeg,
  MissionPlan,
  TargetingOptions,
  TrajectoryPoint,
} from "./types";

import { ricToROE, roeToRIC } from "../dynamics/roe-ric";
import { propagateROEWithChief } from "../dynamics/propagation";
import { roeToVector, vectorToROE } from "../dynamics/roe-state";
import { applyDeltaV } from "./control-matrix";
import { ZERO_VECTOR3 } from "./matrix-utils";

/**
 * Generate dense trajectory points for a single maneuver leg.
 *
 * The trajectory starts immediately after the departure burn (dv1)
 * and ends just before the arrival burn (dv2).
 * @param leg - Solved maneuver leg
 * @param chief - Chief orbital elements at leg start (before dv1)
 * @param initialPosition - Deputy position at leg start
 * @param initialVelocity - Deputy velocity at leg start (before dv1)
 * @param options - Targeting options for propagation
 * @param numPoints - Number of trajectory points (default: 100)
 * @returns Array of trajectory points with time, position, and velocity
 */
export const generateLegTrajectory = (
  leg: ManeuverLeg,
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  initialVelocity: Vector3,
  options?: TargetingOptions,
  numPoints: number = 100
): readonly TrajectoryPoint[] => {
  const propOptions: ROEPropagationOptions = {
    includeJ2: options?.includeJ2 ?? true,
    includeDrag: options?.includeDrag ?? false,
    dragConfig: options?.dragConfig,
  };

  // Convert initial state to ROE and apply dv1
  const initialRIC = { position: initialPosition, velocity: initialVelocity };
  const initialROE = roeToVector(ricToROE(chief, initialRIC));
  const roeAfterDv1 = applyDeltaV(initialROE, leg.burn1.deltaV, chief);

  const trajectory: TrajectoryPoint[] = [];
  const dt = leg.tof / (numPoints - 1);

  // Generate points along the coast arc
  for (let i = 0; i < numPoints; i++) {
    const t = i * dt;

    if (t === 0) {
      // Initial point (immediately after dv1)
      const ricAfterDv1 = roeToRIC(chief, vectorToROE(roeAfterDv1));
      trajectory.push({
        time: 0,
        position: ricAfterDv1.position,
        velocity: ricAfterDv1.velocity,
      });
    } else {
      // Propagate to time t
      const { roe, chief: chiefAtT } = propagateROEWithChief(
        vectorToROE(roeAfterDv1),
        chief,
        t,
        propOptions
      );
      const ricAtT = roeToRIC(chiefAtT, roe);

      trajectory.push({
        time: t,
        position: ricAtT.position,
        velocity: ricAtT.velocity,
      });
    }
  }

  return trajectory;
};

/**
 * Generate dense trajectory for an entire mission.
 *
 * Concatenates trajectories from all legs with appropriate time offsets.
 * @param plan - Complete mission plan
 * @param initialChief - Chief orbital elements at mission start
 * @param initialPosition - Deputy starting position
 * @param initialVelocity - Deputy starting velocity
 * @param options - Targeting options for propagation
 * @param pointsPerLeg - Number of points per leg (default: 100)
 * @returns Array of trajectory points spanning entire mission
 */
export const generateMissionTrajectory = (
  plan: MissionPlan,
  initialChief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  initialVelocity: Vector3,
  options?: TargetingOptions,
  pointsPerLeg: number = 100
): readonly TrajectoryPoint[] => {
  if (plan.legs.length === 0) {
    return [];
  }

  const trajectory: TrajectoryPoint[] = [];
  let timeOffset = 0;
  let currentChief = initialChief;
  let currentPosition = initialPosition;
  let currentVelocity = initialVelocity;

  for (const leg of plan.legs) {
    // Generate trajectory for this leg
    const legTrajectory = generateLegTrajectory(
      leg,
      currentChief,
      currentPosition,
      currentVelocity,
      options,
      pointsPerLeg
    );

    // Add points with time offset
    for (const point of legTrajectory) {
      trajectory.push({
        time: timeOffset + point.time,
        position: point.position,
        velocity: point.velocity,
      });
    }

    // Update for next leg
    timeOffset += leg.tof;
    currentChief = leg.burn2.chief;
    currentPosition = leg.to;
    currentVelocity = ZERO_VECTOR3; // Stationary after arrival
  }

  return trajectory;
};

/**
 * Generate trajectory with maneuver markers.
 *
 * Returns trajectory points plus separate arrays for burn locations.
 * Useful for visualization with distinct maneuver indicators.
 * @param plan - Mission plan
 * @param initialChief - Chief at mission start
 * @param initialPosition - Deputy starting position
 * @param initialVelocity - Deputy starting velocity
 * @param options - Targeting options
 * @param pointsPerLeg - Points per leg
 * @returns Trajectory data with burn markers
 */
export const generateTrajectoryWithManeuvers = (
  plan: MissionPlan,
  initialChief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  initialVelocity: Vector3,
  options?: TargetingOptions,
  pointsPerLeg: number = 100
): {
  trajectory: readonly TrajectoryPoint[];
  departureBurns: readonly {
    time: number;
    position: Vector3;
    deltaV: Vector3;
  }[];
  arrivalBurns: readonly { time: number; position: Vector3; deltaV: Vector3 }[];
} => {
  const trajectory = generateMissionTrajectory(
    plan,
    initialChief,
    initialPosition,
    initialVelocity,
    options,
    pointsPerLeg
  );

  const departureBurns: { time: number; position: Vector3; deltaV: Vector3 }[] =
    [];
  const arrivalBurns: { time: number; position: Vector3; deltaV: Vector3 }[] =
    [];

  let timeOffset = 0;
  let currentPosition = initialPosition;

  for (const leg of plan.legs) {
    // Departure burn at start of leg
    departureBurns.push({
      time: timeOffset,
      position: currentPosition,
      deltaV: leg.burn1.deltaV,
    });

    // Arrival burn at end of leg
    arrivalBurns.push({
      time: timeOffset + leg.tof,
      position: leg.to,
      deltaV: leg.burn2.deltaV,
    });

    timeOffset += leg.tof;
    currentPosition = leg.to;
  }

  return { trajectory, departureBurns, arrivalBurns };
};

/**
 * Sample trajectory at uniform time intervals.
 *
 * Useful for animations that need evenly-spaced frames.
 * @param trajectory - Dense trajectory points
 * @param numSamples - Number of output samples
 * @returns Uniformly sampled trajectory
 */
export const sampleTrajectoryUniform = (
  trajectory: readonly TrajectoryPoint[],
  numSamples: number
): readonly TrajectoryPoint[] => {
  if (trajectory.length === 0 || numSamples <= 0) {
    return [];
  }

  const firstPoint = trajectory[0];
  if (!firstPoint) {
    return [];
  }

  if (trajectory.length === 1 || numSamples === 1) {
    return [firstPoint];
  }

  const lastPoint = trajectory.at(-1);
  if (!lastPoint) {
    return [firstPoint];
  }
  const totalTime = lastPoint.time - firstPoint.time;
  const dt = totalTime / (numSamples - 1);
  const samples: TrajectoryPoint[] = [];

  for (let i = 0; i < numSamples; i++) {
    const targetTime = firstPoint.time + i * dt;
    const point = interpolateTrajectory(trajectory, targetTime);
    if (point) {
      samples.push(point);
    }
  }

  return samples;
};

/**
 * Interpolate trajectory at a specific time.
 * @param trajectory - Dense trajectory points
 * @param time - Target time
 * @returns Interpolated point or null if time is out of bounds
 */
const interpolateTrajectory = (
  trajectory: readonly TrajectoryPoint[],
  time: number
): TrajectoryPoint | null => {
  if (trajectory.length === 0) {
    return null;
  }

  const firstPoint = trajectory[0];
  const lastPoint = trajectory.at(-1);

  // Guard against undefined (should not happen given length check)
  if (!firstPoint || !lastPoint) {
    return null;
  }

  // Handle boundary cases
  if (time <= firstPoint.time) {
    return firstPoint;
  }
  if (time >= lastPoint.time) {
    return lastPoint;
  }

  // Binary search for bracketing points
  let low = 0;
  let high = trajectory.length - 1;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    const midPoint = trajectory[mid];
    if (midPoint && midPoint.time <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Linear interpolation between bracketing points
  const p1 = trajectory[low];
  const p2 = trajectory[high];

  if (!p1 || !p2) {
    return null;
  }
  const alpha = (time - p1.time) / (p2.time - p1.time);

  return {
    time,
    position: [
      p1.position[0] + alpha * (p2.position[0] - p1.position[0]),
      p1.position[1] + alpha * (p2.position[1] - p1.position[1]),
      p1.position[2] + alpha * (p2.position[2] - p1.position[2]),
    ],
    velocity: [
      p1.velocity[0] + alpha * (p2.velocity[0] - p1.velocity[0]),
      p1.velocity[1] + alpha * (p2.velocity[1] - p1.velocity[1]),
      p1.velocity[2] + alpha * (p2.velocity[2] - p1.velocity[2]),
    ],
  };
};
