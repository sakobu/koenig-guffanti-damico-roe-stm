import { useState, useMemo, useEffect } from "react";
import { Play, Pause, RotateCcw, Minus, GripHorizontal } from "lucide-react";
import { useMissionStore } from "../../stores/mission";
import { useSimulationStore, formatTime } from "../../stores/simulation";
import { useUIStore } from "../../stores/ui";
import { ricToROE } from "@orbital";
import type { QuasiNonsingularROE, RelativeState, Vector3 } from "@orbital";
import Button from "../shared/Button";
import Select from "../shared/Select";
import Slider from "../shared/Slider";

type CoordinateMode = "ric" | "roe";

const SPEED_OPTIONS = [
  { value: "1", label: "1x" },
  { value: "50", label: "50x" },
  { value: "100", label: "100x" },
  { value: "500", label: "500x" },
];

const COORD_OPTIONS = [
  { value: "ric", label: "RIC" },
  { value: "roe", label: "ROE" },
];

/**
 * Format a number with sign and fixed decimals
 */
function formatValue(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Compute distance from origin (Chief is at origin)
 */
function computeDistance(position: Vector3): number {
  return Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
}

/**
 * Compute cumulative arc length along the trajectory up to a given index.
 */
function computeDistanceTraveled(
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

export default function HUD() {
  const hudVisible = useUIStore((s) => s.hudVisible);
  const toggleHUD = useUIStore((s) => s.toggleHUD);

  // Keyboard shortcut: H to toggle HUD visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === "h") {
        toggleHUD();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleHUD]);

  // Mission state
  const chief = useMissionStore((s) => s.chief);
  const initialPosition = useMissionStore((s) => s.initialPosition);
  const trajectoryPoints = useMissionStore((s) => s.trajectoryPoints);
  const missionPlan = useMissionStore((s) => s.missionPlan);

  // Simulation state
  const time = useSimulationStore((s) => s.time);
  const playing = useSimulationStore((s) => s.playing);
  const speed = useSimulationStore((s) => s.speed);
  const currentPointIndex = useSimulationStore((s) => s.currentPointIndex);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setTime = useSimulationStore((s) => s.setTime);

  // Local UI state
  const [coordMode, setCoordMode] = useState<CoordinateMode>("ric");
  const [minimized, setMinimized] = useState(false);

  // Current position/velocity from trajectory or initial
  const isSimulating = time > 0 || playing;
  const hasTrajectory = trajectoryPoints.length > 0;
  const validIndex =
    currentPointIndex >= 0 && currentPointIndex < trajectoryPoints.length;

  const currentPosition = useMemo(() => {
    return isSimulating && hasTrajectory && validIndex
      ? trajectoryPoints[currentPointIndex].position
      : initialPosition;
  }, [
    isSimulating,
    hasTrajectory,
    validIndex,
    trajectoryPoints,
    currentPointIndex,
    initialPosition,
  ]);

  const currentVelocity = useMemo<Vector3>(() => {
    return isSimulating && hasTrajectory && validIndex
      ? trajectoryPoints[currentPointIndex].velocity
      : [0, 0, 0];
  }, [isSimulating, hasTrajectory, validIndex, trajectoryPoints, currentPointIndex]);

  // ROE conversion (memoized to avoid recalculating every render)
  const roe = useMemo<QuasiNonsingularROE | null>(() => {
    if (coordMode !== "roe") return null;
    try {
      const state: RelativeState = {
        position: [...currentPosition] as Vector3,
        velocity: [...currentVelocity] as Vector3,
      };
      return ricToROE(chief, state);
    } catch {
      return null;
    }
  }, [coordMode, currentPosition, currentVelocity, chief]);

  const totalTime = missionPlan?.totalTime ?? 0;
  const distance = computeDistance(currentPosition);

  // Cumulative arc length along trajectory
  const distanceTraveled = useMemo(() => {
    if (!isSimulating || !hasTrajectory) return 0;
    return computeDistanceTraveled(trajectoryPoints, currentPointIndex);
  }, [isSimulating, hasTrajectory, trajectoryPoints, currentPointIndex]);

  // Hide when not visible
  if (!hudVisible) return null;

  // Handle scrubbing
  const handleScrub = (newTime: number) => {
    setTime(newTime, trajectoryPoints);
  };

  return (
    <div className="fixed top-4 right-4 w-72 z-50">
      <div className="bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-zinc-500" />
            <span className="text-sm font-medium text-zinc-200">
              Mission Control
            </span>
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
            title={minimized ? "Expand" : "Minimize"}
          >
            <Minus size={14} className="text-zinc-400" />
          </button>
        </div>

        {/* Content - collapsible */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-in-out
            ${minimized ? "max-h-0" : "max-h-125"}`}
        >
          <div className="p-3 space-y-2">
            {/* Playback Controls */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Reset */}
                <Button size="icon" onClick={reset} title="Reset">
                  <RotateCcw size={14} className="text-zinc-300" />
                </Button>

                {/* Play/Pause */}
                <Button
                  variant="primary"
                  size="icon"
                  onClick={playing ? pause : play}
                  disabled={!missionPlan || trajectoryPoints.length === 0}
                  title={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause size={14} className="text-white" />
                  ) : (
                    <Play size={14} className="text-white" />
                  )}
                </Button>

                {/* Speed Selector */}
                <div className="flex-1">
                  <Select
                    variant="compact"
                    value={speed.toString()}
                    onChange={(v) => setSpeed(parseInt(v))}
                    options={SPEED_OPTIONS}
                    prefix="Speed:"
                  />
                </div>
              </div>

              {/* Progress Slider */}
              <Slider
                value={time}
                onChange={handleScrub}
                min={0}
                max={totalTime || 1}
                step={1}
                disabled={totalTime === 0}
              />
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>{formatTime(time)}</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-700" />

            {/* Position Display */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">RIC/ROE</span>
                <Select
                  variant="compact"
                  size="sm"
                  value={coordMode}
                  onChange={(v) => setCoordMode(v as CoordinateMode)}
                  options={COORD_OPTIONS}
                />
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Position
              </span>

              {coordMode === "ric" ? (
                <>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="bg-zinc-800/50 rounded px-2 py-1">
                      <span className="text-zinc-500">R</span>
                      <span className="ml-1 font-mono text-zinc-200">
                        {formatValue(currentPosition[0])}
                      </span>
                    </div>
                    <div className="bg-zinc-800/50 rounded px-2 py-1">
                      <span className="text-zinc-500">I</span>
                      <span className="ml-1 font-mono text-zinc-200">
                        {formatValue(currentPosition[1])}
                      </span>
                    </div>
                    <div className="bg-zinc-800/50 rounded px-2 py-1">
                      <span className="text-zinc-500">C</span>
                      <span className="ml-1 font-mono text-zinc-200">
                        {formatValue(currentPosition[2])}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-600 text-right">m</div>
                </>
              ) : roe ? (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δa</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.da, 4)}
                    </span>
                  </div>
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δλ</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.dlambda, 4)}
                    </span>
                  </div>
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δex</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.dex, 6)}
                    </span>
                  </div>
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δey</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.dey, 6)}
                    </span>
                  </div>
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δix</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.dix, 6)}
                    </span>
                  </div>
                  <div className="bg-zinc-800/50 rounded px-2 py-1">
                    <span className="text-zinc-500">δiy</span>
                    <span className="ml-1 font-mono text-zinc-200">
                      {formatValue(roe.diy, 6)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">
                  ROE conversion unavailable
                </div>
              )}
            </div>

            {/* Velocity Display */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Velocity
              </span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-zinc-800/50 rounded px-2 py-1">
                  <span className="text-zinc-500">Ṙ</span>
                  <span className="ml-1 font-mono text-zinc-200">
                    {formatValue(currentVelocity[0], 4)}
                  </span>
                </div>
                <div className="bg-zinc-800/50 rounded px-2 py-1">
                  <span className="text-zinc-500">İ</span>
                  <span className="ml-1 font-mono text-zinc-200">
                    {formatValue(currentVelocity[1], 4)}
                  </span>
                </div>
                <div className="bg-zinc-800/50 rounded px-2 py-1">
                  <span className="text-zinc-500">Ċ</span>
                  <span className="ml-1 font-mono text-zinc-200">
                    {formatValue(currentVelocity[2], 4)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-600 text-right">m/s</div>
            </div>

            {/* Distance */}
            <div className="space-y-1 border-t border-zinc-700 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Range:</span>
                <span className="font-mono text-cyan-400">
                  {distance.toFixed(2)} m
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Traveled:</span>
                <span className="font-mono text-cyan-400">
                  {distanceTraveled.toFixed(2)} m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
