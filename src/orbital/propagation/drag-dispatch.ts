/**
 * Differential Drag Model Dispatch
 *
 * Provides automatic model selection for drag propagation based on
 * eccentricity and configuration type.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017), Sections VII-VIII
 */

import type {
  DragConfig,
  DragConfigArbitrary,
} from "../types/config";
import type { ClassicalOrbitalElements } from "../types/orbital-elements";
import type { ROEVector } from "../types/vectors";

import {
  computeJ2DragSTMArbitrary,
  eccentricToArbitraryConfig,
} from "../stm/drag-arbitrary";
import { computeJ2DragSTMEccentric } from "../stm/drag-eccentric";

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
      // Derive eccentricity derivatives from daDotDrag using circularization constraint
      // if not explicitly provided
      const config: Omit<DragConfigArbitrary, "type"> =
        dragConfig.dexDotDrag !== undefined &&
        dragConfig.deyDotDrag !== undefined
          ? {
              daDotDrag: dragConfig.daDotDrag,
              dexDotDrag: dragConfig.dexDotDrag,
              deyDotDrag: dragConfig.deyDotDrag,
            }
          : eccentricToArbitraryConfig(dragConfig.daDotDrag, chief);

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
