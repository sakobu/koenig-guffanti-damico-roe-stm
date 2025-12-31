/**
 * Quasi-Nonsingular Relative Orbital Elements state helpers.
 *
 * Paper Reference: Koenig, Guffanti, D'Amico (2017)
 * - Section II: State Definitions, Equation 2
 * - Equation 20: J transformation matrix for modified state
 *
 * The quasi-nonsingular ROE state delta-alpha-qns is defined as:
 *   [da, dlambda, dex, dey, dix, diy]
 *
 * The J transformation converts to the modified state delta-alpha-qns' via:
 *   delta-alpha-qns' = J(omega) * delta-alpha-qns
 *
 * where the modified state has eccentricity vector rotated by -omega:
 *   dex' = dex cos(omega) + dey sin(omega)  ~= de
 *   dey' = -dex sin(omega) + dey cos(omega) ~= e * d-omega
 */

import type { ROEVector } from "../types/vectors";
import type { STM6 } from "../types/matrices";
import type { QuasiNonsingularROE } from "../types/orbital-elements";

/**
 * Convert a Quasi-Nonsingular ROE object into a 6-element state vector.
 *
 * Vector order matches the standard definition in Koenig et al. (2017):
 * [da, dlambda, dex, dey, dix, diy]
 * @param roe - The relative orbital elements object
 * @returns 6-element array [da, dlambda, dex, dey, dix, diy]
 */
export const roeToVector = (roe: QuasiNonsingularROE): ROEVector => [
  roe.da,
  roe.dlambda,
  roe.dex,
  roe.dey,
  roe.dix,
  roe.diy,
];

/**
 * Convert a 6-element state vector back into a Quasi-Nonsingular ROE object.
 *
 * Assumes vector order: [da, dlambda, dex, dey, dix, diy]
 * @param v - 6-element state vector
 * @returns Quasi-Nonsingular ROE object
 */
export const vectorToROE = (v: ROEVector): QuasiNonsingularROE => ({
  da: v[0],
  dlambda: v[1],
  dex: v[2],
  dey: v[3],
  dix: v[4],
  diy: v[5],
});

// ============================================================================
// J TRANSFORMATION MATRICES (Equation 20)
// ============================================================================

/**
 * Compute the J transformation matrix for the modified quasi-nonsingular state.
 *
 * Paper Reference: Koenig et al. (2017), Equation 20
 *
 * **Purpose**: Converts between nominal and modified ROE representations:
 * - Nominal state: [da, dlambda, dex, dey, dix, diy]
 * - Modified state: [da, dlambda, dex', dey', dix, diy]
 *
 * The modified state rotates the eccentricity vector by -omega, decoupling
 * eccentricity magnitude from argument of perigee changes:
 * - dex' = dex cos(omega) + dey sin(omega)  (approximately = de)
 * - dey' = -dex sin(omega) + dey cos(omega) (approximately = e * d-omega)
 *
 * **Usage**: This is an optional utility for physical interpretation.
 * The library's STM propagation functions work entirely in the nominal state
 * and do not require this transformation. Use this when you want to analyze
 * ROE in terms of eccentricity magnitude vs apsidal changes.
 * @param omega - Argument of perigee [rad]
 * @returns 6x6 J transformation matrix
 */
export const computeJMatrix = (omega: number): STM6 => {
  const cos_w = Math.cos(omega);
  const sin_w = Math.sin(omega);

  return [
    [1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 0, cos_w, sin_w, 0, 0],
    [0, 0, -sin_w, cos_w, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
  ];
};

/**
 * Compute the inverse J transformation matrix.
 *
 * Transforms from the modified quasi-nonsingular state back to the nominal state.
 * The inverse simply uses the opposite rotation: J^(-1)(omega) = J(-omega)
 * @param omega - Argument of perigee [rad]
 * @returns 6x6 inverse J transformation matrix
 */
export const computeInverseJMatrix = (omega: number): STM6 => {
  const cos_w = Math.cos(omega);
  const sin_w = Math.sin(omega);

  // Inverse is just R(+omega) instead of R(-omega)
  return [
    [1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [0, 0, cos_w, -sin_w, 0, 0],
    [0, 0, sin_w, cos_w, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1],
  ];
};

/**
 * Normalize an angle to the range [0, 2*PI).
 *
 * JavaScript's modulo operator returns negative values for negative inputs,
 * so this function properly normalizes angles to the standard range.
 * @param angle - Input angle [rad]
 * @returns Normalized angle in [0, 2*PI)
 */
export const normalizeAngle = (angle: number): number => {
  const TWO_PI = 2 * Math.PI;
  const result = angle % TWO_PI;
  return result < 0 ? result + TWO_PI : result;
};
