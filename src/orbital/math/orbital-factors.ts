/**
 * Orbital factor computations for J2 and drag STMs.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 *   Equations 14-16 (orbital factors), Equation 13 (apsidal precession)
 */

import { J2, R_EARTH } from '../constants';
import type { ApsidalState, OrbitalFactors } from '../types/orbital-elements';

/**
 * Compute the kappa factor used in J2 perturbation matrices.
 *
 * This factor encapsulates the common terms found in the Secular J2 and J2-squared effects.
 *
 * Reference: Koenig et al. (2017), Equation 14.
 * kappa = (3/4) * J2 * R_E^2 * sqrt(mu) / (a^(3.5) * eta^4)
 * @param a - Semi-major axis [m]
 * @param e - Eccentricity (dimensionless)
 * @param mu - Gravitational parameter [m^3/s^2]
 * @param j2 - J2 coefficient (default: Earth J2)
 * @param re - Equatorial radius [m] (default: Earth Radius)
 * @returns kappa factor [rad/s * m^-2]
 * @throws {Error} if a <= 0, e not in [0, 1), or mu <= 0
 */
export const computeKappa = (
  a: number,
  e: number,
  mu: number,
  j2: number = J2,
  re: number = R_EARTH
): number => {
  if (a <= 0) {
    throw new Error(
      `[orbital-factors]: Semi-major axis must be positive (a=${a})`
    );
  }
  if (e < 0 || e >= 1) {
    throw new Error(
      `[orbital-factors]: Eccentricity must be in [0, 1) (e=${e})`
    );
  }
  if (mu <= 0) {
    throw new Error(
      `[orbital-factors]: Gravitational parameter must be positive (mu=${mu})`
    );
  }
  const eta = Math.sqrt(1 - e * e);
  return (
    ((3 / 4) * j2 * re * re * Math.sqrt(mu)) /
    (Math.pow(a, 3.5) * Math.pow(eta, 4))
  );
};

/**
 * Compute orbital factors used in J2/drag STMs.
 *
 * Reference: Koenig et al. (2017), Equations 14-16
 *
 * These factors depend only on eccentricity and inclination,
 * making them reusable across multiple STM computations.
 * @param e - Eccentricity
 * @param i - Inclination [rad]
 * @returns Orbital factors (eta, P, Q, R, S, T, E, F, G)
 */
export const computeOrbitalFactors = (e: number, i: number): OrbitalFactors => {
  if (e < 0 || e >= 1) {
    throw new Error(
      `[orbital-factors]: Eccentricity must be in [0, 1) (e=${e})`
    );
  }
  const eta = Math.sqrt(1 - e * e);
  const cos_i = Math.cos(i);
  const sin_i = Math.sin(i);
  const cos2_i = cos_i * cos_i;

  return {
    eta,
    P: 3 * cos2_i - 1,
    Q: 5 * cos2_i - 1,
    R: cos_i,
    S: 2 * sin_i * cos_i,
    T: sin_i * sin_i,
    E: 1 + eta,
    F: 4 + 3 * eta,
    G: 1 / (eta * eta),
  };
};

/**
 * Compute apsidal precession state for J2 STMs.
 *
 * Returns initial and final eccentricity vector components
 * accounting for argument of perigee drift due to J2.
 *
 * Reference: Koenig et al. (2017), Equation 13
 * @param e - Eccentricity
 * @param omega - Initial argument of perigee [rad]
 * @param kappa - J2 coupling factor from computeKappa()
 * @param Q - Orbital factor (5cos^2(i) - 1)
 * @param tau - Propagation time [s]
 * @returns Apsidal state with rotation terms
 */
export const computeApsidalState = (
  e: number,
  omega: number,
  kappa: number,
  Q: number,
  tau: number
): ApsidalState => {
  if (e < 0 || e >= 1) {
    throw new Error(
      `[orbital-factors]: Eccentricity must be in [0, 1) (e=${e})`
    );
  }
  const omegaDot = kappa * Q;
  const omega_f = omega + omegaDot * tau;
  const wt = omegaDot * tau;

  return {
    omegaDot,
    omega_f,
    ex_i: e * Math.cos(omega),
    ey_i: e * Math.sin(omega),
    ex_f: e * Math.cos(omega_f),
    ey_f: e * Math.sin(omega_f),
    cos_wt: Math.cos(wt),
    sin_wt: Math.sin(wt),
  };
};
