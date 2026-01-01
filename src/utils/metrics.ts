import type { Vector3 } from '@orbital';

/**
 * Compute distance from origin (Chief is at origin)
 */
export function computeDistance(position: Vector3): number {
  return Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
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
