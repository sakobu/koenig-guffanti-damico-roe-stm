/**
 * Main ROE Propagator Functions
 *
 * Provides unified interface for propagating Quasi-Nonsingular ROE
 * with selectable perturbation models (Keplerian, J2, J2+Drag).
 *
 * Reference: Koenig, Guffanti, D'Amico (2017)
 */

import { radToDeg } from '@utils/angle';

import { J2, R_EARTH } from '../constants';
import { meanMotion } from '../math/kepler';
import { matVecMul6 } from '../math/matrices';
import { computeKappa } from '../math/orbital-factors';
import { computeJ2STM } from '../stm/j2';
import { computeKeplerianSTM } from '../stm/keplerian';
import {
  normalizeAngle,
  roeToVector,
  vectorToROE,
} from '../transforms/roe-vector';
import type { ROEPropagationOptions } from '../types/config';
import type {
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
} from '../types/orbital-elements';
import type { ROEVector } from '../types/vectors';
import { propagateWithDrag } from './drag-dispatch';

/**
 * Propagate Quasi-Nonsingular ROE state forward in time.
 *
 * This is the main entry point for ROE propagation. It computes the
 * appropriate State Transition Matrix based on the options and applies
 * it to the initial ROE state.
 *
 * **Note on drag models:** When `includeDrag: true`, J2 effects are always
 * included because the drag STMs from Koenig et al. (2017) inherently couple
 * J2 (see Appendix C, D). Setting `includeJ2: false` with `includeDrag: true`
 * will throw an error. This is physically correct: in orbits where drag is
 * significant, J2 is always the dominant conservative perturbation.
 * @param initialROE - Initial relative orbital elements
 * @param chief - Chief spacecraft orbital elements at initial time
 * @param deltaTime - Propagation duration [seconds]
 * @param options - Propagation options (J2, drag, etc.)
 * @returns Propagated relative orbital elements
 * @example
 * ```typescript
 * // Basic J2 propagation
 * const finalROE = propagateROE(initialROE, chiefElements, 3600);
 *
 * // Keplerian only (no perturbations)
 * const finalROE = propagateROE(initialROE, chiefElements, 3600, {
 *   includeJ2: false,
 * });
 *
 * // With differential drag - eccentric model (e >= 0.05)
 * const finalROE = propagateROE(initialROE, chiefElements, 3600, {
 *   includeDrag: true,
 *   dragConfig: { type: "eccentric", daDotDrag: -1e-10 },
 * });
 * ```
 */
export const propagateROE = (
  initialROE: QuasiNonsingularROE,
  chief: ClassicalOrbitalElements,
  deltaTime: number,
  options: ROEPropagationOptions = {}
): QuasiNonsingularROE => {
  // Validate orbital elements (inline - defensive pattern)
  if (chief.semiMajorAxis <= 0) {
    throw new Error(
      `[propagate]: Semi-major axis must be positive (a=${chief.semiMajorAxis})`
    );
  }
  if (chief.eccentricity < 0 || chief.eccentricity >= 1) {
    throw new Error(
      `[propagate]: Eccentricity must be in [0, 1) (e=${chief.eccentricity})`
    );
  }
  if (chief.gravitationalParameter <= 0) {
    throw new Error(
      `[propagate]: Gravitational parameter must be positive (mu=${chief.gravitationalParameter})`
    );
  }
  const incDeg = radToDeg(chief.inclination);
  if (Math.abs(incDeg) < 0.1 || Math.abs(incDeg - 180) < 0.1) {
    throw new Error(
      `[propagate]: Near-equatorial orbit not supported for quasi-nonsingular ROE ` +
        `(i=${incDeg.toFixed(2)} deg). Use nonsingular ROE formulation instead.`
    );
  }

  // Validate propagation time
  if (deltaTime < 0) {
    throw new Error(
      `[propagate]: Negative deltaTime not allowed (dt=${deltaTime}). ` +
        `For backward propagation, negate the result or adjust initial conditions.`
    );
  }

  const { includeJ2 = true, includeDrag = false, dragConfig } = options;

  // Validate drag configuration
  if (includeDrag) {
    if (!dragConfig) {
      throw new Error(
        '[propagate]: dragConfig is required when includeDrag is true'
      );
    }
    if (dragConfig.type === 'eccentric' && chief.eccentricity < 0.05) {
      throw new Error(
        `[propagate]: Eccentric drag model requires e >= 0.05 (e=${chief.eccentricity.toFixed(
          4
        )}). ` + `Use 'arbitrary' drag model for near-circular orbits.`
      );
    }
  }

  // Validate J2+drag coupling
  // The drag STMs from Koenig et al. (2017) inherently include J2 effects.
  // There is no drag-only STM in the paper - it would be physically unrealistic.
  if (includeDrag && options.includeJ2 === false) {
    throw new Error(
      `[propagate]: Cannot disable J2 when drag is enabled. ` +
        `The drag STMs from Koenig et al. (2017) inherently include J2 effects ` +
        `(Appendix C, D). For orbits where drag is significant, J2 is always the ` +
        `dominant conservative perturbation. ` +
        `Use { includeDrag: true } (J2 implicit) or { includeJ2: false } for Keplerian-only.`
    );
  }

  // Convert ROE to vector form
  const stateVec = roeToVector(initialROE);

  let propagatedVec: ROEVector;

  if (includeDrag && dragConfig) {
    // Use coupled J2+drag STM via unified interface
    propagatedVec = propagateWithDrag(stateVec, chief, deltaTime, dragConfig);
  } else if (includeJ2) {
    // J2-only STM
    const stm = computeJ2STM(chief, deltaTime);
    propagatedVec = matVecMul6(stm, stateVec);
  } else {
    // Keplerian-only STM
    const stm = computeKeplerianSTM(chief, deltaTime);
    propagatedVec = matVecMul6(stm, stateVec);
  }

  return vectorToROE(propagatedVec);
};

/**
 * Propagate ROE and update chief orbital elements.
 *
 * Use this when you need to track the chief's position in orbit,
 * which is required for accurate ROE to RIC conversions at the output time.
 *
 * The chief's mean anomaly, argument of perigee, and RAAN are updated
 * according to Keplerian motion and J2 secular rates.
 *
 * **Chief semi-major axis decay:** If `options.chiefAbsoluteDaDot` is provided,
 * the chief's semi-major axis will be updated. Note that this is an implementation
 * convenience NOT from Koenig et al. (2017) - the paper models relative dynamics only.
 * @param initialROE - Initial relative orbital elements
 * @param chief - Chief orbital elements at initial time
 * @param deltaTime - Propagation duration [seconds]
 * @param options - Propagation options
 * @returns Object containing propagated ROE and updated chief elements
 * @example
 * ```typescript
 * const { roe, chief: updatedChief } = propagateROEWithChief(
 *   initialROE,
 *   chiefElements,
 *   3600,
 *   { includeJ2: true }
 * );
 *
 * // Use updatedChief for RIC conversion
 * const ric = roeToRIC(updatedChief, roe);
 * ```
 */
export const propagateROEWithChief = (
  initialROE: QuasiNonsingularROE,
  chief: ClassicalOrbitalElements,
  deltaTime: number,
  options: ROEPropagationOptions = {}
): { roe: QuasiNonsingularROE; chief: ClassicalOrbitalElements } => {
  // Propagate ROE
  const propagatedROE = propagateROE(initialROE, chief, deltaTime, options);

  // Compute mean motion
  const n = meanMotion(chief.semiMajorAxis, chief.gravitationalParameter);

  // Update mean anomaly (Keplerian)
  const newM = normalizeAngle(chief.meanAnomaly + n * deltaTime);

  // Update argument of perigee and RAAN if J2 is included
  let newOmega = chief.argumentOfPerigee;
  let newRaan = chief.raan;

  if (options.includeJ2 !== false) {
    const kappa = computeKappa(
      chief.semiMajorAxis,
      chief.eccentricity,
      chief.gravitationalParameter,
      J2,
      R_EARTH
    );

    const cos_i = Math.cos(chief.inclination);
    const cos2_i = cos_i * cos_i;

    // J2 secular rates
    // omega_dot = kappa * Q (Equation 13)
    // Omega_dot = -2 * kappa * R (Equation 13)
    // Q = 5*cos^2(i) - 1, R = cos(i) (Equation 15)
    const Q = 5 * cos2_i - 1;
    const R = cos_i;
    newOmega = normalizeAngle(chief.argumentOfPerigee + kappa * Q * deltaTime);
    newRaan = normalizeAngle(chief.raan - 2 * kappa * R * deltaTime);
  }

  // Update semi-major axis if chief absolute drag rate is provided
  // NOTE: chiefAbsoluteDaDot is an implementation convenience, NOT from Koenig et al. (2017)
  let newA = chief.semiMajorAxis;
  let newH = chief.angularMomentum;

  if (options.chiefAbsoluteDaDot !== undefined) {
    newA = chief.semiMajorAxis + options.chiefAbsoluteDaDot * deltaTime;

    // Update angular momentum consistently: h = sqrt(mu * a * (1 - e^2))
    if (chief.angularMomentum !== undefined) {
      newH = Math.sqrt(
        chief.gravitationalParameter * newA * (1 - chief.eccentricity ** 2)
      );
    }
  }

  return {
    roe: propagatedROE,
    chief: {
      ...chief,
      semiMajorAxis: newA,
      angularMomentum: newH,
      meanAnomaly: newM,
      argumentOfPerigee: newOmega,
      raan: newRaan,
    },
  };
};

/**
 * Generate a trajectory of ROE states over time.
 *
 * Propagates the ROE state at regular intervals and returns an array
 * of timestamped states. Useful for visualization and analysis.
 * @param initialROE - Initial relative orbital elements
 * @param chief - Chief orbital elements at initial time
 * @param totalTime - Total propagation time [seconds]
 * @param numSteps - Number of output steps
 * @param options - Propagation options
 * @returns Array of { time, roe, chief } objects
 * @example
 * ```typescript
 * const trajectory = generateROETrajectory(
 *   initialROE,
 *   chiefElements,
 *   86400, // 1 day
 *   100,   // 100 points
 *   { includeJ2: true }
 * );
 *
 * // Plot delta-lambda over time
 * trajectory.forEach(pt => console.log(pt.time, pt.roe.dlambda));
 * ```
 */
export const generateROETrajectory = (
  initialROE: QuasiNonsingularROE,
  chief: ClassicalOrbitalElements,
  totalTime: number,
  numSteps: number,
  options: ROEPropagationOptions = {}
): Array<{
  time: number;
  roe: QuasiNonsingularROE;
  chief: ClassicalOrbitalElements;
}> => {
  const dt = totalTime / numSteps;
  const trajectory: Array<{
    time: number;
    roe: QuasiNonsingularROE;
    chief: ClassicalOrbitalElements;
  }> = [{ time: 0, roe: initialROE, chief }];

  // Initial state

  // Propagate step by step
  let currentROE = initialROE;
  let currentChief = chief;

  for (let i = 1; i <= numSteps; i++) {
    const { roe, chief: updatedChief } = propagateROEWithChief(
      currentROE,
      currentChief,
      dt,
      options
    );

    trajectory.push({ time: i * dt, roe, chief: updatedChief });

    currentROE = roe;
    currentChief = updatedChief;
  }

  return trajectory;
};
