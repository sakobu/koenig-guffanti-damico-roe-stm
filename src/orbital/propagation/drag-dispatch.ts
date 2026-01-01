/**
 * Drag Model Dispatcher
 *
 * Provides a unified interface for applying drag STMs regardless of model type.
 * Model selection is explicit via the drag configuration.
 *
 * **Available Models:**
 * - `eccentric`: 7x7 STM for orbits with e >= 0.05 (Section VII, Appendix C)
 * - `arbitrary`: 9x9 STM for any eccentricity including near-circular (Section VIII, Appendix D)
 *
 * **Obtaining Drag Parameters:**
 *
 * The drag configuration requires estimated drag derivatives (daDotDrag, etc.).
 * These can be obtained from ROE observations using the estimation utilities
 * in drag-estimation.ts, which implement a simplified batch LS approach.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices
 * for Spacecraft Relative Motion in Perturbed Orbits", JGCD Vol. 40, No. 7
 * @see ../stm/drag-estimation.ts - Estimate drag params from ROE observations
 */

import type { DragConfig } from "../types/config";
import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { ROEVector } from "../types/vectors";

import { computeJ2DragSTMArbitrary } from "../stm/drag-arbitrary";
import { computeJ2DragSTMEccentric } from "../stm/drag-eccentric";

/** Eccentricity threshold for model selection (Section VII) */
const ECCENTRICITY_THRESHOLD = 0.05;

/**
 * Propagate ROE with J2 and differential drag.
 *
 * Entry point for drag propagation. Model selection is explicit:
 *
 * - `type: 'eccentric'`: Uses 7x7 STM with circularization constraint (e >= 0.05 required)
 * - `type: 'arbitrary'`: Uses 9x9 STM for any eccentricity
 *
 * Reference: Koenig et al. (2017), Sections VII-VIII
 * @param roe - Initial 6D quasi-nonsingular ROE
 * @param chief - Chief orbital elements
 * @param tau - Propagation time [seconds]
 * @param dragConfig - Drag configuration specifying model type and derivatives
 * @returns Propagated 6D ROE
 * @throws {Error} If eccentric model used with e < 0.05
 * @example
 * ```typescript
 * // Eccentric model (e >= 0.05)
 * const result = propagateWithDrag(roe, chief, 3600, {
 *   type: 'eccentric',
 *   daDotDrag: -1e-10,
 * });
 *
 * // Arbitrary model (any eccentricity)
 * const result = propagateWithDrag(roe, chief, 3600, {
 *   type: 'arbitrary',
 *   daDotDrag: -1e-10,
 *   dexDotDrag: 0,
 *   deyDotDrag: 0,
 * });
 * ```
 */
export const propagateWithDrag = (
  roe: ROEVector,
  chief: ClassicalOrbitalElements,
  tau: number,
  dragConfig: DragConfig
): ROEVector => {
  if (dragConfig.type === "eccentric") {
    // Validate eccentricity threshold
    if (chief.eccentricity < ECCENTRICITY_THRESHOLD) {
      throw new Error(
        `[drag]: Eccentric model requires e >= ${ECCENTRICITY_THRESHOLD} ` +
          `(e=${chief.eccentricity.toFixed(
            6
          )}). Use 'arbitrary' model for near-circular orbits.`
      );
    }
    const { propagate } = computeJ2DragSTMEccentric(chief, tau);
    return propagate(roe, dragConfig.daDotDrag);
  } else {
    const { propagate } = computeJ2DragSTMArbitrary(chief, tau);
    return propagate(roe, {
      daDotDrag: dragConfig.daDotDrag,
      dexDotDrag: dragConfig.dexDotDrag,
      deyDotDrag: dragConfig.deyDotDrag,
    });
  }
};
