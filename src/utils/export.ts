/**
 * Export Utilities
 *
 * Functions for exporting mission data to JSON and CSV formats.
 * Uses generateTrajectoryWithManeuvers for complete burn timing data.
 */

import {
  generateTrajectoryWithManeuvers,
  type ClassicalOrbitalElements,
  type MissionPlan,
  type TargetingOptions,
  type TrajectoryPoint,
  type Vector3,
  type Waypoint,
} from "@orbital";

/**
 * Enhanced leg data with burn timing for JSON export
 */
interface ExportLegData {
  from: Vector3;
  to: Vector3;
  targetVelocity: Vector3;
  tof: number;
  burn1: {
    deltaV: Vector3;
    magnitude: number;
  };
  burn1Time: number;
  burn1Position: Vector3;
  burn2: {
    deltaV: Vector3;
    magnitude: number;
  };
  burn2Time: number;
  burn2Position: Vector3;
  totalDeltaV: number;
  converged: boolean;
  iterations: number;
  positionError: number;
}

/**
 * Waypoint with guaranteed velocity (normalized for export)
 */
interface ExportWaypoint {
  position: Vector3;
  velocity: Vector3; // Always present (defaults to [0,0,0] for stationary)
}

/**
 * Mission data structure for JSON export
 */
export interface ExportMissionData {
  metadata: {
    exportedAt: string;
    scenario: string;
  };
  chief: ClassicalOrbitalElements;
  waypoints: ExportWaypoint[];
  mission: {
    totalDeltaV: number;
    totalTime: number;
    converged: boolean;
    legs: ExportLegData[];
  };
}

/**
 * Trigger a browser file download
 */
function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a timestamp-based filename
 */
function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export complete mission data to JSON file
 *
 * Includes metadata, chief orbit, waypoints, and full mission plan with all legs.
 * Enhanced with burn timing data from generateTrajectoryWithManeuvers.
 */
export function exportMissionJSON(
  missionPlan: MissionPlan,
  waypoints: Waypoint[],
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  scenario: string,
  options?: TargetingOptions
): void {
  // Get burn timing data
  const { departureBurns, arrivalBurns } = generateTrajectoryWithManeuvers(
    missionPlan,
    chief,
    initialPosition,
    [0, 0, 0], // initial velocity (stationary start)
    options
  );

  // Enhance legs with burn timing
  const enhancedLegs: ExportLegData[] = missionPlan.legs.map((leg, i) => ({
    from: leg.from,
    to: leg.to,
    targetVelocity: leg.targetVelocity,
    tof: leg.tof,
    burn1: {
      deltaV: leg.burn1.deltaV,
      magnitude: leg.burn1.magnitude,
    },
    burn1Time: departureBurns[i]?.time ?? 0,
    burn1Position: departureBurns[i]?.position ?? leg.from,
    burn2: {
      deltaV: leg.burn2.deltaV,
      magnitude: leg.burn2.magnitude,
    },
    burn2Time: arrivalBurns[i]?.time ?? leg.tof,
    burn2Position: arrivalBurns[i]?.position ?? leg.to,
    totalDeltaV: leg.totalDeltaV,
    converged: leg.converged,
    iterations: leg.iterations,
    positionError: leg.positionError,
  }));

  const data: ExportMissionData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      scenario,
    },
    chief,
    // Normalize velocity to [0,0,0] for stationary waypoints (consistent structure)
    waypoints: waypoints.map((wp) => ({
      position: wp.position,
      velocity: wp.velocity ?? [0, 0, 0],
    })),
    mission: {
      totalDeltaV: missionPlan.totalDeltaV,
      totalTime: missionPlan.totalTime,
      converged: missionPlan.converged,
      legs: enhancedLegs,
    },
  };

  const json = JSON.stringify(data, null, 2);
  const filename = generateFilename("mission", "json");
  downloadFile(json, filename, "application/json");
}

/**
 * Export trajectory and maneuvers to CSV file
 *
 * Enhanced columns: time_s, event_type, position, velocity, deltaV
 * - event_type: "coast" for trajectory points, "departure"/"arrival" for burns
 * - deltaV columns populated only for burn events
 * - Rows sorted by time with burns interleaved at correct positions
 */
export function exportTrajectoryCSV(
  trajectoryPoints: TrajectoryPoint[],
  missionPlan: MissionPlan,
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  options?: TargetingOptions
): void {
  // Get burn timing data
  const { departureBurns, arrivalBurns } = generateTrajectoryWithManeuvers(
    missionPlan,
    chief,
    initialPosition,
    [0, 0, 0],
    options
  );

  const headers = [
    "time_s",
    "event_type",
    "position_r_m",
    "position_i_m",
    "position_c_m",
    "velocity_r_ms",
    "velocity_i_ms",
    "velocity_c_ms",
    "deltaV_r_ms",
    "deltaV_i_ms",
    "deltaV_c_ms",
  ];

  // Build all rows with event type
  type CsvRow = {
    time: number;
    eventType: string;
    position: Vector3;
    velocity: Vector3;
    deltaV: Vector3 | null;
  };

  const allRows: CsvRow[] = [];

  // Add trajectory points as coast events
  for (const point of trajectoryPoints) {
    allRows.push({
      time: point.time,
      eventType: "coast",
      position: point.position,
      velocity: point.velocity,
      deltaV: null,
    });
  }

  // Add departure burns
  for (let i = 0; i < departureBurns.length; i++) {
    const burn = departureBurns[i];
    const leg = missionPlan.legs[i];
    allRows.push({
      time: burn.time,
      eventType: "departure",
      position: burn.position,
      velocity: [0, 0, 0], // Pre-burn velocity not tracked, use zeros
      deltaV: leg.burn1.deltaV,
    });
  }

  // Add arrival burns
  for (let i = 0; i < arrivalBurns.length; i++) {
    const burn = arrivalBurns[i];
    const leg = missionPlan.legs[i];
    allRows.push({
      time: burn.time,
      eventType: "arrival",
      position: burn.position,
      velocity: leg.targetVelocity,
      deltaV: leg.burn2.deltaV,
    });
  }

  // Sort by time
  allRows.sort((a, b) => a.time - b.time);

  // Format rows
  const csvRows = allRows.map((row) => [
    row.time.toFixed(3),
    row.eventType,
    row.position[0].toFixed(6),
    row.position[1].toFixed(6),
    row.position[2].toFixed(6),
    row.velocity[0].toFixed(6),
    row.velocity[1].toFixed(6),
    row.velocity[2].toFixed(6),
    row.deltaV ? row.deltaV[0].toFixed(6) : "",
    row.deltaV ? row.deltaV[1].toFixed(6) : "",
    row.deltaV ? row.deltaV[2].toFixed(6) : "",
  ]);

  const csv = [headers.join(","), ...csvRows.map((row) => row.join(","))].join(
    "\n"
  );

  const filename = generateFilename("trajectory", "csv");
  downloadFile(csv, filename, "text/csv");
}
