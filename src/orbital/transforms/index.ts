/**
 * State Transformations
 *
 * Coordinate conversions and state vector utilities.
 */

// ROE <-> RIC conversions
export {
  getRICtoROEMatrix,
  getROEtoRICMatrix,
  ricToROE,
  roeToRIC,
} from './roe-ric';

// ROE state helpers
export {
  computeInverseJMatrix,
  // J transformation matrices (currently unused - flagged for review)
  computeJMatrix,
  normalizeAngle,
  roeToVector,
  vectorToROE,
} from './roe-vector';
