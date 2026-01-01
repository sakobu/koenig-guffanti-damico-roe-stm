import type { Vector3 } from '@orbital';

/**
 * Compute distance from origin (Chief is at origin)
 */
export function computeDistance(position: Vector3): number {
  return Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
}

/**
 * Check if a velocity vector is non-zero (any component >= 0.001 m/s)
 */
export function hasVelocity(velocity: Vector3 | undefined): boolean {
  if (!velocity) return false;
  const [r, i, c] = velocity;
  return Math.abs(r) >= 0.001 || Math.abs(i) >= 0.001 || Math.abs(c) >= 0.001;
}

/**
 * Detect which velocity preset matches a given velocity vector
 * Returns 'stationary', 'driftForward', 'driftBackward', or 'custom'
 */
export function getVelocityPreset(
  velocity: Vector3 | undefined
): 'stationary' | 'driftForward' | 'driftBackward' | 'custom' {
  if (!velocity) return 'stationary';
  const [r, i, c] = velocity;
  if (Math.abs(r) < 0.001 && Math.abs(i - 0.1) < 0.001 && Math.abs(c) < 0.001) {
    return 'driftForward';
  }
  if (Math.abs(r) < 0.001 && Math.abs(i + 0.1) < 0.001 && Math.abs(c) < 0.001) {
    return 'driftBackward';
  }
  if (Math.abs(r) < 0.001 && Math.abs(i) < 0.001 && Math.abs(c) < 0.001) {
    return 'stationary';
  }
  return 'custom';
}

/**
 * Compute cumulative arc length along the trajectory up to a given index.
 */
export function computeDistanceTraveled(
  points: readonly { position: Vector3 }[],
  upToIndex: number
): number {
  if (upToIndex <= 0 || points.length < 2) return 0;

  let total = 0;
  const limit = Math.min(upToIndex, points.length - 1);

  for (let i = 0; i < limit; i++) {
    const p1 = points[i].position;
    const p2 = points[i + 1].position;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  return total;
}
