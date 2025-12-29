import type { ClassicalOrbitalElements, Vector3 } from "@orbital";
import { MU_EARTH } from "@orbital";

export type ScenarioKey = "iss" | "eccentric" | "lowAltEccentric";

export interface Scenario {
  label: string;
  description: string;
  chief: ClassicalOrbitalElements;
  initialPosition: Vector3;
  defaultDaDotDrag: number;
}

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  iss: {
    label: "ISS Circular",
    description: "a=6,778 km, e=0.0005",
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
  },
  eccentric: {
    label: "High-Alt Eccentric",
    description: "a=10,000 km, e=0.1",
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
  },
  lowAltEccentric: {
    label: "Low-Alt Eccentric",
    description: "a=7,500 km, e=0.1",
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
  },
};

export const SCENARIO_OPTIONS = Object.entries(SCENARIOS).map(
  ([key, scenario]) => ({
    value: key,
    label: scenario.label,
  })
);
