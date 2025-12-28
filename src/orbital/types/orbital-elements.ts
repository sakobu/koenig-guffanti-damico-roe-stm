/**
 * Orbital element type definitions.
 *
 * References:
 * - Koenig, Guffanti, D'Amico (2017) "New State Transition Matrices..."
 * - D'Amico (2010) PhD Thesis, TU Delft
 */

/** True anomaly (theta) in radians [0, 2pi) */
export type TrueAnomaly = number;

/**
 * Full set of orbital elements for a spacecraft.
 */
export type ClassicalOrbitalElements = {
  /** Eccentricity e (0 <= e < 1) */
  readonly eccentricity: number;
  /** Specific angular momentum h [m^2/s] */
  readonly angularMomentum: number;
  /** Gravitational parameter mu [m^3/s^2] */
  readonly gravitationalParameter: number;
  /** Semi-major axis a [m] */
  readonly semiMajorAxis: number;
  /** Inclination i [rad] */
  readonly inclination: number;
  /** Right Ascension of Ascending Node [rad] */
  readonly raan: number;
  /** Argument of Perigee [rad] */
  readonly argumentOfPerigee: number;
  /** Mean Anomaly M [rad] */
  readonly meanAnomaly: number;
};

/**
 * Quasi-Nonsingular Relative Orbital Elements.
 *
 * Defined as dimensionless differences of orbital elements.
 * Valid for near-circular orbits. Note that this parameterization becomes
 * singular for equatorial deputy orbits (i_d = 0 or 180 deg).
 *
 * Reference: Koenig et al. (2017), Equation 2
 */
export type QuasiNonsingularROE = {
  /**
   * Relative semi-major axis: delta a = (a_d - a_c) / a_c
   * (Dimensionless)
   */
  readonly da: number;

  /**
   * Relative mean longitude: delta lambda = (M_d + omega_d) - (M_c + omega_c) + (Omega_d - Omega_c)cos(i_c)
   * (Dimensionless / Radians)
   */
  readonly dlambda: number;

  /**
   * Relative eccentricity vector x: delta e_x = e_d cos(omega_d) - e_c cos(omega_c)
   * (Dimensionless)
   */
  readonly dex: number;

  /**
   * Relative eccentricity vector y: delta e_y = e_d sin(omega_d) - e_c sin(omega_c)
   * (Dimensionless)
   */
  readonly dey: number;

  /**
   * Relative inclination vector x: delta i_x = i_d - i_c
   * (Dimensionless / Radians)
   */
  readonly dix: number;

  /**
   * Relative inclination vector y: delta i_y = (Omega_d - Omega_c) sin(i_c)
   * (Dimensionless / Radians)
   */
  readonly diy: number;
};

/**
 * Orbital factors from Koenig et al. (2017), Equations 14-16.
 * Used in J2 and drag STM computations.
 *
 * These factors are derived from the chief orbit's eccentricity and inclination.
 */
export type OrbitalFactors = {
  /** sqrt(1 - e^2) - eccentricity factor */
  readonly eta: number;
  /** 3*cos^2(i) - 1 */
  readonly P: number;
  /** 5*cos^2(i) - 1 */
  readonly Q: number;
  /** cos(i) - used in singular state computations */
  readonly R: number;
  /** sin(2i) = 2*sin(i)*cos(i) */
  readonly S: number;
  /** sin^2(i) */
  readonly T: number;
  /** 1 + eta */
  readonly E: number;
  /** 4 + 3*eta */
  readonly F: number;
  /** 1/eta^2 */
  readonly G: number;
};

/**
 * Apsidal precession state for J2 STM computation.
 *
 * Contains initial and final eccentricity vector components
 * and rotation terms accounting for argument of perigee drift.
 */
export type ApsidalState = {
  /** Argument of perigee drift rate [rad/s] */
  readonly omegaDot: number;
  /** Final argument of perigee [rad] */
  readonly omega_f: number;
  /** Initial chief eccentricity vector x-component */
  readonly ex_i: number;
  /** Initial chief eccentricity vector y-component */
  readonly ey_i: number;
  /** Final chief eccentricity vector x-component */
  readonly ex_f: number;
  /** Final chief eccentricity vector y-component */
  readonly ey_f: number;
  /** cos(omegaDot * tau) - rotation term */
  readonly cos_wt: number;
  /** sin(omegaDot * tau) - rotation term */
  readonly sin_wt: number;
};
