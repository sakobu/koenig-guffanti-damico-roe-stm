/**
 * Configuration and options type definitions.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 */

/**
 * Density-model-free drag configuration for ECCENTRIC orbits (e >= 0.05).
 *
 * Uses the circularization constraint assumption, reducing the problem to estimating
 * a single drag parameter (da_dot).
 *
 * Reference: Koenig et al. (2017), Section VII.
 * @example
 * ```typescript
 * // For eccentric orbits (e >= 0.05), only daDotDrag is needed
 * const config: DragConfigEccentric = {
 *   type: 'eccentric',
 *   daDotDrag: -1e-10,  // Estimated from navigation filter
 * };
 *
 * propagateROE(roe, chief, 3600, {
 *   includeDrag: true,
 *   dragConfig: config,
 * });
 * ```
 */
export type DragConfigEccentric = {
  readonly type: 'eccentric';
  /**
   * Time derivative of relative semi-major axis due to drag [1/s].
   * This value should be estimated from a navigation filter.
   */
  readonly daDotDrag: number;
};

/**
 * Density-model-free drag configuration for ARBITRARY eccentricity (including near-circular).
 *
 * Does NOT assume circularization. Requires estimation of 3 drag parameters.
 * Use this model for near-circular orbits (e < 0.05) where the circularization
 * constraint does not hold.
 *
 * Reference: Koenig et al. (2017), Section VIII / Appendix D.
 * @example
 * ```typescript
 * // For near-circular orbits (e < 0.05), all 3 derivatives are required
 * const config: DragConfigArbitrary = {
 *   type: 'arbitrary',
 *   daDotDrag: -1e-10,   // From navigation filter
 *   dexDotDrag: -5e-12,  // From navigation filter
 *   deyDotDrag: 3e-12,   // From navigation filter
 * };
 *
 * propagateROE(roe, chief, 3600, {
 *   includeDrag: true,
 *   dragConfig: config,
 * });
 * ```
 */
export type DragConfigArbitrary = {
  readonly type: 'arbitrary';
  /** Time derivative of relative semi-major axis due to drag [1/s] */
  readonly daDotDrag: number;
  /** Time derivative of relative eccentricity vector x-component due to drag [1/s] */
  readonly dexDotDrag: number;
  /** Time derivative of relative eccentricity vector y-component due to drag [1/s] */
  readonly deyDotDrag: number;
};

/**
 * Drag model configuration - discriminated union of supported drag model types.
 *
 * You must explicitly choose a model based on your orbit's eccentricity:
 *
 * - `eccentric`: For orbits with e >= 0.05. Uses the circularization constraint
 *   (Eq. 69) to derive eccentricity derivatives from daDotDrag alone.
 *   Reference: Koenig et al. (2017), Section VII / Appendix C.
 *
 * - `arbitrary`: For near-circular orbits (e < 0.05) or when the circularization
 *   assumption doesn't apply. Requires all 3 drag derivatives explicitly.
 *   Reference: Koenig et al. (2017), Section VIII / Appendix D.
 *
 * The library validates that the eccentric model is only used with e >= 0.05 and
 * throws an error otherwise.
 */
export type DragConfig = DragConfigEccentric | DragConfigArbitrary;

/**
 * Options for ROE propagation.
 *
 * Controls which perturbations to include in the propagation.
 */
export type ROEPropagationOptions = {
  /**
   * Include J2 perturbation effects.
   * Default: true
   *
   * Note: Cannot be set to false when includeDrag is true, as the drag
   * STMs inherently include J2 effects per Koenig et al. (2017).
   */
  readonly includeJ2?: boolean;

  /**
   * Include differential drag effects.
   * Default: false
   *
   * When enabled, J2 effects are always included (the drag STMs from
   * Koenig et al. (2017) inherently couple J2 - see Appendix C, D).
   */
  readonly includeDrag?: boolean;

  /**
   * Drag model configuration.
   * Required if includeDrag is true.
   */
  readonly dragConfig?: DragConfig;

  /**
   * Chief spacecraft ABSOLUTE semi-major axis decay rate [m/s].
   *
   * **NOTE:** This is an implementation convenience, NOT from Koenig et al. (2017).
   * The paper's STMs model relative dynamics only. This parameter enables
   * chief element updates for multi-step propagation scenarios.
   *
   * When provided, `propagateROEWithChief` will update the chief's
   * semi-major axis to account for drag-induced decay. This is separate
   * from `daDotDrag` in the drag config, which is the *relative* (differential)
   * drag rate between deputy and chief per the paper's formulation.
   *
   * Typical LEO decay rates are -0.5 to -5 m/day for the ISS class.
   * Convert to m/s: -1 m/day = -1.16e-5 m/s
   *
   * If not provided, chief semi-major axis remains constant during propagation.
   */
  readonly chiefAbsoluteDaDot?: number;
};
