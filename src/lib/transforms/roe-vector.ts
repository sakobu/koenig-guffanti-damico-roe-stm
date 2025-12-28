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

/**
 * Compute the J transformation matrix for the modified quasi-nonsingular state.
 *
 * Paper Reference: Koenig et al. (2017), Equation 20
 *
 * The J matrix rotates the relative eccentricity vector by -omega (argument of perigee),
 * decoupling the effects of eccentricity and argument of perigee changes.
 *
 * J(omega) = | I2x2   0         0    |
 *            | 0      R(-omega) 0    |
 *            | 0      0         I2x2 |
 *
 * where R(-omega) = |  cos(omega)  sin(omega) |
 *                   | -sin(omega)  cos(omega) |
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
 * The inverse simply uses the opposite rotation angle:
 * J^(-1)(omega) = J(-omega)
 *
 * This transforms from the modified state back to the nominal state.
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
