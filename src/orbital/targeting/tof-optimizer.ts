/**
 * Time-of-Flight Optimizer
 *
 * Finds the optimal TOF that minimizes total delta-v for a rendezvous leg.
 * Uses golden section search for robust convergence.
 *
 * Reference: Standard optimization techniques for spacecraft trajectory design.
 */

import { TWO_PI } from '@utils/angle';

import { meanMotion } from '../math/kepler';
import type { ClassicalOrbitalElements } from '../types/orbital-elements';
import type { ManeuverLeg, TargetingOptions } from '../types/targeting';
import type { RelativeState, Vector3 } from '../types/vectors';
import { solveRendezvous } from './rendezvous';

// Golden ratio for golden section search
const PHI = (1 + Math.sqrt(5)) / 2;
const GOLDEN_RATIO = 1 / PHI;

// Default search parameters
const DEFAULT_MIN_ORBITS = 0.5;
const DEFAULT_MAX_ORBITS = 3;
const DEFAULT_TOF_TOLERANCE_FRACTION = 0.01; // 1% of orbital period

/**
 * Optimize time-of-flight to minimize total delta-v.
 *
 * Uses golden section search to find the TOF that results in minimum
 * combined delta-v (dv1 + dv2) for the rendezvous maneuver.
 * @param initialState - Deputy starting RIC state
 * @param targetPosition - Target RIC position [m]
 * @param chief - Chief orbital elements at t=0
 * @param options - Targeting options including TOF search range
 * @returns Optimal maneuver leg with minimum delta-v
 */
export const optimizeTOF = (
  initialState: RelativeState,
  targetPosition: Vector3,
  chief: ClassicalOrbitalElements,
  options?: TargetingOptions
): ManeuverLeg => {
  // Compute orbital period for search bounds
  const n = meanMotion(chief.semiMajorAxis, chief.gravitationalParameter);
  const period = TWO_PI / n;

  // Get search bounds from options or use defaults
  const minOrbits = options?.tofSearchRange?.minOrbits ?? DEFAULT_MIN_ORBITS;
  const maxOrbits = options?.tofSearchRange?.maxOrbits ?? DEFAULT_MAX_ORBITS;

  const tofMin = minOrbits * period;
  const tofMax = maxOrbits * period;
  const tolerance = DEFAULT_TOF_TOLERANCE_FRACTION * period;

  // Golden section search
  let a = tofMin;
  let b = tofMax;
  let c = b - (b - a) * GOLDEN_RATIO;
  let d = a + (b - a) * GOLDEN_RATIO;

  // Evaluate cost function (total delta-v) at initial points
  let fc = evaluateDeltaV(initialState, targetPosition, chief, c, options);
  let fd = evaluateDeltaV(initialState, targetPosition, chief, d, options);

  // Iterate until converged
  while (Math.abs(b - a) > tolerance) {
    if (fc < fd) {
      // Minimum is in [a, d]
      b = d;
      d = c;
      fd = fc;
      c = b - (b - a) * GOLDEN_RATIO;
      fc = evaluateDeltaV(initialState, targetPosition, chief, c, options);
    } else {
      // Minimum is in [c, b]
      a = c;
      c = d;
      fc = fd;
      d = a + (b - a) * GOLDEN_RATIO;
      fd = evaluateDeltaV(initialState, targetPosition, chief, d, options);
    }
  }

  // Optimal TOF is midpoint of final interval
  const optimalTOF = (a + b) / 2;

  // Solve with optimal TOF
  return solveRendezvous(
    initialState,
    targetPosition,
    chief,
    optimalTOF,
    options
  );
};

/**
 * Evaluate total delta-v for a given TOF.
 *
 * Returns Infinity if the solver fails to converge.
 * @param initialState - Initial RIC state
 * @param targetPosition - Target position
 * @param chief - Chief elements
 * @param tof - Time of flight to evaluate
 * @param options - Targeting options
 * @returns Total delta-v or Infinity if solver fails
 */
const evaluateDeltaV = (
  initialState: RelativeState,
  targetPosition: Vector3,
  chief: ClassicalOrbitalElements,
  tof: number,
  options?: TargetingOptions
): number => {
  try {
    const leg = solveRendezvous(
      initialState,
      targetPosition,
      chief,
      tof,
      options
    );
    // Penalize non-converged solutions
    if (!leg.converged) {
      return Infinity;
    }
    return leg.totalDeltaV;
  } catch {
    // Solver threw an error (e.g., singular Jacobian)
    return Infinity;
  }
};

/**
 * Find optimal TOF with multi-start to handle multiple local minima.
 *
 * For transfers that may have multiple local minima (e.g., different
 * revolution options), this function samples multiple starting points
 * and returns the globally best solution found.
 * @param initialState - Deputy starting RIC state
 * @param targetPosition - Target RIC position [m]
 * @param chief - Chief orbital elements at t=0
 * @param options - Targeting options
 * @param numSamples - Number of initial samples (default: 5)
 * @returns Best maneuver leg found across all samples
 */
export const optimizeTOFMultiStart = (
  initialState: RelativeState,
  targetPosition: Vector3,
  chief: ClassicalOrbitalElements,
  options?: TargetingOptions,
  numSamples: number = 5
): ManeuverLeg => {
  const n = meanMotion(chief.semiMajorAxis, chief.gravitationalParameter);
  const period = TWO_PI / n;

  const minOrbits = options?.tofSearchRange?.minOrbits ?? DEFAULT_MIN_ORBITS;
  const maxOrbits = options?.tofSearchRange?.maxOrbits ?? DEFAULT_MAX_ORBITS;

  const tofMin = minOrbits * period;
  const tofMax = maxOrbits * period;

  // Sample TOFs uniformly across the search range
  const sampleTOFs: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    sampleTOFs.push(tofMin + ((tofMax - tofMin) * i) / (numSamples - 1));
  }

  // Evaluate each sample and keep track of best
  let bestLeg: ManeuverLeg | null = null;
  let bestDeltaV = Infinity;

  for (const tof of sampleTOFs) {
    try {
      const leg = solveRendezvous(
        initialState,
        targetPosition,
        chief,
        tof,
        options
      );
      if (leg.converged && leg.totalDeltaV < bestDeltaV) {
        bestDeltaV = leg.totalDeltaV;
        bestLeg = leg;
      }
    } catch {
      // Skip failed samples
    }
  }

  // If no sample worked, try the default optimizer
  if (bestLeg === null) {
    return optimizeTOF(initialState, targetPosition, chief, options);
  }

  // Refine the best sample with local golden section search
  // Use a narrower search window around the best TOF found
  const refinedOptions: TargetingOptions = {
    ...options,
    tofSearchRange: {
      minOrbits: Math.max(minOrbits, bestLeg.tof / period - 0.25),
      maxOrbits: Math.min(maxOrbits, bestLeg.tof / period + 0.25),
    },
  };

  return optimizeTOF(initialState, targetPosition, chief, refinedOptions);
};
