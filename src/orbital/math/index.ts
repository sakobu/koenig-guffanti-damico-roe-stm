/**
 * Math Utilities
 *
 * Mathematical operations for orbital mechanics and matrix computations.
 */

// Keplerian mechanics
export {
  trueAnomalyFromMean,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  angularVelocity,
} from "./kepler";

// STM matrix-vector operations
export { matVecMul6, matVecMul7, matVecMul9 } from "./matrices";

// Orbital factors (Paper Eq. 14-16)
export {
  computeKappa,
  computeOrbitalFactors,
  computeApsidalState,
} from "./orbital-factors";

// Vector operations
export {
  norm3,
  sub3,
  add3,
  ZERO_VECTOR3,
  matMul6x3_3x1,
  matMul3x3_3x1,
  invert3x3,
  addROE,
  ZERO_ROE,
} from "./vectors";
