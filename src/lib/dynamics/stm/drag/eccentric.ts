/**
 * Density-Model-Free Drag STM for Eccentric Orbits (e >= 0.05)
 *
 * Paper Reference: Koenig, Guffanti, D'Amico (2017)
 * - Section VII: Eccentric orbits (e >= 0.05) - Equations 69-72, Appendix C
 *
 * This STM models differential drag without requiring an atmospheric density
 * model. Instead, it uses the time derivative of the relative semi-major axis
 * estimated from navigation data.
 *
 * Uses the circularization constraint (Eq. 69): delta-e = (1-e) delta-a-dot
 * This reduces the state to 7D: [delta-alpha (6D), delta-a-dot]
 *
 * **Validity**: Requires e >= 0.05 for circularization assumption.
 * For near-circular orbits, use the arbitrary eccentricity model instead.
 */

import type { STM7 } from "../../../core/types/matrices";
import type { ClassicalOrbitalElements } from "../../../core/types/orbital-elements";
import type { ROEVector, ROEVector7 } from "../../../core/types/vectors";

import { J2, R_EARTH } from "../../../core/constants";
import { matVecMul7 } from "../../../core/math/matrix-ops";
import {
  computeApsidalState,
  computeKappa,
  computeOrbitalFactors,
} from "../../../core/math/orbital-factors";
import { meanMotion } from "../../../core/kepler";
import { buildJ2Matrix } from "../j2";

/**
 * Compute complete J2+Drag STM for eccentric orbits
 *
 * Paper Reference: Section VII, Equations 69-72, Appendix C, Eq. C2 (quasi-nonsingular)
 *
 * This implements the FULL coupled STM from Equation C2 (quasi-nonsingular),
 * NOT a simplified additive model. The STM includes:
 * - All J2 secular effects
 * - Keplerian-drag coupling: (-3n/4)tau^2 terms
 * - J2-drag coupling: kappa*e*Q*(...) tau^2 terms
 *
 * Uses the circularization constraint (Eq. 69): delta-e = (1-e) delta-a-dot
 * This reduces the state to 7D: [delta-alpha (6D), delta-a-dot]
 *
 * **Validity**: Requires e >= 0.05 for circularization assumption.
 * For near-circular orbits, use computeJ2DragSTM_Arbitrary instead.
 * @param chief - Chief orbital elements at initial time
 * @param tau - Propagation time [seconds]
 * @returns Object with 7x7 STM and propagate helper
 */
export const computeJ2DragSTMEccentric = (
  chief: ClassicalOrbitalElements,
  tau: number
): {
  stm: STM7;
  propagate: (roe: ROEVector, daDotDrag: number) => ROEVector;
  dragColumn: ROEVector;
} => {
  // Note: Eccentricity validation (e >= 0.05) is done by validateDragModel()
  // called from propagateROE(). Direct callers should validate separately.

  const {
    semiMajorAxis: a,
    eccentricity: e,
    inclination: i,
    argumentOfPerigee: omega,
    gravitationalParameter: mu,
  } = chief;

  const n = meanMotion(a, mu);
  const kappa = computeKappa(a, e, mu, J2, R_EARTH);
  const factors = computeOrbitalFactors(e, i);
  const apsidal = computeApsidalState(e, omega, kappa, factors.Q, tau);

  const { eta, P, Q, S, G } = factors;
  const { omega_f, ex_f, ey_f } = apsidal;

  const tau2 = tau * tau;

  // Build 6x6 J2 STM using shared utility
  const phi_j2 = buildJ2Matrix(chief, tau);

  // Build drag column from Appendix C, Eq. C2
  // Using circularization constraint: delta-e = (1-e) delta-a-dot
  const dragColumn: ROEVector = [
    // delta-a: linear drift
    tau,

    // delta-lambda: Keplerian + J2 coupling (Eq. C2 row 2)
    // (-3n/4 - 7*kappa*eta*P/4 + (3/2)*kappa*e*(1-e)*eta*G*P) tau^2
    (-0.75 * n -
      1.75 * kappa * eta * P +
      1.5 * kappa * e * (1 - e) * eta * G * P) *
      tau2,

    // delta-ex: Eccentricity drift from circularization + J2 coupling (Eq. C2 row 3)
    // (1-e)cos(omega_f)*tau - kappa*ey_f*Q*(-7/4 + 2*e*(1-e)*G)*tau^2
    (1 - e) * Math.cos(omega_f) * tau -
      kappa * ey_f * Q * (-1.75 + 2 * e * (1 - e) * G) * tau2,

    // delta-ey: Eccentricity drift from circularization + J2 coupling (Eq. C2 row 4)
    // (1-e)sin(omega_f)*tau + kappa*ex_f*Q*(-7/4 + 2*e*(1-e)*G)*tau^2
    (1 - e) * Math.sin(omega_f) * tau +
      kappa * ex_f * Q * (-1.75 + 2 * e * (1 - e) * G) * tau2,

    // delta-ix: no drag effect
    0,

    // delta-iy: J2-drag coupling (Eq. C2 row 6)
    // kappa*S*(7/4 - 2*e*(1-e)*G)*tau^2
    kappa * S * (1.75 - 2 * e * (1 - e) * G) * tau2,
  ];

  // Assemble 7x7 STM as proper readonly tuple
  const stm: STM7 = [
    [...phi_j2[0], dragColumn[0]],
    [...phi_j2[1], dragColumn[1]],
    [...phi_j2[2], dragColumn[2]],
    [...phi_j2[3], dragColumn[3]],
    [...phi_j2[4], dragColumn[4]],
    [...phi_j2[5], dragColumn[5]],
    [0, 0, 0, 0, 0, 0, 1], // delta-a-dot persists
  ];

  return {
    stm,

    propagate: (roe: ROEVector, daDotDrag: number): ROEVector => {
      const state7: ROEVector7 = [...roe, daDotDrag];
      const result = matVecMul7(stm, state7);
      return [result[0], result[1], result[2], result[3], result[4], result[5]];
    },

    dragColumn,
  };
};
