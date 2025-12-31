/**
 * State Transformations
 *
 * Coordinate conversions and state vector utilities.
 */

// ROE <-> RIC conversions
export {
  roeToRIC,
  ricToROE,
  getROEtoRICMatrix,
  getRICtoROEMatrix,
} from "./roe-ric";

// ROE state helpers
export {
  roeToVector,
  vectorToROE,
  normalizeAngle,
  // J transformation matrices (currently unused - flagged for review)
  computeJMatrix,
  computeInverseJMatrix,
} from "./roe-vector";
