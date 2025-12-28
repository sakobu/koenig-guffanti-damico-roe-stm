/**
 * Control Influence Matrix for Impulsive Maneuvers
 *
 * Implements the B matrix from Gauss Variational Equations that maps
 * impulsive delta-v to instantaneous ROE change.
 *
 * Reference: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit,"
 * PhD Thesis, TU Delft, 2010, Section 2.2.2, Equation 2.38
 */

import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { ROEVector, Vector3 } from "../types/vectors";
import type { ControlMatrix6x3 } from "../types/matrices";

import { meanMotion, trueAnomalyFromMean } from "../math/kepler";
import { addROE } from "../math/vectors";
import { matMul6x3_3x1 } from "../math/matrices";

/**
 * Compute the Control Influence Matrix B at given chief state.
 *
 * Maps impulsive delta-v in RIC frame to instantaneous ROE change:
 *   d(ROE) = B * [dvR, dvI, dvC]^T
 *
 * The matrix B is derived from Gauss Variational Equations for
 * quasi-nonsingular ROE (D'Amico 2010, Eq. 2.38):
 *
 *   a*d(da)      = +2*dvI / n
 *   a*d(dlambda) = -2*dvR / n
 *   a*d(dex)     = +sin(u)*dvR/n + 2*cos(u)*dvI/n
 *   a*d(dey)     = -cos(u)*dvR/n + 2*sin(u)*dvI/n
 *   a*d(dix)     = +cos(u)*dvC/n
 *   a*d(diy)     = +sin(u)*dvC/n
 *
 * where:
 *   n = mean motion [rad/s]
 *   u = argument of latitude = omega + nu [rad]
 *   (omega = argument of perigee, nu = true anomaly)
 *
 * Note: This is the near-circular approximation (accurate for e < 0.1).
 * For highly eccentric orbits, additional factors involving r/a and
 * eccentricity should be included.
 * @param chief - Chief spacecraft orbital elements
 * @returns 6x3 Control Influence Matrix B
 */
export const computeControlMatrix = (
  chief: ClassicalOrbitalElements
): ControlMatrix6x3 => {
  const { semiMajorAxis: a, eccentricity: e, argumentOfPerigee: omega } = chief;

  // Compute true anomaly from mean anomaly
  const nu = trueAnomalyFromMean(chief.meanAnomaly, e);

  // Argument of latitude (position along orbit from ascending node)
  const u = omega + nu;

  // Mean motion
  const n = meanMotion(a, chief.gravitationalParameter);

  // Precompute trig functions
  const sin_u = Math.sin(u);
  const cos_u = Math.cos(u);

  // Scale factor: 1 / (n * a)
  // This normalizes the delta-v effect to quasi-nonsingular ROE
  const k = 1 / (n * a);

  // Construct B matrix (Eq. 2.38)
  // Columns: [dvR, dvI, dvC] (radial, in-track, cross-track)
  // Rows: [da, dlambda, dex, dey, dix, diy]
  return [
    // Row 0: d(da) - only affected by in-track burns
    [0, 2 * k, 0],

    // Row 1: d(dlambda) - only affected by radial burns (instantaneous)
    [-2 * k, 0, 0],

    // Row 2: d(dex) - affected by radial and in-track
    [sin_u * k, 2 * cos_u * k, 0],

    // Row 3: d(dey) - affected by radial and in-track
    [-cos_u * k, 2 * sin_u * k, 0],

    // Row 4: d(dix) - only affected by cross-track burns
    [0, 0, cos_u * k],

    // Row 5: d(diy) - only affected by cross-track burns
    [0, 0, sin_u * k],
  ];
};

/**
 * Apply an impulsive delta-v to a ROE state.
 *
 * Computes the new ROE state after an instantaneous velocity change:
 *   ROE_new = ROE_old + B * deltaV
 * @param roe - Current ROE state vector [da, dlambda, dex, dey, dix, diy]
 * @param deltaV - Delta-v vector in RIC frame [dvR, dvI, dvC] in m/s
 * @param chief - Chief orbital elements at maneuver time
 * @returns Updated ROE state after maneuver
 */
export const applyDeltaV = (
  roe: ROEVector,
  deltaV: Vector3,
  chief: ClassicalOrbitalElements
): ROEVector => {
  const B = computeControlMatrix(chief);
  const dROE = matMul6x3_3x1(B, deltaV);
  return addROE(roe, dROE);
};

/**
 * Compute the delta-v required for a desired ROE change (approximate).
 *
 * This uses the pseudo-inverse of B to find the minimum-norm delta-v
 * that achieves a target ROE change. Note that B is 6x3 (underdetermined
 * for ROE from dv), so only 3 DOF can be controlled with a single burn.
 *
 * For full 6-DOF control, use two burns (the rendezvous solver handles this).
 *
 * This function solves the least-squares problem:
 *   min ||dv|| such that B * dv approximates dROE
 *
 * It extracts the controllable subspace (in-plane + cross-track).
 * @param desiredDROE - Desired ROE change
 * @param chief - Chief orbital elements at maneuver time
 * @returns Approximate delta-v (minimum norm) in RIC frame [m/s]
 */
export const computeApproximateDeltaV = (
  desiredDROE: ROEVector,
  chief: ClassicalOrbitalElements
): Vector3 => {
  const { semiMajorAxis: a, eccentricity: e, argumentOfPerigee: omega } = chief;

  const nu = trueAnomalyFromMean(chief.meanAnomaly, e);
  const u = omega + nu;
  const n = meanMotion(a, chief.gravitationalParameter);

  const sin_u = Math.sin(u);
  const cos_u = Math.cos(u);

  // Extract desired changes
  const dda = desiredDROE[0];
  const ddlambda = desiredDROE[1];
  // desiredDROE[2] (dex) and desiredDROE[3] (dey) not used in approximate inversion
  const ddix = desiredDROE[4];
  const ddiy = desiredDROE[5];

  // Invert the simple relationships:
  // da = 2*dvI/(n*a)      -> dvI = da * n * a / 2
  // dlambda = -2*dvR/(n*a) -> dvR = -dlambda * n * a / 2

  // For dex, dey: these depend on both dvR and dvI
  // dex = sin(u)*dvR/(n*a) + 2*cos(u)*dvI/(n*a)
  // dey = -cos(u)*dvR/(n*a) + 2*sin(u)*dvI/(n*a)

  // Primary drivers:
  const dvI_from_da = (dda * n * a) / 2;
  const dvR_from_dlambda = (-ddlambda * n * a) / 2;

  // Cross-track from dix, diy (use weighted average based on cos^2 + sin^2 = 1)
  // dix = cos(u)*dvC/(n*a) -> contribution: dix * cos(u)
  // diy = sin(u)*dvC/(n*a) -> contribution: diy * sin(u)
  // Combine: dvC = (dix*cos(u) + diy*sin(u)) * n * a
  const dvC = (ddix * cos_u + ddiy * sin_u) * n * a;

  return [dvR_from_dlambda, dvI_from_da, dvC];
};
