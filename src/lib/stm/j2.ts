/**
 * J2-Perturbed State Transition Matrix for Quasi-Nonsingular ROE.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017)
 * - Equation 25: STM assembly with coordinate transformation
 * - Appendix A3, Equation A6: Explicit quasi-nonsingular J2 STM
 * - Equations 14-16: Orbital factor definitions (eta, kappa, E, F, G, P, Q, R, S, T)
 *
 * This STM captures:
 * 1. Keplerian drift (energy difference causes along-track drift)
 * 2. J2 secular effects on mean longitude
 * 3. Rotation of relative eccentricity vector (apsidal precession)
 * 4. Drift of relative inclination vector y-component (nodal regression)
 */

import type { STM6 } from "../types/matrices";
import type { ClassicalOrbitalElements } from "../types/orbital-elements";

import {
  computeApsidalState,
  computeKappa,
  computeOrbitalFactors,
} from "../math/orbital-factors";
import { meanMotion } from "../math/kepler";

/**
 * Build the 6x6 J2-perturbed State Transition Matrix.
 *
 * Reference: Koenig et al. (2017), Appendix A3, Equation A6
 *
 * This is the single source of truth for the J2 STM.
 * Used by both standalone J2 propagation and as a component
 * of the coupled J2+drag STMs.
 *
 * The J2 perturbation causes:
 * - Apsidal precession: omega rotates, causing eccentricity vector rotation
 * - Nodal regression: RAAN drifts, causing delta-iy drift
 * - Additional mean longitude drift beyond Keplerian
 * @param chief - Chief spacecraft orbital elements
 * @param tau - Propagation time [seconds]
 * @returns 6x6 J2 State Transition Matrix
 * @example
 * ```typescript
 * const stm = buildJ2Matrix(chiefElements, 3600); // 1 hour
 * const finalROE = matVecMul6(stm, initialROE);
 * ```
 */
export const buildJ2Matrix = (
  chief: ClassicalOrbitalElements,
  tau: number
): STM6 => {
  const {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: i,
    argumentOfPerigee: omega,
    gravitationalParameter: mu,
  } = chief;

  const n = meanMotion(a, mu);
  const kappa = computeKappa(a, e, mu);
  const factors = computeOrbitalFactors(e, i);
  const apsidal = computeApsidalState(e, omega, kappa, factors.Q, tau);

  const { P, Q, S, T, E, F, G } = factors;
  const { ex_i, ey_i, ex_f, ey_f, cos_wt, sin_wt } = apsidal;

  return [
    // Row 1: delta-a is constant (no J2 secular effect on semi-major axis)
    [1, 0, 0, 0, 0, 0],

    // Row 2: delta-lambda evolution (Keplerian + J2)
    [
      -(1.5 * n + 3.5 * kappa * E * P) * tau,
      1,
      kappa * ex_i * F * G * P * tau,
      kappa * ey_i * F * G * P * tau,
      -kappa * F * S * tau,
      0,
    ],

    // Row 3: delta-ex evolution (apsidal precession)
    [
      3.5 * kappa * ey_f * Q * tau,
      0,
      cos_wt - 4 * kappa * ex_i * ey_f * G * Q * tau,
      -sin_wt - 4 * kappa * ey_i * ey_f * G * Q * tau,
      5 * kappa * ey_f * S * tau,
      0,
    ],

    // Row 4: delta-ey evolution (apsidal precession)
    [
      -3.5 * kappa * ex_f * Q * tau,
      0,
      sin_wt + 4 * kappa * ex_i * ex_f * G * Q * tau,
      cos_wt + 4 * kappa * ey_i * ex_f * G * Q * tau,
      -5 * kappa * ex_f * S * tau,
      0,
    ],

    // Row 5: delta-ix is constant (no J2 secular effect on inclination)
    [0, 0, 0, 0, 1, 0],

    // Row 6: delta-iy evolution (nodal regression)
    [
      3.5 * kappa * S * tau,
      0,
      -4 * kappa * ex_i * G * S * tau,
      -4 * kappa * ey_i * G * S * tau,
      2 * kappa * T * tau,
      1,
    ],
  ];
};

/**
 * Compute J2-perturbed State Transition Matrix for Quasi-Nonsingular ROE.
 *
 * The J2 perturbation causes:
 * - Apsidal precession: omega rotates, causing eccentricity vector rotation
 * - Nodal regression: RAAN drifts, causing delta-iy drift
 * - Additional mean longitude drift beyond Keplerian
 * @param chief - Chief spacecraft orbital elements
 * @param tau - Propagation time [seconds]
 * @returns 6x6 J2-perturbed State Transition Matrix
 * @example
 * ```typescript
 * const stm = computeJ2STM(chiefElements, 3600); // 1 hour
 * const finalROE = matVecMul6(stm, initialROE);
 * ```
 */
export const computeJ2STM = (
  chief: ClassicalOrbitalElements,
  tau: number
): STM6 => buildJ2Matrix(chief, tau);
