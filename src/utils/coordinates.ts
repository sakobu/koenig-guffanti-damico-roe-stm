import type { Vector3 as ThreeVector3 } from 'three';

import type { Vector3 } from '@orbital';

/**
 * RIC (Radial, In-track, Cross-track) to Three.js coordinate conversion.
 *
 * RIC Frame (spacecraft relative motion):
 *   R = Radial (away from Earth center)
 *   I = In-track (along velocity vector)
 *   C = Cross-track (completes right-hand system)
 *
 * Three.js coordinate system:
 *   X = right
 *   Y = up
 *   Z = toward camera (depth)
 *
 * Mapping: R→Y (up), I→X (right), C→Z (depth)
 */

/** Convert Three.js Vector3 to RIC position [R, I, C] */
export function threeToRicPosition(v: ThreeVector3): Vector3 {
  return [
    v.y, // y → R (up)
    v.x, // x → I (right)
    v.z, // z → C (depth)
  ];
}

/** Convert RIC position to scene coordinates (tuple). Use for R3F props. */
export function ricToPosition(ric: Vector3): Vector3 {
  return [
    ric[1], // I → x (right)
    ric[0], // R → y (up)
    ric[2], // C → z (depth)
  ];
}
