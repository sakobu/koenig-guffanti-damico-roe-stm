/**
 * State Transition Matrices for ROE propagation.
 *
 * Reference: Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices
 * for Spacecraft Relative Motion in Perturbed Orbits", JGCD Vol. 40, No. 7
 */

export { computeKeplerianSTM } from "./keplerian";
export { buildJ2Matrix, computeJ2STM } from "./j2";
export { computeJ2DragSTMEccentric } from "./drag-eccentric";
export { computeJ2DragSTMArbitrary, eccentricToArbitraryConfig } from "./drag-arbitrary";
export { estimateDaDot, estimateDragDerivativesWithJ2Correction } from "./drag-estimation";
