/**
 * Keplerian orbital mechanics utilities.
 *
 * Note: These helpers are not from Koenig et al; they are provided for convenience
 * when applying the STM over time by converting between anomalies and computing orbital periods.
 */

import type { TrueAnomaly } from "../types/orbital-elements";

/**
 * Solve Kepler's equation to obtain true anomaly from mean anomaly.
 * @param meanAnomaly - Mean anomaly M [rad]
 * @param eccentricity - Eccentricity e in [0, 1)
 * @param tolerance - Convergence tolerance on E (default 1e-10)
 * @returns True anomaly theta corresponding to M [rad]
 * @throws {Error} if eccentricity is not in [0, 1)
 */
export const trueAnomalyFromMean = (
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-10
): TrueAnomaly => {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error(
      `[kepler]: Eccentricity must be in [0, 1) for elliptical orbits (e=${eccentricity})`
    );
  }

  // First solve Kepler's equation for eccentric anomaly
  let E = meanAnomaly; // Initial guess

  for (let i = 0; i < 100; i++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const deltaE = f / fPrime;
    E -= deltaE;

    if (Math.abs(deltaE) < tolerance) break;
  }

  // Convert eccentric anomaly to true anomaly
  /*
   * Use atan2 to preserve quadrant information.
   * tan(theta/2) = sqrt((1+e)/(1-e)) * tan(E/2)
   * can be split into sin/cos components for atan2:
   * y = sqrt(1+e) * sin(E/2)
   * x = sqrt(1-e) * cos(E/2)
   */
  const theta =
    2 *
    Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(E / 2)
    );

  return theta;
};

/**
 * Compute the mean motion of the orbit.
 *
 * n = sqrt(mu / a^3)
 * @param semiMajorAxis - Semi-major axis a [m]
 * @param gravitationalParameter - Gravitational parameter mu [m^3/s^2]
 * @returns Mean motion n [rad/s]
 * @throws {Error} if semi-major axis or gravitational parameter is not positive
 */
export const meanMotion = (
  semiMajorAxis: number,
  gravitationalParameter: number
): number => {
  if (semiMajorAxis <= 0) {
    throw new Error(
      `[kepler]: Semi-major axis must be positive (a=${semiMajorAxis})`
    );
  }
  if (gravitationalParameter <= 0) {
    throw new Error(
      `[kepler]: Gravitational parameter must be positive (mu=${gravitationalParameter})`
    );
  }
  return Math.sqrt(gravitationalParameter / Math.pow(semiMajorAxis, 3));
};

/**
 * Compute the instantaneous orbital radius from true anomaly.
 *
 * r = a * (1 - e^2) / (1 + e * cos(nu))
 *
 * This is the conic section equation giving the distance from the focus
 * (central body) to the orbiting body as a function of true anomaly.
 * @param semiMajorAxis - Semi-major axis a [m]
 * @param eccentricity - Eccentricity e in [0, 1)
 * @param trueAnomaly - True anomaly nu [rad]
 * @returns Orbital radius r [m]
 * @throws {Error} if eccentricity is not in [0, 1)
 */
export const orbitalRadius = (
  semiMajorAxis: number,
  eccentricity: number,
  trueAnomaly: number
): number => {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error(
      `[kepler]: Eccentricity must be in [0, 1) for elliptical orbits (e=${eccentricity})`
    );
  }
  const eta2 = 1 - eccentricity * eccentricity;
  return (semiMajorAxis * eta2) / (1 + eccentricity * Math.cos(trueAnomaly));
};

/**
 * Compute the radial velocity component (dr/dt).
 *
 * dr/dt = (a * n * e * sin(nu)) / eta
 *
 * where eta = sqrt(1 - e^2) and n = sqrt(mu/a^3).
 *
 * For circular orbits (e = 0), this returns 0.
 * For eccentric orbits, this is positive approaching apoapsis
 * and negative approaching periapsis.
 * @param semiMajorAxis - Semi-major axis a [m]
 * @param eccentricity - Eccentricity e in [0, 1)
 * @param trueAnomaly - True anomaly nu [rad]
 * @param gravitationalParameter - Gravitational parameter mu [m^3/s^2]
 * @returns Radial velocity dr/dt [m/s]
 * @throws {Error} if eccentricity is not in [0, 1)
 */
export const radialVelocity = (
  semiMajorAxis: number,
  eccentricity: number,
  trueAnomaly: number,
  gravitationalParameter: number
): number => {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error(
      `[kepler]: Eccentricity must be in [0, 1) for elliptical orbits (e=${eccentricity})`
    );
  }
  const n = meanMotion(semiMajorAxis, gravitationalParameter);
  const eta = Math.sqrt(1 - eccentricity * eccentricity);
  return (semiMajorAxis * n * eccentricity * Math.sin(trueAnomaly)) / eta;
};

/**
 * Compute the angular velocity (d(theta)/dt = d(nu)/dt).
 *
 * d(theta)/dt = n * (1 + e * cos(nu))^2 / eta^3
 *
 * where eta = sqrt(1 - e^2) and n = sqrt(mu/a^3).
 *
 * This is the rate of change of true anomaly (and argument of latitude).
 * For circular orbits, this equals the mean motion n.
 * For eccentric orbits, it is faster near periapsis and slower near apoapsis.
 * @param semiMajorAxis - Semi-major axis a [m]
 * @param eccentricity - Eccentricity e in [0, 1)
 * @param trueAnomaly - True anomaly nu [rad]
 * @param gravitationalParameter - Gravitational parameter mu [m^3/s^2]
 * @returns Angular velocity d(theta)/dt [rad/s]
 * @throws {Error} if eccentricity is not in [0, 1)
 */
export const angularVelocity = (
  semiMajorAxis: number,
  eccentricity: number,
  trueAnomaly: number,
  gravitationalParameter: number
): number => {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new Error(
      `[kepler]: Eccentricity must be in [0, 1) for elliptical orbits (e=${eccentricity})`
    );
  }
  const n = meanMotion(semiMajorAxis, gravitationalParameter);
  const eta = Math.sqrt(1 - eccentricity * eccentricity);
  const factor = 1 + eccentricity * Math.cos(trueAnomaly);
  return (n * factor * factor) / (eta * eta * eta);
};

/**
 * Normalize an angle to the range [0, 2*PI).
 *
 * JavaScript's modulo operator returns negative values for negative inputs,
 * so this function properly normalizes angles to the standard range.
 * @param angle - Input angle [rad]
 * @returns Normalized angle in [0, 2*PI)
 */
export const normalizeAngle = (angle: number): number => {
  const TWO_PI = 2 * Math.PI;
  const result = angle % TWO_PI;
  return result < 0 ? result + TWO_PI : result;
};
