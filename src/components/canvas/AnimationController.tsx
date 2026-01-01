import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useMissionStore } from "@stores/mission";
import { useSimulationStore } from "@stores/simulation";

/**
 * Headless component that drives the simulation animation loop.
 * Uses useFrame to advance simulation time based on playback speed.
 * Must be rendered inside R3F Canvas.
 */
export default function AnimationController() {
  const scenario = useMissionStore((s) => s.scenario);
  const waypointsLength = useMissionStore((s) => s.waypoints.length);

  const playing = useSimulationStore((s) => s.playing);
  const tick = useSimulationStore((s) => s.tick);
  const reset = useSimulationStore((s) => s.reset);

  // Track previous values to detect changes
  const prevScenarioRef = useRef(scenario);
  const prevWaypointsLengthRef = useRef(waypointsLength);

  // Reset simulation when scenario changes or waypoints are cleared
  useEffect(() => {
    const scenarioChanged = prevScenarioRef.current !== scenario;
    const waypointsCleared =
      prevWaypointsLengthRef.current > 0 && waypointsLength === 0;

    if (scenarioChanged || waypointsCleared) {
      reset();
    }

    prevScenarioRef.current = scenario;
    prevWaypointsLengthRef.current = waypointsLength;
  }, [scenario, waypointsLength, reset]);

  useFrame((_, delta) => {
    if (!playing) return;

    const { trajectoryPoints, missionPlan } = useMissionStore.getState();
    if (!missionPlan) return;

    tick(delta, trajectoryPoints, missionPlan.totalTime);
  });

  // This is a headless component - no visual output
  return null;
}
