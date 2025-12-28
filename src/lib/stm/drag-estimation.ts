/**
 * Drag Derivative Estimation Utilities
 *
 * Provides functions to estimate differential drag derivatives from ROE observations.
 * These utilities properly account for J2 secular drift when computing estimates.
 *
 * For best results, use observations spanning at least one orbital period.
 * Shorter intervals may be dominated by noise; longer intervals may violate
 * the linear STM assumption.
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
 * This is the recommended approach for estimating drag derivatives from
 * ROE observations when you don't have access to a full navigation filter.
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
