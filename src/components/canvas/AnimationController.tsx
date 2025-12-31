import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMissionStore } from "../../stores/mission";
import { useSimulationStore } from "../../stores/simulation";

/**
 * Headless component that drives the simulation animation loop.
 * Uses useFrame to advance simulation time based on playback speed.
 * Must be rendered inside R3F Canvas.
 */
export default function AnimationController() {
  const trajectoryPoints = useMissionStore((s) => s.trajectoryPoints);
  const missionPlan = useMissionStore((s) => s.missionPlan);
  const scenario = useMissionStore((s) => s.scenario);
  const waypoints = useMissionStore((s) => s.waypoints);

  const playing = useSimulationStore((s) => s.playing);
  const tick = useSimulationStore((s) => s.tick);
  const reset = useSimulationStore((s) => s.reset);

  // Track previous values to detect changes
  const prevScenarioRef = useRef(scenario);
  const prevWaypointsLengthRef = useRef(waypoints.length);

  // Reset simulation when scenario changes or waypoints are cleared
  useEffect(() => {
    const scenarioChanged = prevScenarioRef.current !== scenario;
    const waypointsCleared =
      prevWaypointsLengthRef.current > 0 && waypoints.length === 0;

    if (scenarioChanged || waypointsCleared) {
      reset();
    }

    prevScenarioRef.current = scenario;
    prevWaypointsLengthRef.current = waypoints.length;
  }, [scenario, waypoints.length, reset]);

  useFrame((_, delta) => {
    // Only tick when playing and we have a mission
    if (!playing || !missionPlan) return;

    // delta is in seconds from R3F
    tick(delta, trajectoryPoints, missionPlan.totalTime);
  });

  // This is a headless component - no visual output
  return null;
}
