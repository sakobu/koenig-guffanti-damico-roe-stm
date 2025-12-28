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
  readonly type: "eccentric";
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
  readonly type: "arbitrary";
  /** Time derivative of relative semi-major axis due to drag [1/s] */
  readonly daDotDrag: number;
  /** Time derivative of relative eccentricity vector x-component due to drag [1/s] */
  readonly dexDotDrag: number;
  /** Time derivative of relative eccentricity vector y-component due to drag [1/s] */
  readonly deyDotDrag: number;
};

/**
 * Automatic drag model selection based on eccentricity.
 *
 * When type is 'auto', the library automatically selects:
 * - `eccentric` model for orbits with e >= 0.05 (uses circularization constraint)
 * - `arbitrary` model for near-circular orbits (e < 0.05)
 *
 * This is the recommended configuration for most use cases.
 *
 * Reference: Koenig et al. (2017), Sections VII-VIII.
 * @example
 * ```typescript
 * // Let the library choose the appropriate model
 * const config: DragConfigAuto = {
 *   type: 'auto',
 *   daDotDrag: -1e-10,  // Required for all orbits
 * };
 *
 * // For near-circular orbits, you can optionally provide eccentricity derivatives
 * const configWithEcc: DragConfigAuto = {
 *   type: 'auto',
 *   daDotDrag: -1e-10,
 *   dexDotDrag: -5e-12,  // Optional, defaults to 0
 *   deyDotDrag: 3e-12,   // Optional, defaults to 0
 * };
 * ```
 */
export type DragConfigAuto = {
  readonly type: "auto";
  /** Time derivative of relative semi-major axis due to drag [1/s] */
  readonly daDotDrag: number;
  /**
   * Time derivative of relative eccentricity vector x-component due to drag [1/s].
   * Optional. Used only for near-circular orbits (e < 0.05). Defaults to 0.
   */
  readonly dexDotDrag?: number;
  /**
   * Time derivative of relative eccentricity vector y-component due to drag [1/s].
   * Optional. Used only for near-circular orbits (e < 0.05). Defaults to 0.
   */
  readonly deyDotDrag?: number;
};

/**
 * Drag model configuration - discriminated union of all drag model types.
 *
 * **How to choose:**
 * - `auto`: Recommended. Automatically selects the appropriate model based on eccentricity.
 * - `eccentric`: Use for orbits with e >= 0.05. Simpler model requiring only 1 parameter
 *   (daDotDrag). Uses the circularization constraint to derive eccentricity derivatives.
 * - `arbitrary`: Use for near-circular orbits (e < 0.05) or when you have estimates
 *   of all 3 derivatives from navigation data. More accurate but requires more data.
 *
 * The library validates that the eccentric model is only used with e >= 0.05 and
 * throws an error otherwise.
 */
export type DragConfig =
  | DragConfigEccentric
  | DragConfigArbitrary
  | DragConfigAuto;

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
};
