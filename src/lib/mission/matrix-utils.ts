/**
 * Matrix Utilities for Targeting
 *
 * Specialized matrix and vector operations for the targeting solver.
 * Complements core/math/matrix-ops.ts with targeting-specific operations.
 */

import type { ROEVector, Vector3 } from '../core/types/vectors';
import type { ControlMatrix6x3, Matrix3x3 } from './types';

// ============================================================================
// Vector Operations (3D)
// ============================================================================

/**
 * Compute Euclidean norm of a 3-vector.
 * @param v - Input 3-vector
 * @returns Euclidean norm (magnitude) of v
 */
export const norm3 = (v: Vector3): number => Math.hypot(v[0], v[1], v[2]);

/**
 * Compute Euclidean norm of a 6-vector (ROE).
 * @param v - Input 6-vector (ROE state)
 * @returns Euclidean norm (magnitude) of v
 */
export const norm6 = (v: ROEVector): number =>
  Math.hypot(v[0], v[1], v[2], v[3], v[4], v[5]);

/**
 * Vector subtraction: a - b.
 * @param a - First vector (minuend)
 * @param b - Second vector (subtrahend)
 * @returns Difference vector a - b
 */
export const sub3 = (a: Vector3, b: Vector3): Vector3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

/**
 * Vector addition: a + b.
 * @param a - First vector
 * @param b - Second vector
 * @returns Sum vector a + b
 */
export const add3 = (a: Vector3, b: Vector3): Vector3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

/**
 * Scalar multiplication: s * v.
 * @param s - Scalar multiplier
 * @param v - Input vector
 * @returns Scaled vector s * v
 */
export const scale3 = (s: number, v: Vector3): Vector3 => [
  s * v[0],
  s * v[1],
  s * v[2],
];

/**
 * Negate a vector: -v.
 * @param v - Input vector
 * @returns Negated vector -v
 */
export const negate3 = (v: Vector3): Vector3 => [-v[0], -v[1], -v[2]];

/**
 * Zero vector constant.
 */
export const ZERO_VECTOR3: Vector3 = [0, 0, 0];

// ============================================================================
// Matrix-Vector Multiplication
// ============================================================================

/**
 * Multiply 6x3 matrix by 3-vector: B * v.
 *
 * Used to compute ROE change from delta-v: dROE = B * dv
 * @param B - 6x3 control influence matrix
 * @param v - 3-element delta-v vector
 * @returns 6-element ROE change vector
 */
export const matMul6x3_3x1 = (B: ControlMatrix6x3, v: Vector3): ROEVector => [
  B[0][0] * v[0] + B[0][1] * v[1] + B[0][2] * v[2],
  B[1][0] * v[0] + B[1][1] * v[1] + B[1][2] * v[2],
  B[2][0] * v[0] + B[2][1] * v[1] + B[2][2] * v[2],
  B[3][0] * v[0] + B[3][1] * v[1] + B[3][2] * v[2],
  B[4][0] * v[0] + B[4][1] * v[1] + B[4][2] * v[2],
  B[5][0] * v[0] + B[5][1] * v[1] + B[5][2] * v[2],
];

/**
 * Multiply 3x3 matrix by 3-vector: A * v.
 * @param A - 3x3 matrix
 * @param v - 3-element vector
 * @returns Result vector A * v
 */
export const matMul3x3_3x1 = (A: Matrix3x3, v: Vector3): Vector3 => [
  A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
  A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
  A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2],
];

// ============================================================================
// Matrix Inversion and Linear System Solving
// ============================================================================

/**
 * Compute determinant of 3x3 matrix.
 * @param A - 3x3 matrix
 * @returns Determinant value
 */
const det3x3 = (A: Matrix3x3): number => {
  const [[a, b, c], [d, e, f], [g, h, i]] = A;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
};

/**
 * Invert a 3x3 matrix analytically.
 *
 * Uses cofactor expansion and Cramer's rule.
 * @param A - 3x3 matrix to invert
 * @returns Inverted 3x3 matrix
 * @throws {Error} If matrix is singular (det ~ 0)
 */
export const invert3x3 = (A: Matrix3x3): Matrix3x3 => {
  const [[a, b, c], [d, e, f], [g, h, i]] = A;

  const det = det3x3(A);

  if (Math.abs(det) < 1e-15) {
    throw new Error(
      '[targeting]: Jacobian matrix is singular. ' +
        'The targeting problem may be ill-conditioned at this configuration.'
    );
  }

  const invDet = 1 / det;

  // Cofactor matrix transposed (adjugate) divided by determinant
  return [
    [
      (e * i - f * h) * invDet,
      (c * h - b * i) * invDet,
      (b * f - c * e) * invDet,
    ],
    [
      (f * g - d * i) * invDet,
      (a * i - c * g) * invDet,
      (c * d - a * f) * invDet,
    ],
    [
      (d * h - e * g) * invDet,
      (b * g - a * h) * invDet,
      (a * e - b * d) * invDet,
    ],
  ];
};

/**
 * Solve 3x3 linear system A * x = b.
 *
 * Uses direct inversion (appropriate for 3x3 with good conditioning).
 * @param A - 3x3 coefficient matrix
 * @param b - 3-element right-hand side
 * @returns Solution vector x
 */
export const solve3x3 = (A: Matrix3x3, b: Vector3): Vector3 => {
  const Ainv = invert3x3(A);
  return matMul3x3_3x1(Ainv, b);
};

// ============================================================================
// ROE Vector Operations
// ============================================================================

/**
 * Add two ROE vectors element-wise.
 * @param a - First ROE vector
 * @param b - Second ROE vector
 * @returns Sum vector a + b
 */
export const addROE = (a: ROEVector, b: ROEVector): ROEVector => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
  a[3] + b[3],
  a[4] + b[4],
  a[5] + b[5],
];

/**
 * Subtract ROE vectors element-wise: a - b.
 * @param a - First ROE vector (minuend)
 * @param b - Second ROE vector (subtrahend)
 * @returns Difference vector a - b
 */
export const subROE = (a: ROEVector, b: ROEVector): ROEVector => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
  a[3] - b[3],
  a[4] - b[4],
  a[5] - b[5],
];

/**
 * Zero ROE vector constant.
 */
export const ZERO_ROE: ROEVector = [0, 0, 0, 0, 0, 0];
