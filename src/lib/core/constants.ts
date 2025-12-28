/**
 * Physical constants for orbital mechanics.
 *
 * Sources:
 * - IERS Conventions (2010), IERS Technical Note No. 36
 * - WGS84 (World Geodetic System 1984)
 * - Vallado, D.A. "Fundamentals of Astrodynamics and Applications" 4th ed.
 */

/**
 * Earth's second zonal harmonic (oblateness coefficient).
 *
 * Source: EGM2008 / IERS Conventions (2010), Table 1.1
 * Also known as C20 = -J2/sqrt(5) in normalized form.
 * Value: 1.082_63e-3 (dimensionless)
 */
export const J2 = 1.082_63e-3;

/**
 * Earth's equatorial radius.
 *
 * Source: WGS84 ellipsoid, semi-major axis
 * Exact WGS84 value: 6,378,137 m
 * Value used: 6.3781e6 m (rounded for typical LEO accuracy)
 */
export const R_EARTH = 6.3781e6;

/**
 * Earth's gravitational parameter (GM).
 *
 * Source: IERS Conventions (2010), Table 1.1
 * Value: 3.986_004_418e14 m^3/s^2
 * Accuracy: 9 significant figures
 */
export const MU_EARTH = 3.986_004_418e14;

/**
 * Number of seconds in a day.
 *
 * Definition: 24 hours * 60 minutes * 60 seconds = 86,400 s
 * Note: This is the SI day, not accounting for leap seconds.
 */
export const SECONDS_PER_DAY = 86_400;
