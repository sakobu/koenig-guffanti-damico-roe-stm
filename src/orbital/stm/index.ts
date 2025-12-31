/**
 * State Transition Matrices
 *
 * STM implementations for Keplerian, J2, and J2+Drag propagation.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017)
 * "New State Transition Matrices for Spacecraft Relative Motion in Perturbed Orbits"
 * Journal of Guidance, Control, and Dynamics, Vol. 40, No. 7
 */

// Keplerian STM (Paper Eq. 12)
export { computeKeplerianSTM } from "./keplerian";

// J2-perturbed STM (Paper Appendix A, Eq. A6)
export { computeJ2STM, buildJ2Matrix } from "./j2";

// J2+Drag STM for eccentric orbits (Paper Section VII, Appendix C)
export { computeJ2DragSTMEccentric } from "./drag-eccentric";

// J2+Drag STM for arbitrary eccentricity (Paper Section VIII, Appendix D)
export {
  computeJ2DragSTMArbitrary,
  eccentricToArbitraryConfig,
} from "./drag-arbitrary";

// Drag estimation utilities
export {
  estimateDaDot,
  estimateDragDerivativesWithJ2Correction,
} from "./drag-estimation";
