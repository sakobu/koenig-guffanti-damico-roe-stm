/**
 * Matrix operations for STM computations and linear systems.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 * - D'Amico (2010) PhD Thesis, TU Delft
 */

import type {
  ROEVector,
  ROEVector7,
  ROEVector9,
  Vector3,
} from "../types/vectors";

import type {
  STM6,
  STM7,
  STM9,
  ControlMatrix6x3,
  Matrix3x3,
} from "../types/matrices";

// ============================================================================
// STM Matrix-Vector Multiplication
// ============================================================================

/**
 * Perform Matrix-Vector multiplication for a 6x6 Matrix and a 6-element Vector.
 *
 * result = A * v
 * @param A - 6x6 State Transition Matrix
 * @param v - 6-element Input Vector
 * @returns 6-element Result Vector
 */
export const matVecMul6 = (A: STM6, v: ROEVector): ROEVector => [
  A[0][0] * v[0] +
    A[0][1] * v[1] +
    A[0][2] * v[2] +
    A[0][3] * v[3] +
    A[0][4] * v[4] +
    A[0][5] * v[5],
  A[1][0] * v[0] +
    A[1][1] * v[1] +
    A[1][2] * v[2] +
    A[1][3] * v[3] +
    A[1][4] * v[4] +
    A[1][5] * v[5],
  A[2][0] * v[0] +
    A[2][1] * v[1] +
    A[2][2] * v[2] +
    A[2][3] * v[3] +
    A[2][4] * v[4] +
    A[2][5] * v[5],
  A[3][0] * v[0] +
    A[3][1] * v[1] +
    A[3][2] * v[2] +
    A[3][3] * v[3] +
    A[3][4] * v[4] +
    A[3][5] * v[5],
  A[4][0] * v[0] +
    A[4][1] * v[1] +
    A[4][2] * v[2] +
    A[4][3] * v[3] +
    A[4][4] * v[4] +
    A[4][5] * v[5],
  A[5][0] * v[0] +
    A[5][1] * v[1] +
    A[5][2] * v[2] +
    A[5][3] * v[3] +
    A[5][4] * v[4] +
    A[5][5] * v[5],
];

/**
 * Perform Matrix-Vector multiplication for a 7x7 Matrix and a 7-element Vector.
 *
 * Used by the eccentric orbit drag model (augmented with delta-a-dot).
 *
 * result = A * v
 * @param A - 7x7 State Transition Matrix
 * @param v - 7-element Input Vector
 * @returns 7-element Result Vector
 */
export const matVecMul7 = (A: STM7, v: ROEVector7): ROEVector7 => [
  A[0][0] * v[0] +
    A[0][1] * v[1] +
    A[0][2] * v[2] +
    A[0][3] * v[3] +
    A[0][4] * v[4] +
    A[0][5] * v[5] +
    A[0][6] * v[6],
  A[1][0] * v[0] +
    A[1][1] * v[1] +
    A[1][2] * v[2] +
    A[1][3] * v[3] +
    A[1][4] * v[4] +
    A[1][5] * v[5] +
    A[1][6] * v[6],
  A[2][0] * v[0] +
    A[2][1] * v[1] +
    A[2][2] * v[2] +
    A[2][3] * v[3] +
    A[2][4] * v[4] +
    A[2][5] * v[5] +
    A[2][6] * v[6],
  A[3][0] * v[0] +
    A[3][1] * v[1] +
    A[3][2] * v[2] +
    A[3][3] * v[3] +
    A[3][4] * v[4] +
    A[3][5] * v[5] +
    A[3][6] * v[6],
  A[4][0] * v[0] +
    A[4][1] * v[1] +
    A[4][2] * v[2] +
    A[4][3] * v[3] +
    A[4][4] * v[4] +
    A[4][5] * v[5] +
    A[4][6] * v[6],
  A[5][0] * v[0] +
    A[5][1] * v[1] +
    A[5][2] * v[2] +
    A[5][3] * v[3] +
    A[5][4] * v[4] +
    A[5][5] * v[5] +
    A[5][6] * v[6],
  A[6][0] * v[0] +
    A[6][1] * v[1] +
    A[6][2] * v[2] +
    A[6][3] * v[3] +
    A[6][4] * v[4] +
    A[6][5] * v[5] +
    A[6][6] * v[6],
];

/**
 * Perform Matrix-Vector multiplication for a 9x9 Matrix and a 9-element Vector.
 *
 * Used by the arbitrary eccentricity drag model (augmented with three drag derivatives).
 *
 * result = A * v
 * @param A - 9x9 State Transition Matrix
 * @param v - 9-element Input Vector
 * @returns 9-element Result Vector
 */
export const matVecMul9 = (A: STM9, v: ROEVector9): ROEVector9 => [
  A[0][0] * v[0] +
    A[0][1] * v[1] +
    A[0][2] * v[2] +
    A[0][3] * v[3] +
    A[0][4] * v[4] +
    A[0][5] * v[5] +
    A[0][6] * v[6] +
    A[0][7] * v[7] +
    A[0][8] * v[8],
  A[1][0] * v[0] +
    A[1][1] * v[1] +
    A[1][2] * v[2] +
    A[1][3] * v[3] +
    A[1][4] * v[4] +
    A[1][5] * v[5] +
    A[1][6] * v[6] +
    A[1][7] * v[7] +
    A[1][8] * v[8],
  A[2][0] * v[0] +
    A[2][1] * v[1] +
    A[2][2] * v[2] +
    A[2][3] * v[3] +
    A[2][4] * v[4] +
    A[2][5] * v[5] +
    A[2][6] * v[6] +
    A[2][7] * v[7] +
    A[2][8] * v[8],
  A[3][0] * v[0] +
    A[3][1] * v[1] +
    A[3][2] * v[2] +
    A[3][3] * v[3] +
    A[3][4] * v[4] +
    A[3][5] * v[5] +
    A[3][6] * v[6] +
    A[3][7] * v[7] +
    A[3][8] * v[8],
  A[4][0] * v[0] +
    A[4][1] * v[1] +
    A[4][2] * v[2] +
    A[4][3] * v[3] +
    A[4][4] * v[4] +
    A[4][5] * v[5] +
    A[4][6] * v[6] +
    A[4][7] * v[7] +
    A[4][8] * v[8],
  A[5][0] * v[0] +
    A[5][1] * v[1] +
    A[5][2] * v[2] +
    A[5][3] * v[3] +
    A[5][4] * v[4] +
    A[5][5] * v[5] +
    A[5][6] * v[6] +
    A[5][7] * v[7] +
    A[5][8] * v[8],
  A[6][0] * v[0] +
    A[6][1] * v[1] +
    A[6][2] * v[2] +
    A[6][3] * v[3] +
    A[6][4] * v[4] +
    A[6][5] * v[5] +
    A[6][6] * v[6] +
    A[6][7] * v[7] +
    A[6][8] * v[8],
  A[7][0] * v[0] +
    A[7][1] * v[1] +
    A[7][2] * v[2] +
    A[7][3] * v[3] +
    A[7][4] * v[4] +
    A[7][5] * v[5] +
    A[7][6] * v[6] +
    A[7][7] * v[7] +
    A[7][8] * v[8],
  A[8][0] * v[0] +
    A[8][1] * v[1] +
    A[8][2] * v[2] +
    A[8][3] * v[3] +
    A[8][4] * v[4] +
    A[8][5] * v[5] +
    A[8][6] * v[6] +
    A[8][7] * v[7] +
    A[8][8] * v[8],
];

// ============================================================================
// Control Matrix Operations
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
      "[matrices]: Jacobian matrix is singular. " +
        "The problem may be ill-conditioned at this configuration."
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
