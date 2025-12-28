/**
 * ROE <-> RIC Conversions (Matrix-Based)
 *
 * Converts between Quasi-Nonsingular Relative Orbital Elements and
 * RIC (Radial-Intrack-Crosstrack) position/velocity.
 *
 * Reference: D'Amico, S., "Autonomous Formation Flying in Low Earth Orbit,"
 * PhD Thesis, TU Delft, 2010, Section 2.1.3
 *
 * This implementation supports arbitrary eccentricity orbits by:
 * - Using true anomaly (nu) instead of mean anomaly (M)
 * - Using instantaneous radius r = a(1-e^2)/(1+e*cos(nu)) instead of a
 * - Accounting for varying radial velocity (dr/dt) and angular velocity (d(theta)/dt)
 *
 * The transformation reduces to the near-circular form (Eq. 2.17) when e -> 0.
 */

import type { STM6 } from "../types/matrices";
import type {
  ClassicalOrbitalElements,
  QuasiNonsingularROE,
} from "../types/orbital-elements";
import type { RelativeState, ROEVector } from "../types/vectors";

import { matVecMul6 } from "../math/matrices";
import {
  angularVelocity,
  meanMotion,
  orbitalRadius,
  radialVelocity,
  trueAnomalyFromMean,
} from "../math/kepler";
import { roeToVector, vectorToROE } from "./roe-vector";

// ============================================================================
// INTERNAL HELPER TYPES (used only by this module)
// ============================================================================

/** 2D vector tuple. */
type Vector2 = readonly [number, number];

/** 2x2 Matrix. */
type Matrix2x2 = readonly [Vector2, Vector2];

/** 4D vector tuple. */
type Vector4 = readonly [number, number, number, number];

/** 4x4 Matrix. */
type Matrix4x4 = readonly [Vector4, Vector4, Vector4, Vector4];

/** Mutable 8-element row for Gaussian elimination. */
type MutableRow8 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/** Mutable 4x8 augmented matrix for Gaussian elimination. */
type MutableMatrix4x8 = [MutableRow8, MutableRow8, MutableRow8, MutableRow8];

/**
 * Build the 6x6 transformation matrix T for arbitrary eccentricity orbits.
 *
 * Maps ROE to RIC state:
 * [R, I, C, vR, vI, vC]^T = T * [da, dlambda, dex, dey, dix, diy]^T
 *
 * This is derived from D'Amico (2010), Eq. 2.14 converted to quasi-nonsingular
 * ROE. It reduces to Eq. 2.17 (near-circular) when e -> 0.
 *
 * Key differences from the near-circular form:
 * - Uses true anomaly nu instead of mean anomaly M
 * - Uses instantaneous radius r instead of semi-major axis a
 * - Accounts for dr/dt (radial velocity) in velocity terms
 * - Uses actual angular velocity d(theta)/dt instead of mean motion n
 * @param chief - Chief orbital elements
 * @returns 6x6 transformation matrix T
 */
const buildTransformationMatrix = (chief: ClassicalOrbitalElements): STM6 => {
  const {
    semiMajorAxis: a,
    eccentricity: e,
    argumentOfPerigee: omega,
    meanAnomaly: M,
    gravitationalParameter: mu,
  } = chief;

  // Convert mean anomaly to true anomaly
  const nu = trueAnomalyFromMean(M, e);

  // Argument of latitude (with true anomaly)
  const theta = omega + nu;

  // Instantaneous orbital radius
  const r = orbitalRadius(a, e, nu);

  // Mean motion
  const n = meanMotion(a, mu);

  // Radial velocity dr/dt (zero for circular orbits)
  const rDot = radialVelocity(a, e, nu, mu);

  // Angular velocity d(theta)/dt (equals n for circular orbits)
  const thetaDot = angularVelocity(a, e, nu, mu);

  // Trig terms using true anomaly based argument of latitude
  const cos_theta = Math.cos(theta);
  const sin_theta = Math.sin(theta);

  // Position transformation coefficients
  // These use r instead of a to account for varying orbital radius

  // Velocity transformation coefficients
  // These combine radial velocity (rDot) and angular velocity (thetaDot)
  // d(r*cos(theta))/dt = rDot*cos(theta) - r*thetaDot*sin(theta)
  // d(r*sin(theta))/dt = rDot*sin(theta) + r*thetaDot*cos(theta)

  const rThetaDot = r * thetaDot; // Common term: r * d(theta)/dt

  return [
    // Row 0 (R): Position radial
    // R = r*da - r*cos(theta)*dex - r*sin(theta)*dey
    [r, 0, -r * cos_theta, -r * sin_theta, 0, 0],

    // Row 1 (I): Position along-track (in-track)
    // I = r*dlambda + 2*r*sin(theta)*dex - 2*r*cos(theta)*dey
    [0, r, 2 * r * sin_theta, -2 * r * cos_theta, 0, 0],

    // Row 2 (C): Position cross-track
    // C = r*sin(theta)*dix - r*cos(theta)*diy
    [0, 0, 0, 0, r * sin_theta, -r * cos_theta],

    // Row 3 (vR): Velocity radial
    // vR = d(R)/dt = rDot*da + (rThetaDot*sin - rDot*cos)*dex + (-rThetaDot*cos - rDot*sin)*dey
    [
      rDot,
      0,
      rThetaDot * sin_theta - rDot * cos_theta,
      -rThetaDot * cos_theta - rDot * sin_theta,
      0,
      0,
    ],

    // Row 4 (vI): Velocity along-track (in-track)
    // vI = d(I)/dt = -1.5*r*n*da + rDot*dlambda + 2*(rDot*sin + rThetaDot*cos)*dex + 2*(-rDot*cos + rThetaDot*sin)*dey
    // The -1.5*r*n*da term comes from secular drift: d(dlambda)/dt = -1.5*n*da
    [
      -1.5 * r * n,
      rDot,
      2 * (rDot * sin_theta + rThetaDot * cos_theta),
      2 * (-rDot * cos_theta + rThetaDot * sin_theta),
      0,
      0,
    ],

    // Row 5 (vC): Velocity cross-track
    // vC = d(C)/dt = (rDot*sin + rThetaDot*cos)*dix + (-rDot*cos + rThetaDot*sin)*diy
    [
      0,
      0,
      0,
      0,
      rDot * sin_theta + rThetaDot * cos_theta,
      -rDot * cos_theta + rThetaDot * sin_theta,
    ],
  ];
};

/**
 * Invert a 2x2 matrix analytically.
 * @param M - 2x2 matrix
 * @returns Inverted 2x2 matrix
 */
const invert2x2 = (M: Matrix2x2): Matrix2x2 => {
  const [[a, b], [c, d]] = M;
  const det = a * d - b * c;

  if (Math.abs(det) < 1e-15) {
    throw new Error(
      "ROE<->RIC: Out-of-plane matrix is singular. " +
        "This can happen at theta = 0 deg or 180 deg with certain ROE configurations."
    );
  }

  return [
    [d / det, -b / det],
    [-c / det, a / det],
  ];
};

/**
 * Invert a 4x4 matrix using Gaussian elimination with partial pivoting.
 * @param M - 4x4 matrix
 * @returns Inverted 4x4 matrix
 */
const invert4x4 = (M: Matrix4x4): Matrix4x4 => {
  // Create augmented matrix [M | I] with proper types
  const aug: MutableMatrix4x8 = [
    [M[0][0], M[0][1], M[0][2], M[0][3], 1, 0, 0, 0],
    [M[1][0], M[1][1], M[1][2], M[1][3], 0, 1, 0, 0],
    [M[2][0], M[2][1], M[2][2], M[2][3], 0, 0, 1, 0],
    [M[3][0], M[3][1], M[3][2], M[3][3], 0, 0, 0, 1],
  ];

  // Helper for indexed access (TypeScript can't infer bounds from loop)
  type Idx4 = 0 | 1 | 2 | 3;
  type Idx8 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

  for (let col = 0 as Idx4; col < 4; col++) {
    // Find pivot
    let maxRow: Idx4 = col;
    let maxVal = Math.abs(aug[col][col]);

    for (let row = (col + 1) as Idx4; row < 4; row++) {
      const val = Math.abs(aug[row][col]);
      if (val > maxVal) {
        maxRow = row;
        maxVal = val;
      }
    }

    if (maxVal < 1e-15) {
      throw new Error(
        "ROE<->RIC: In-plane matrix is singular. " +
          "Check orbital elements for degenerate configuration."
      );
    }

    // Swap rows
    if (maxRow !== col) {
      const temp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = temp;
    }

    // Normalize pivot row
    const pivot = aug[col][col];
    for (let j = 0 as Idx8; j < 8; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0 as Idx4; row < 4; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0 as Idx8; j < 8; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  // Extract inverse (right half)
  return [
    [aug[0][4], aug[0][5], aug[0][6], aug[0][7]],
    [aug[1][4], aug[1][5], aug[1][6], aug[1][7]],
    [aug[2][4], aug[2][5], aug[2][6], aug[2][7]],
    [aug[3][4], aug[3][5], aug[3][6], aug[3][7]],
  ];
};

/**
 * Invert the 6x6 transformation matrix using block structure.
 * @param T - 6x6 transformation matrix
 * @returns Inverted 6x6 transformation matrix
 */
const invertTransformationMatrix = (T: STM6): STM6 => {
  // Extract the 4x4 in-plane block (rows 0,1,3,4; cols 0,1,2,3)
  const A: Matrix4x4 = [
    [T[0][0], T[0][1], T[0][2], T[0][3]],
    [T[1][0], T[1][1], T[1][2], T[1][3]],
    [T[3][0], T[3][1], T[3][2], T[3][3]],
    [T[4][0], T[4][1], T[4][2], T[4][3]],
  ];

  // Extract the 2x2 out-of-plane block (rows 2,5; cols 4,5)
  const B: Matrix2x2 = [
    [T[2][4], T[2][5]],
    [T[5][4], T[5][5]],
  ];

  const Ainv = invert4x4(A);
  const Binv = invert2x2(B);

  // Reconstruct 6x6 inverse declaratively
  // Mapping:
  // ROE (out rows): 0=da, 1=dlambda, 2=dex, 3=dey, 4=dix, 5=diy
  // RIC (in cols): 0=R, 1=I, 2=C, 3=vR, 4=vI, 5=vC
  //
  // Ainv maps [R, I, vR, vI] -> [da, dlambda, dex, dey]
  // Binv maps [C, vC] -> [dix, diy]

  return [
    // Row 0 (da): inputs from Ainv row 0 (R, I, vR, vI) -> cols 0, 1, 3, 4
    [Ainv[0][0], Ainv[0][1], 0, Ainv[0][2], Ainv[0][3], 0],

    // Row 1 (dlambda): inputs from Ainv row 1
    [Ainv[1][0], Ainv[1][1], 0, Ainv[1][2], Ainv[1][3], 0],

    // Row 2 (dex): inputs from Ainv row 2
    [Ainv[2][0], Ainv[2][1], 0, Ainv[2][2], Ainv[2][3], 0],

    // Row 3 (dey): inputs from Ainv row 3
    [Ainv[3][0], Ainv[3][1], 0, Ainv[3][2], Ainv[3][3], 0],

    // Row 4 (dix): inputs from Binv row 0 (C, vC) -> cols 2, 5
    [0, 0, Binv[0][0], 0, 0, Binv[0][1]],

    // Row 5 (diy): inputs from Binv row 1
    [0, 0, Binv[1][0], 0, 0, Binv[1][1]],
  ];
};

/**
 * Convert Quasi-Nonsingular ROE to RIC position and velocity.
 * @param chief - Chief orbital elements
 * @param roe - Relative Orbital Elements
 * @returns Relative state (position and velocity)
 */
export const roeToRIC = (
  chief: ClassicalOrbitalElements,
  roe: QuasiNonsingularROE
): RelativeState => {
  const T = getROEtoRICMatrix(chief);
  const ricVec = matVecMul6(T, roeToVector(roe));

  return {
    position: [ricVec[0], ricVec[1], ricVec[2]],
    velocity: [ricVec[3], ricVec[4], ricVec[5]],
  };
};

/**
 * Convert RIC position and velocity to Quasi-Nonsingular ROE.
 * @param chief - Chief orbital elements
 * @param ric - Relative state (position and velocity)
 * @returns Quasi-Nonsingular ROE
 */
export const ricToROE = (
  chief: ClassicalOrbitalElements,
  ric: RelativeState
): QuasiNonsingularROE => {
  const Tinv = getRICtoROEMatrix(chief);
  const ricVec: ROEVector = [...ric.position, ...ric.velocity] as ROEVector;

  return vectorToROE(matVecMul6(Tinv, ricVec));
};

/**
 * Get the transformation matrix T.
 * @param chief - Chief orbital elements
 * @returns 6x6 Transformation Matrix
 */
export const getROEtoRICMatrix = (chief: ClassicalOrbitalElements): STM6 =>
  buildTransformationMatrix(chief);

/**
 * Get the inverse transformation matrix T^-1.
 * @param chief - Chief orbital elements
 * @returns 6x6 Inverse Transformation Matrix
 */
export const getRICtoROEMatrix = (chief: ClassicalOrbitalElements): STM6 => {
  const T = buildTransformationMatrix(chief);
  return invertTransformationMatrix(T);
};
