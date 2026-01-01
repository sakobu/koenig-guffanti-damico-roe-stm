/**
 * Drag Derivative Estimation Utilities
 *
 * Provides functions to estimate differential drag derivatives from ROE observations.
 * These utilities properly account for J2 secular drift when computing estimates.
 *
 * **Estimation Framework:**
 *
 * This module complements the drag STMs (drag-eccentric.ts, drag-arbitrary.ts) which
 * provide the forward propagation model. Together they form a batch least squares
 * orbit determination (OD) framework:
 *
 * - **Forward model** (drag STMs): State augmentation [ROE; drag_params] with drag
 *   columns serving as the sensitivity matrix H = d(ROE)/d(drag_params)
 * - **Inverse model** (this module): Estimates drag_params from observation residuals
 *   using the simplified relationship: drag_params = residual / dt
 *
 * **Current Implementation:**
 * - Single-arc batch estimation (2 observation epochs)
 * - Assumes noise-free observations (no measurement covariance R)
 * - J2-only prediction as a priori reference
 *
 * **Production Extensions:**
 * For operational systems with noisy navigation data, consider:
 * - EKF/UKF: Sequential estimation with measurement noise R and process noise Q
 * - Multi-arc batch LS: Multiple observation epochs for overdetermined solution
 * - Joint state+drag estimation: Solve for full ROE state and drag simultaneously
 *
 * For best results with this simplified estimator, use observations spanning at
 * least one orbital period. Shorter intervals may be dominated by noise; longer
 * intervals may violate the linear STM assumption.
 * @see drag-eccentric.ts - Forward model for e >= 0.05 (7D augmented state)
 * @see drag-arbitrary.ts - Forward model for any eccentricity (9D augmented state)
 */

import type { DragConfigArbitrary } from "../types/config";
import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { ROEVector } from "../types/vectors";

import { matVecMul6 } from "../math/matrices";
import { computeJ2STM } from "./j2";

/**
 * Estimate drag derivatives with J2 correction.
 *
 * Subtracts expected J2-only drift before computing finite differences,
 * giving cleaner drag estimates not contaminated by J2 secular drift.
 *
 * **Batch LS Formulation:**
 *
 * This implements a simplified single-arc batch least squares estimation:
 * ```
 * residual = roe_observed - STM_j2 * roe_initial   // isolate drag contribution
 * drag_params = residual / dt                      // invert linear sensitivity
 * ```
 *
 * The drag STMs (drag-eccentric.ts, drag-arbitrary.ts) provide the forward model
 * with drag columns serving as the sensitivity matrix H = d(ROE)/d(drag_params).
 * This function inverts that relationship for parameter estimation.
 *
 * **Assumptions:**
 * - Noise-free observations (no measurement covariance R)
 * - Constant drag derivatives over the observation arc
 * - Linear dynamics (valid for short arcs, typically 1-2 orbital periods)
 *
 * **For production systems** with noisy data, extend to EKF/UKF with:
 * - Measurement covariance R from navigation filter
 * - Process noise Q for drag variability
 * - Multiple observation arcs for overdetermined solution
 *
 * Reference: The J2 STM from Koenig et al. (2017) Section V is used to
 * predict expected J2 drift, which is subtracted from observations.
 * @param roe1 - ROE state at time t1
 * @param roe2 - ROE state at time t2 (observed)
 * @param chief - Chief orbital elements at time t1
 * @param dt - Time difference t2 - t1 [seconds]
 * @returns Estimated drag derivatives for use with arbitrary drag model
 * @example
 * ```typescript
 * // Estimate drag from two navigation solutions
 * const dragConfig = estimateDragDerivativesWithJ2Correction(
 *   roeYesterday,
 *   roeToday,
 *   chiefYesterday,
 *   86400  // 1 day
 * );
 *
 * // Use with propagation
 * propagateROE(roe, chief, 3600, {
 *   includeDrag: true,
 *   dragConfig: { type: 'arbitrary', ...dragConfig }
 * });
 * ```
 */
export const estimateDragDerivativesWithJ2Correction = (
  roe1: ROEVector,
  roe2: ROEVector,
  chief: ClassicalOrbitalElements,
  dt: number
): Omit<DragConfigArbitrary, "type"> => {
  if (dt <= 0) {
    throw new Error(
      `[estimateDragDerivatives]: dt must be positive (dt=${dt})`
    );
  }

  // Propagate roe1 with J2-only STM to get expected J2 drift
  const stmJ2 = computeJ2STM(chief, dt);
  const expectedJ2 = matVecMul6(stmJ2, roe1);

  // Compute residuals: observed minus J2-expected
  // These residuals isolate the drag contribution
  const residuals: ROEVector = [
    roe2[0] - expectedJ2[0],
    roe2[1] - expectedJ2[1],
    roe2[2] - expectedJ2[2],
    roe2[3] - expectedJ2[3],
    roe2[4] - expectedJ2[4],
    roe2[5] - expectedJ2[5],
  ];

  // Finite difference on residuals gives drag derivatives
  return {
    daDotDrag: residuals[0] / dt,
    dexDotDrag: residuals[2] / dt,
    deyDotDrag: residuals[3] / dt,
  };
};

/**
 * Estimate delta-a-dot from two semi-major axis observations.
 *
 * Note: J2 does not cause secular drift in the relative semi-major axis,
 * so this is equivalent to a raw finite difference. This function is
 * provided for API completeness and explicitness.
 * @param da1 - Relative semi-major axis at time t1
 * @param da2 - Relative semi-major axis at time t2
 * @param dt - Time difference t2 - t1 [seconds]
 * @returns Estimated delta-a-dot [1/s]
 * @example
 * ```typescript
 * const daDot = estimateDaDot(roe1[0], roe2[0], 86400);
 *
 * propagateROE(roe, chief, 3600, {
 *   includeDrag: true,
 *   dragConfig: { type: 'eccentric', daDotDrag: daDot }
 * });
 * ```
 */
export const estimateDaDot = (da1: number, da2: number, dt: number): number => {
  if (dt <= 0) {
    throw new Error(`[estimateDaDot]: dt must be positive (dt=${dt})`);
  }
  return (da2 - da1) / dt;
};
