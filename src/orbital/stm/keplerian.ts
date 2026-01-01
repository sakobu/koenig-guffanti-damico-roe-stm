/**
 * Keplerian (unperturbed) State Transition Matrix for ROE.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017), Equation 12.
 *
 * The Keplerian STM captures only the energy-induced along-track drift:
 * a difference in semi-major axis causes a difference in mean motion,
 * leading to secular drift in the mean longitude.
 *
 * Phi_kep = I + A_kep * tau
 *
 * where A_kep has only one non-zero element: A[1][0] = -3n/2
 */

import { meanMotion } from '../math/kepler';
import type { STM6 } from '../types/matrices';
import type { ClassicalOrbitalElements } from '../types/orbital-elements';

/**
 * Compute the Keplerian (unperturbed) State Transition Matrix.
 *
 * This STM models only the fundamental Keplerian drift where energy
 * differences lead to along-track separation over time.
 *
 * The physics:
 * - delta-a causes delta-n (different mean motions)
 * - delta-n causes delta-lambda to grow linearly in time
 * - All other ROE components are constants of motion
 * @param chief - Chief spacecraft orbital elements
 * @param tau - Propagation time [seconds]
 * @returns 6x6 Keplerian State Transition Matrix
 * @example
 * ```typescript
 * const stm = computeKeplerianSTM(chiefElements, 3600); // 1 hour
 * const finalROE = matVecMul6(stm, initialROE);
 * ```
 */
export const computeKeplerianSTM = (
  chief: ClassicalOrbitalElements,
  tau: number
): STM6 => {
  const n = meanMotion(chief.semiMajorAxis, chief.gravitationalParameter);

  // The only coupling term: d(delta-lambda)/dt = -3n/2 * delta-a
  // Integrated over time: delta-lambda(t) = delta-lambda(0) - (3n/2) * delta-a * tau
  const a21 = -1.5 * n * tau;

  return [
    [1, 0, 0, 0, 0, 0], // delta-a: constant (no secular change)
    [a21, 1, 0, 0, 0, 0], // delta-lambda: drifts due to delta-a
    [0, 0, 1, 0, 0, 0], // delta-ex: constant
    [0, 0, 0, 1, 0, 0], // delta-ey: constant
    [0, 0, 0, 0, 1, 0], // delta-ix: constant
    [0, 0, 0, 0, 0, 1], // delta-iy: constant
  ];
};
