import { create } from "zustand";
import type { TrajectoryPoint } from "@orbital";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format time as HH:MM:SS
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Binary search for the trajectory point closest to the given time.
 * Returns the index of the point with time <= target time.
 */
export function findNearestPointIndex(
  points: readonly TrajectoryPoint[],
  time: number
): number {
  if (points.length === 0) return -1;
  if (time <= points[0].time) return 0;
  if (time >= points[points.length - 1].time) return points.length - 1;

  let lo = 0;
  let hi = points.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (points[mid].time <= time) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

// ============================================================================
// Store Types
// ============================================================================

interface SimulationState {
  /** Current simulation time in seconds from mission start */
  time: number;
  /** Whether simulation is playing */
  playing: boolean;
  /** Playback speed multiplier (1, 2, 5, 10) */
  speed: number;
  /** Current index into trajectory points array */
  currentPointIndex: number;
}

interface SimulationActions {
  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Reset to beginning */
  reset: () => void;
  /** Set playback speed */
  setSpeed: (speed: number) => void;
  /** Set time directly (for scrubbing) */
  setTime: (time: number, trajectoryPoints: readonly TrajectoryPoint[]) => void;
  /** Advance time by delta (called from animation loop) */
  tick: (
    dt: number,
    trajectoryPoints: readonly TrajectoryPoint[],
    totalTime: number
  ) => void;
}

type SimulationStore = SimulationState & SimulationActions;

// ============================================================================
// Store
// ============================================================================

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  time: 0,
  playing: false,
  speed: 1,
  currentPointIndex: 0,

  // Actions
  play: () => set({ playing: true }),

  pause: () => set({ playing: false }),

  reset: () =>
    set({
      time: 0,
      playing: false,
      currentPointIndex: 0,
    }),

  setSpeed: (speed) => set({ speed }),

  setTime: (time, trajectoryPoints) => {
    const clampedTime = Math.max(0, time);
    const currentPointIndex = findNearestPointIndex(trajectoryPoints, clampedTime);
    set({ time: clampedTime, currentPointIndex });
  },

  tick: (dt, trajectoryPoints, totalTime) => {
    const state = get();
    if (!state.playing) return;

    const newTime = state.time + dt * state.speed;

    // Auto-pause at end
    if (newTime >= totalTime) {
      set({
        time: totalTime,
        playing: false,
        currentPointIndex: trajectoryPoints.length - 1,
      });
      return;
    }

    const currentPointIndex = findNearestPointIndex(trajectoryPoints, newTime);
    set({ time: newTime, currentPointIndex });
  },
}));
