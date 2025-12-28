/**
 * Differential Drag State Transition Matrices
 *
 * This module provides density-model-free drag STMs from Koenig et al. (2017).
 * Instead of requiring atmospheric density models, these STMs use estimated
 * time derivatives of the relative orbital elements due to drag.
 *
 * **Available Models:**
 * - `eccentric`: 7x7 STM for orbits with e >= 0.05 (Section VII, Appendix C)
 * - `arbitrary`: 9x9 STM for any eccentricity including near-circular (Section VIII, Appendix D)
 * - `auto`: Automatically selects the appropriate model based on eccentricity
 *
 * **Estimation Utilities:**
 * - `estimateDragDerivativesWithJ2Correction`: Recommended for estimating drag derivatives
 * - `estimateDaDot`: Simple semi-major axis derivative estimation
 *
 * Reference: Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices
 * for Spacecraft Relative Motion in Perturbed Orbits", JGCD Vol. 40, No. 7
 */

import type {
  DragConfig,
  DragConfigArbitrary,
} from "../../../core/types/config";
import type { ClassicalOrbitalElements } from "../../../core/types/orbital-elements";
import type { ROEVector } from "../../../core/types/vectors";

import { computeJ2DragSTMArbitrary } from "./arbitrary";
import { computeJ2DragSTMEccentric } from "./eccentric";

// Re-export STM computation functions
export { computeJ2DragSTMEccentric } from "./eccentric";
export {
  computeJ2DragSTMArbitrary,
  eccentricToArbitraryConfig,
} from "./arbitrary";

// Re-export estimation utilities
export {
  estimateDaDot,
  estimateDragDerivativesWithJ2Correction,
} from "./estimation";

/** Eccentricity threshold for model selection (Section VII) */
const ECCENTRICITY_THRESHOLD = 0.05;

/**
 * Propagate ROE with J2 and differential drag using automatic model selection.
 *
 * This is the recommended entry point for drag propagation. It automatically
 * selects the appropriate STM based on the config type and chief eccentricity:
 *
 * - `type: 'auto'`: Selects eccentric model for e >= 0.05, arbitrary for e < 0.05
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
 * // Automatic model selection (recommended)
 * const result = propagateWithDrag(roe, chief, 3600, {
 *   type: 'auto',
 *   daDotDrag: -1e-10,
 * });
 *
 * // Explicit eccentric model (e >= 0.05)
 * const result = propagateWithDrag(roe, chief, 3600, {
 *   type: 'eccentric',
 *   daDotDrag: -1e-10,
 * });
 *
 * // Explicit arbitrary model (any eccentricity)
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
  // Handle auto model selection
  if (dragConfig.type === "auto") {
    if (chief.eccentricity >= ECCENTRICITY_THRESHOLD) {
      // Use eccentric model for e >= 0.05
      const { propagate } = computeJ2DragSTMEccentric(chief, tau);
      return propagate(roe, dragConfig.daDotDrag);
    } else {
      // Use arbitrary model for near-circular orbits
      const config: Omit<DragConfigArbitrary, "type"> = {
        daDotDrag: dragConfig.daDotDrag,
        dexDotDrag: dragConfig.dexDotDrag ?? 0,
        deyDotDrag: dragConfig.deyDotDrag ?? 0,
      };
      const { propagate } = computeJ2DragSTMArbitrary(chief, tau);
      return propagate(roe, config);
    }
  }

  // Handle explicit model selection
  if (dragConfig.type === "eccentric") {
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
