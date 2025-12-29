import { create } from "zustand";
import type {
  ClassicalOrbitalElements,
  DragConfigAuto,
  MissionPlan,
  RelativeState,
  TrajectoryPoint,
  Vector3,
  Waypoint,
} from "@orbital";
import { generateMissionTrajectory, MU_EARTH, planMission } from "@orbital";

// ISS-like reference orbit
const DEFAULT_CHIEF: ClassicalOrbitalElements = {
  semiMajorAxis: 6_778_000, // ~400 km altitude
  eccentricity: 0.0005,
  inclination: (51.6 * Math.PI) / 180,
  raan: (45 * Math.PI) / 180,
  argumentOfPerigee: (30 * Math.PI) / 180,
  meanAnomaly: 0,
  angularMomentum: Math.sqrt(MU_EARTH * 6_778_000 * (1 - 0.0005 ** 2)),
  gravitationalParameter: MU_EARTH,
};

// Deputy starts 100m in I-track, 50m radial
const DEFAULT_INITIAL_POSITION: Vector3 = [200, -500, 0];

// Typical LEO differential drag rate
const DEFAULT_DRAG_CONFIG: DragConfigAuto = {
  type: "auto",
  daDotDrag: -1e-10,
};

interface MissionState {
  // Chief orbit
  chief: ClassicalOrbitalElements;

  // Deputy initial state
  initialPosition: Vector3;

  // Waypoints
  waypoints: Waypoint[];

  // Computed mission plan
  missionPlan: MissionPlan | null;

  // Computed trajectory points for visualization
  trajectoryPoints: readonly TrajectoryPoint[];

  // Physics settings
  includeJ2: boolean;
  includeDrag: boolean;

  // Selection
  selectedWaypointIndex: number | null;

  // UI state
  isDraggingWaypoint: boolean;
}

interface MissionActions {
  addWaypoint: (position: Vector3) => void;
  updateWaypoint: (index: number, position: Vector3) => void;
  removeWaypoint: (index: number) => void;
  clearWaypoints: () => void;
  selectWaypoint: (index: number | null) => void;
  setIncludeJ2: (value: boolean) => void;
  setIncludeDrag: (value: boolean) => void;
  setDraggingWaypoint: (value: boolean) => void;
}

type MissionStore = MissionState & MissionActions;

// Recompute mission plan and trajectory
function computeMission(
  waypoints: Waypoint[],
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  includeJ2: boolean,
  includeDrag: boolean
): {
  missionPlan: MissionPlan | null;
  trajectoryPoints: readonly TrajectoryPoint[];
} {
  if (waypoints.length === 0) {
    return { missionPlan: null, trajectoryPoints: [] };
  }

  const initialState: RelativeState = {
    position: initialPosition,
    velocity: [0, 0, 0],
  };

  try {
    const options = {
      includeJ2,
      includeDrag,
      dragConfig: DEFAULT_DRAG_CONFIG,
    };

    const plan = planMission(initialState, waypoints, chief, options);

    const trajectory = generateMissionTrajectory(
      plan,
      chief,
      initialPosition,
      [0, 0, 0],
      options,
      200 // points per leg
    );

    return { missionPlan: plan, trajectoryPoints: trajectory };
  } catch (error) {
    console.error("Mission planning failed:", error);
    return { missionPlan: null, trajectoryPoints: [] };
  }
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  // Initial state
  chief: DEFAULT_CHIEF,
  initialPosition: DEFAULT_INITIAL_POSITION,
  waypoints: [],
  missionPlan: null,
  trajectoryPoints: [],
  includeJ2: true,
  includeDrag: false,
  selectedWaypointIndex: null,
  isDraggingWaypoint: false,

  // Actions
  addWaypoint: (position) => {
    const state = get();
    const newWaypoints = [...state.waypoints, { position }];
    const { missionPlan, trajectoryPoints } = computeMission(
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag
    );
    set({ waypoints: newWaypoints, missionPlan, trajectoryPoints });
  },

  updateWaypoint: (index, position) => {
    const state = get();
    const newWaypoints = state.waypoints.map((wp, i) =>
      i === index ? { ...wp, position } : wp
    );
    const { missionPlan, trajectoryPoints } = computeMission(
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag
    );
    set({ waypoints: newWaypoints, missionPlan, trajectoryPoints });
  },

  removeWaypoint: (index) => {
    const state = get();
    const newWaypoints = state.waypoints.filter((_, i) => i !== index);
    const { missionPlan, trajectoryPoints } = computeMission(
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag
    );
    // Clear selection if deleted waypoint was selected, or adjust index if needed
    let newSelectedIndex = state.selectedWaypointIndex;
    if (newSelectedIndex !== null) {
      if (newSelectedIndex === index) {
        newSelectedIndex = null;
      } else if (newSelectedIndex > index) {
        newSelectedIndex--;
      }
    }
    set({
      waypoints: newWaypoints,
      missionPlan,
      trajectoryPoints,
      selectedWaypointIndex: newSelectedIndex,
    });
  },

  clearWaypoints: () => {
    set({
      waypoints: [],
      missionPlan: null,
      trajectoryPoints: [],
      selectedWaypointIndex: null,
    });
  },

  selectWaypoint: (index) => {
    set({ selectedWaypointIndex: index });
  },

  setIncludeJ2: (value) => {
    const state = get();
    const { missionPlan, trajectoryPoints } = computeMission(
      state.waypoints,
      state.chief,
      state.initialPosition,
      value,
      state.includeDrag
    );
    set({ includeJ2: value, missionPlan, trajectoryPoints });
  },

  setIncludeDrag: (value) => {
    const state = get();
    const { missionPlan, trajectoryPoints } = computeMission(
      state.waypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      value
    );
    set({ includeDrag: value, missionPlan, trajectoryPoints });
  },

  setDraggingWaypoint: (value) => {
    set({ isDraggingWaypoint: value });
  },
}));
