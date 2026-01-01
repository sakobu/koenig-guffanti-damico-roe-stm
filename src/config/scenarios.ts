import type { ClassicalOrbitalElements, Vector3 } from '@orbital';
import { MU_EARTH } from '@orbital';

export type ScenarioKey =
  | 'iss'
  | 'eccentric'
  | 'lowAltEccentric'
  | 'longDurationHold'
  | 'largeFormation';

export interface Scenario {
  label: string;
  chief: ClassicalOrbitalElements;
  initialPosition: Vector3;
  defaultDaDotDrag: number;
  /** For near-circular orbits (e < 0.05), dex derivative is required */
  defaultDexDotDrag: number;
  /** For near-circular orbits (e < 0.05), dey derivative is required */
  defaultDeyDotDrag: number;

  // Visualization scale parameters
  /** Total grid extent in meters (e.g., 2000 for ±1000m view) */
  gridSize: number;
  /** Small grid cell size in meters */
  gridCellSize: number;
  /** Major grid line interval in meters */
  gridSectionSize: number;
  /** Initial camera Z distance in meters */
  cameraDistance: number;
  /** Maximum zoom out distance for OrbitControls */
  maxZoomOut: number;
  /** Number of trajectory points per leg for visualization smoothness */
  trajectoryPointsPerLeg: number;
}

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  iss: {
    label: 'ISS Circular',
    chief: {
      semiMajorAxis: 6_778_000,
      eccentricity: 0.0005,
      inclination: (51.6 * Math.PI) / 180,
      raan: (45 * Math.PI) / 180,
      argumentOfPerigee: (30 * Math.PI) / 180,
      meanAnomaly: 0,
      angularMomentum: Math.sqrt(MU_EARTH * 6_778_000 * (1 - 0.0005 ** 2)),
      gravitationalParameter: MU_EARTH,
    },
    initialPosition: [50, -300, 20], // 300m behind, 50m radial, 20m cross-track
    defaultDaDotDrag: -1e-10, // ~400 km altitude - moderate drag
    defaultDexDotDrag: 0, // Near-circular: arbitrary model uses these
    defaultDeyDotDrag: 0,
    // Visualization (standard scale)
    gridSize: 2000,
    gridCellSize: 50,
    gridSectionSize: 250,
    cameraDistance: 1500,
    maxZoomOut: 5000,
    trajectoryPointsPerLeg: 500,
  },
  eccentric: {
    label: 'High-Alt Eccentric',
    chief: {
      semiMajorAxis: 10_000_000,
      eccentricity: 0.1,
      inclination: (63.4 * Math.PI) / 180, // Critical inclination
      raan: (45 * Math.PI) / 180,
      argumentOfPerigee: (270 * Math.PI) / 180,
      meanAnomaly: 0,
      angularMomentum: Math.sqrt(MU_EARTH * 10_000_000 * (1 - 0.1 ** 2)),
      gravitationalParameter: MU_EARTH,
    },
    initialPosition: [100, -600, 0], // 600m behind, 100m radial offset
    defaultDaDotDrag: -1e-12, // 3600+ km altitude - drag negligible
    defaultDexDotDrag: 0, // Eccentric: not used (eccentric model)
    defaultDeyDotDrag: 0,
    // Visualization (standard scale)
    gridSize: 2000,
    gridCellSize: 50,
    gridSectionSize: 250,
    cameraDistance: 1500,
    maxZoomOut: 5000,
    trajectoryPointsPerLeg: 500,
  },
  lowAltEccentric: {
    label: 'Low-Alt Eccentric',
    chief: {
      semiMajorAxis: 7_500_000,
      eccentricity: 0.1,
      inclination: (51.6 * Math.PI) / 180,
      raan: (45 * Math.PI) / 180,
      argumentOfPerigee: (30 * Math.PI) / 180,
      meanAnomaly: 0,
      angularMomentum: Math.sqrt(MU_EARTH * 7_500_000 * (1 - 0.1 ** 2)),
      gravitationalParameter: MU_EARTH,
    },
    initialPosition: [80, -500, 30], // 500m behind, 80m radial, 30m cross-track
    defaultDaDotDrag: -5e-10, // 372-1872 km perigee/apogee - strong drag at perigee
    defaultDexDotDrag: 0, // Eccentric: not used (eccentric model)
    defaultDeyDotDrag: 0,
    // Visualization (standard scale)
    gridSize: 2000,
    gridCellSize: 50,
    gridSectionSize: 250,
    cameraDistance: 1500,
    maxZoomOut: 5000,
    trajectoryPointsPerLeg: 500,
  },
  longDurationHold: {
    label: 'Long-Duration Hold',
    chief: {
      semiMajorAxis: 7_000_000, // ~622 km altitude
      eccentricity: 0.001, // Near-circular
      inclination: (51.6 * Math.PI) / 180, // ISS-like, safe from singularity
      raan: (45 * Math.PI) / 180,
      argumentOfPerigee: (30 * Math.PI) / 180,
      meanAnomaly: 0,
      angularMomentum: Math.sqrt(MU_EARTH * 7_000_000 * (1 - 0.001 ** 2)),
      gravitationalParameter: MU_EARTH,
    },
    initialPosition: [0, -500, 0], // 500m behind (hold position)
    defaultDaDotDrag: -2e-10, // ~622 km altitude - moderate drag
    defaultDexDotDrag: 0,
    defaultDeyDotDrag: 0,
    // Visualization (standard scale)
    gridSize: 2000,
    gridCellSize: 50,
    gridSectionSize: 250,
    cameraDistance: 1500,
    maxZoomOut: 5000,
    trajectoryPointsPerLeg: 500,
  },
  largeFormation: {
    label: 'Large Formation (10km)',
    chief: {
      semiMajorAxis: 7_200_000, // ~822 km altitude
      eccentricity: 0.0005, // Near-circular
      inclination: (45 * Math.PI) / 180, // Mid-inclination, safe
      raan: (45 * Math.PI) / 180,
      argumentOfPerigee: (30 * Math.PI) / 180,
      meanAnomaly: 0,
      angularMomentum: Math.sqrt(MU_EARTH * 7_200_000 * (1 - 0.0005 ** 2)),
      gravitationalParameter: MU_EARTH,
    },
    initialPosition: [0, -5000, 0], // 5km behind
    defaultDaDotDrag: -1e-10, // ~822 km altitude
    defaultDexDotDrag: 0,
    defaultDeyDotDrag: 0,
    // Visualization (large scale for km-scale formation)
    // Note: spacecraft/waypoints auto-scale via zoom-responsive scaling based on cameraDistance
    gridSize: 20000, // +/-10km
    gridCellSize: 500, // 500m cells
    gridSectionSize: 2500, // 2.5km major lines
    cameraDistance: 15000,
    maxZoomOut: 50000, // Allow 50km zoom
    trajectoryPointsPerLeg: 5000, // More points for smoother km-scale trajectories
  },
};

export const SCENARIO_OPTIONS = Object.entries(SCENARIOS).map(
  ([key, scenario]) => ({
    value: key,
    label: scenario.label,
  })
);
