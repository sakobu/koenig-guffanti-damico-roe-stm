/**
 * Density-Model-Free Drag STM for Arbitrary Eccentricity
 *
 * Paper Reference: Koenig, Guffanti, D'Amico (2017)
 * - Section VIII: Arbitrary eccentricity - Equations 73-77, Appendix D
 *
 * This model does NOT assume circularization. It uses a 9D augmented state:
 * [delta-a, delta-lambda, delta-ex, delta-ey, delta-ix, delta-iy,
 *  delta-a-dot, delta-ex-dot, delta-ey-dot]
 *
 * All three drag time derivatives must be estimated from navigation data.
 * This is the most general model and works for any eccentricity.
 *
 * **When to use**:
 * - Near-circular orbits (e < 0.05) where eccentric model fails
 * - When you have good estimates of all three derivatives
 * - When highest accuracy is needed
 */

import type { DragConfigArbitrary } from "../types/config";
import type { DragColumns6x3, STM9 } from "../types/matrices";
import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { ROEVector, ROEVector9 } from "../types/vectors";

import { J2, R_EARTH } from "../constants";
import { matVecMul9 } from "../math/matrices";
import {
  computeApsidalState,
  computeKappa,
  computeOrbitalFactors,
} from "../math/orbital-factors";
import { meanMotion } from "../math/kepler";
import { buildJ2Matrix } from "./j2";

/**
 * Compute complete J2+Drag STM for arbitrary eccentricity orbits
 *
 * Paper Reference: Section VIII, Equations 73-77, Appendix D (Eq. D2)
 *
 * This model does NOT assume circularization. It uses a 9D augmented state:
 * [delta-a, delta-lambda, delta-ex, delta-ey, delta-ix, delta-iy,
 *  delta-a-dot, delta-ex-dot, delta-ey-dot]
 *
 * All three drag time derivatives must be estimated from navigation data.
 * This is the most general model and works for any eccentricity.
 *
 * **When to use**:
 * - Near-circular orbits (e < 0.05) where eccentric model fails
 * - When you have good estimates of all three derivatives
 * - When highest accuracy is needed
 * @param chief - Chief orbital elements at initial time
 * @param tau - Propagation time [seconds]
 * @returns Object with 9x9 STM and propagate helper
 */
export const computeJ2DragSTMArbitrary = (
  chief: ClassicalOrbitalElements,
  tau: number
): {
  stm: STM9;
  propagate: (
    roe: ROEVector,
    config: Omit<DragConfigArbitrary, "type">
  ) => ROEVector;
  dragColumns: DragColumns6x3;
} => {
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

  const { E, F, P, Q, S, G } = factors;
  const { omega_f, ex_f, ey_f } = apsidal;

  // Compute cos/sin of final argument of perigee for drag columns
  const cos_wf = Math.cos(omega_f);
  const sin_wf = Math.sin(omega_f);

  const tau2 = tau * tau;

  // Build 6x6 J2 STM using shared utility
  const phi_j2 = buildJ2Matrix(chief, tau);

  // Build drag columns from Appendix D, Eq. D1
  // Transformed from singular to quasi-nonsingular state

  // Column 1: delta-a-dot contributions (Appendix D, Eq. D2, column 7)
  const dragCol1: ROEVector = [
    tau,
    -(0.75 * n + 1.75 * kappa * E * P) * tau2,
    1.75 * kappa * ey_f * Q * tau2,
    -1.75 * kappa * ex_f * Q * tau2,
    0,
    1.75 * kappa * S * tau2,
  ];

  // Column 2: delta-ex-dot contributions (Appendix D, Eq. D2, column 8)
  const dragCol2: ROEVector = [
    0,
    0.5 * kappa * e * F * G * P * tau2,
    cos_wf * tau - 2 * kappa * e * ey_f * G * Q * tau2,
    sin_wf * tau + 2 * kappa * e * ex_f * G * Q * tau2,
    0,
    -2 * kappa * e * G * S * tau2,
  ];

  // Column 3: delta-ey-dot contributions (Appendix D, Eq. D2, column 9)
  // Note: Unlike column 8 (delta-ex-dot), column 9 has no J2-drag coupling terms
  // for delta-lambda (row 2) and delta-iy (row 6). This asymmetry arises because
  // delta-ex' aligns with the eccentricity direction in the modified state.
  const dragCol3: ROEVector = [0, 0, -sin_wf * tau, cos_wf * tau, 0, 0];

  // Transpose drag columns: each row is [col1[i], col2[i], col3[i]]
  const dragColumns: DragColumns6x3 = [
    [dragCol1[0], dragCol2[0], dragCol3[0]],
    [dragCol1[1], dragCol2[1], dragCol3[1]],
    [dragCol1[2], dragCol2[2], dragCol3[2]],
    [dragCol1[3], dragCol2[3], dragCol3[3]],
    [dragCol1[4], dragCol2[4], dragCol3[4]],
    [dragCol1[5], dragCol2[5], dragCol3[5]],
  ];

  // Assemble 9x9 STM as proper readonly tuple
  const stm: STM9 = [
    [...phi_j2[0], ...dragColumns[0]],
    [...phi_j2[1], ...dragColumns[1]],
    [...phi_j2[2], ...dragColumns[2]],
    [...phi_j2[3], ...dragColumns[3]],
    [...phi_j2[4], ...dragColumns[4]],
    [...phi_j2[5], ...dragColumns[5]],
    [0, 0, 0, 0, 0, 0, 1, 0, 0], // delta-a-dot persists
    [0, 0, 0, 0, 0, 0, 0, 1, 0], // delta-ex-dot persists
    [0, 0, 0, 0, 0, 0, 0, 0, 1], // delta-ey-dot persists
  ];

  return {
    stm,

    propagate: (
      roe: ROEVector,
      config: Omit<DragConfigArbitrary, "type">
    ): ROEVector => {
      const state9: ROEVector9 = [
        ...roe,
        config.daDotDrag,
        config.dexDotDrag,
        config.deyDotDrag,
      ];
      const result = matVecMul9(stm, state9);
      return [result[0], result[1], result[2], result[3], result[4], result[5]];
    },

    dragColumns,
  };
};

// ============================================================================
// DRAG CONFIG CONVERSION
// ============================================================================
//
// Converts between drag model configurations using paper physics.

/**
 * Convert eccentric model estimate to arbitrary model format.
 *
 * Implements the circularization constraint from the paper (Equation 69).
 * The constraint assumes drag causes eccentricity to decrease proportionally:
 *   delta-e-dot = (1-e) * delta-a-dot
 *
 * The eccentricity drift direction is parallel to the chief's apsidal line.
 *
 * Reference: Koenig et al. (2017), Equation 69
 * @param daDotDrag - Estimated delta-a-dot from eccentric model
 * @param chief - Chief orbital elements
 * @returns Drag derivatives in arbitrary model format
 */
export const eccentricToArbitraryConfig = (
  daDotDrag: number,
  chief: ClassicalOrbitalElements
): Omit<DragConfigArbitrary, "type"> => {
  const { eccentricity: e, argumentOfPerigee: omega } = chief;

  // Circularization constraint: delta-e-dot = (1-e) * delta-a-dot
  // The eccentricity drift is parallel to the chief's apsidal line
  const deDotDrag = (1 - e) * daDotDrag;

  return {
    daDotDrag,
    dexDotDrag: deDotDrag * Math.cos(omega),
    deyDotDrag: deDotDrag * Math.sin(omega),
  };
};
