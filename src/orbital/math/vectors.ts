/**
 * Vector operations for orbital mechanics.
 *
 * Provides basic vector arithmetic for 3D vectors and 6-element ROE vectors.
 */

import type { ROEVector, Vector3 } from "../types/vectors";

// ============================================================================
// 3D Vector Operations
// ============================================================================

/**
 * Compute Euclidean norm of a 3-vector.
 * @param v - Input 3-vector
 * @returns Euclidean norm (magnitude) of v
 */
export const norm3 = (v: Vector3): number => Math.hypot(v[0], v[1], v[2]);

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
// ROE Vector Operations (6D)
// ============================================================================

/**
 * Compute Euclidean norm of a 6-vector (ROE).
 * @param v - Input 6-vector (ROE state)
 * @returns Euclidean norm (magnitude) of v
 */
export const norm6 = (v: ROEVector): number =>
  Math.hypot(v[0], v[1], v[2], v[3], v[4], v[5]);

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
