/**
 * Targeting Configuration Validation
 *
 * Provides upfront validation for targeting configurations to enable
 * UI-friendly error handling without try-catch blocks.
 *
 * Use `validateTargetingConfig()` BEFORE calling `planMission()` or
 * `solveRendezvous()` to catch configuration errors at selection time.
 */

import type { ClassicalOrbitalElements } from '../types/orbital-elements';
import type {
  TargetingOptions,
  TargetingValidationResult,
} from '../types/targeting';

/** Eccentricity threshold for eccentric drag model (from Koenig et al. 2017, Section VII) */
const ECCENTRICITY_THRESHOLD = 0.05;

/**
 * Validate targeting configuration before mission planning.
 *
 * Call this function BEFORE `planMission()`, `solveRendezvous()`, or any
 * targeting function that uses propagation. This enables UI code to:
 * - Show user-friendly error messages
 * - Disable invalid options proactively
 * - Suggest fixes based on error codes
 * @param chief - Chief spacecraft orbital elements
 * @param options - Targeting options (drag config, tolerances, etc.)
 * @returns Validation result with error code and message if invalid
 * @example
 * ```typescript
 * // In UI code - validate before planning
 * const result = validateTargetingConfig(chief, options);
 * if (!result.valid) {
 *   // Show user-friendly message
 *   showWarning(result.message);
 *   if (result.suggestion) {
 *     showHint(result.suggestion);
 *   }
 *   return;
 * }
 *
 * // Safe to proceed
 * const plan = planMission(state, waypoints, chief, options);
 * ```
 */
export const validateTargetingConfig = (
  chief: ClassicalOrbitalElements,
  options?: TargetingOptions
): TargetingValidationResult => {
  // Validate chief orbital elements
  if (chief.semiMajorAxis <= 0) {
    return {
      valid: false,
      code: 'INVALID_SEMI_MAJOR_AXIS',
      message: `Semi-major axis must be positive (a=${chief.semiMajorAxis} m)`,
    };
  }

  if (chief.eccentricity < 0 || chief.eccentricity >= 1) {
    return {
      valid: false,
      code: 'INVALID_ECCENTRICITY',
      message: `Eccentricity must be in range [0, 1) (e=${chief.eccentricity})`,
    };
  }

  if (chief.gravitationalParameter <= 0) {
    return {
      valid: false,
      code: 'INVALID_GRAVITATIONAL_PARAMETER',
      message: `Gravitational parameter must be positive (mu=${chief.gravitationalParameter})`,
    };
  }

  // Check for near-equatorial orbit (quasi-nonsingular ROE limitation)
  const incDeg = (chief.inclination * 180) / Math.PI;
  if (Math.abs(incDeg) < 0.1 || Math.abs(incDeg - 180) < 0.1) {
    return {
      valid: false,
      code: 'NEAR_EQUATORIAL_ORBIT',
      message: `Near-equatorial orbit not supported (i=${incDeg.toFixed(
        2
      )} deg)`,
      suggestion:
        'Quasi-nonsingular ROE requires i > 0.1 deg. Use nonsingular ROE formulation for equatorial orbits.',
    };
  }

  // Validate drag configuration if drag is enabled
  if (options?.includeDrag) {
    if (!options.dragConfig) {
      return {
        valid: false,
        code: 'DRAG_MISSING_CONFIG',
        message: 'Drag is enabled but no drag configuration provided',
        suggestion:
          "Provide a dragConfig with type 'eccentric' or 'arbitrary'.",
      };
    }

    // Check eccentric model eccentricity requirement
    if (
      options.dragConfig.type === 'eccentric' &&
      chief.eccentricity < ECCENTRICITY_THRESHOLD
    ) {
      return {
        valid: false,
        code: 'DRAG_ECCENTRICITY_TOO_LOW',
        message: `Eccentric drag model requires e >= ${ECCENTRICITY_THRESHOLD} (e=${chief.eccentricity.toFixed(
          6
        )})`,
        suggestion: `Your orbit is near-circular. Switch to 'arbitrary' drag model, which works for any eccentricity.`,
      };
    }
  }

  return { valid: true };
};
