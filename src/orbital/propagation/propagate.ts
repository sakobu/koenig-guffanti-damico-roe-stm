/**
 * Main ROE Propagator Functions
 *
 * Provides unified interface for propagating Quasi-Nonsingular ROE
 * with selectable perturbation models (Keplerian, J2, J2+Drag).
 *
 * Reference: Koenig, Guffanti, D'Amico (2017)
 */

import type { ROEPropagationOptions } from "../types/config";
import type {
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
} from "../types/orbital-elements";
import type { ROEVector } from "../types/vectors";

import { J2, R_EARTH } from "../constants";
import { matVecMul6 } from "../math/matrices";
import { computeKappa } from "../math/orbital-factors";
import { meanMotion, normalizeAngle } from "../math/kepler";
import { roeToVector, vectorToROE } from "../transforms/roe-vector";
import { propagateWithDrag } from "./drag-dispatch";
import { computeJ2STM } from "../stm/j2";
import { computeKeplerianSTM } from "../stm/keplerian";

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
 * // With differential drag - auto model selection (recommended)
 * const finalROE = propagateROE(initialROE, chiefElements, 3600, {
 *   includeDrag: true,
 *   dragConfig: { type: "auto", daDotDrag: -1e-10 },
 * });
 *
 * // With differential drag - explicit eccentric model (e >= 0.05)
 * const finalROE = propagateROE(initialROE, chiefElements, 3600, {
 *   includeDrag: true,
 *   dragConfig: { type: "eccentric", daDotDrag: -1e-10 },
 * });
 * ```
 */
const propagateROE = (
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
  const incDeg = (chief.inclination * 180) / Math.PI;
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
        "[propagate]: dragConfig is required when includeDrag is true"
      );
    }
    if (dragConfig.type === "eccentric" && chief.eccentricity < 0.05) {
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

  return {
    roe: propagatedROE,
    chief: {
      ...chief,
      meanAnomaly: newM,
      argumentOfPerigee: newOmega,
      raan: newRaan,
    },
  };
};
