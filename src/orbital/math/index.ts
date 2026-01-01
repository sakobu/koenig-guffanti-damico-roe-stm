/**
 * Math Utilities
 *
 * Mathematical operations for orbital mechanics and matrix computations.
 */

// Keplerian mechanics
export {
  angularVelocity,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  trueAnomalyFromMean,
} from './kepler';

// STM matrix-vector operations
export { matVecMul6, matVecMul7, matVecMul9 } from './matrices';

// Orbital factors (Paper Eq. 14-16)
export {
  computeApsidalState,
  computeKappa,
  computeOrbitalFactors,
} from './orbital-factors';

// Vector operations
export {
  add3,
  addROE,
  invert3x3,
  matMul3x3_3x1,
  matMul6x3_3x1,
  norm3,
  sub3,
  ZERO_ROE,
  ZERO_VECTOR3,
} from './vectors';
