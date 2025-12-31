/**
 * Vector and state vector type definitions.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 */

/**
 * 3D vector tuple [x, y, z].
 */
export type Vector3 = readonly [x: number, y: number, z: number];

/**
 * Relative state vector containing position and velocity.
 */
export type RelativeState = {
  /** Relative position vector [x, y, z] in meters */
  readonly position: Vector3;
  /** Relative velocity vector [vx, vy, vz] in m/s */
  readonly velocity: Vector3;
};

/**
 * ROE as a 6-element vector for linear algebra operations.
 * Order: [da, dlambda, dex, dey, dix, diy]
 */
export type ROEVector = readonly [
  da: number,
  dlambda: number,
  dex: number,
  dey: number,
  dix: number,
  diy: number
];

/**
 * 7-element augmented ROE vector for eccentric drag model.
 * Order: [da, dlambda, dex, dey, dix, diy, daDotDrag]
 */
export type ROEVector7 = readonly [
  da: number,
  dlambda: number,
  dex: number,
  dey: number,
  dix: number,
  diy: number,
  daDotDrag: number
];

/**
 * 9-element augmented ROE vector for arbitrary drag model.
 * Order: [da, dlambda, dex, dey, dix, diy, daDotDrag, dexDotDrag, deyDotDrag]
 */
export type ROEVector9 = readonly [
  da: number,
  dlambda: number,
  dex: number,
  dey: number,
  dix: number,
  diy: number,
  daDotDrag: number,
  dexDotDrag: number,
  deyDotDrag: number
];
