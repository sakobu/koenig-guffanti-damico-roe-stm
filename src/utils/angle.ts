/**
 * Two pi (full circle in radians)
 */
export const TWO_PI = 2 * Math.PI;

/**
 * Degrees to radians conversion factor
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * Radians to degrees conversion factor
 */
export const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}
