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
import { generateMissionTrajectory, planMission } from "@orbital";
import { SCENARIOS, type ScenarioKey } from "../config/scenarios";

// Default scenario
const DEFAULT_SCENARIO: ScenarioKey = "iss";

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
  daDotDrag: number;

  // Scenario
  scenario: ScenarioKey;

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
  setDaDotDrag: (value: number) => void;
  setScenario: (key: ScenarioKey) => void;
  setDraggingWaypoint: (value: boolean) => void;
}

type MissionStore = MissionState & MissionActions;

// Recompute mission plan and trajectory
function computeMission(
  waypoints: Waypoint[],
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  includeJ2: boolean,
  includeDrag: boolean,
  daDotDrag: number
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
    const dragConfig: DragConfigAuto = {
      type: "auto",
      daDotDrag,
    };
    const options = {
      includeJ2,
      includeDrag,
      dragConfig,
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
  chief: SCENARIOS[DEFAULT_SCENARIO].chief,
  initialPosition: SCENARIOS[DEFAULT_SCENARIO].initialPosition,
  waypoints: [],
  missionPlan: null,
  trajectoryPoints: [],
  includeJ2: true,
  includeDrag: false,
  daDotDrag: -1e-10,
  scenario: DEFAULT_SCENARIO,
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
      state.includeDrag,
      state.daDotDrag
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
      state.includeDrag,
      state.daDotDrag
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
      state.includeDrag,
      state.daDotDrag
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
      state.includeDrag,
      state.daDotDrag
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
      value,
      state.daDotDrag
    );
    set({ includeDrag: value, missionPlan, trajectoryPoints });
  },

  setDaDotDrag: (value) => {
    const state = get();
    const { missionPlan, trajectoryPoints } = computeMission(
      state.waypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      value
    );
    set({ daDotDrag: value, missionPlan, trajectoryPoints });
  },

  setScenario: (key) => {
    const scenario = SCENARIOS[key];
    // Clear waypoints when scenario changes
    set({
      scenario: key,
      chief: scenario.chief,
      initialPosition: scenario.initialPosition,
      waypoints: [],
      missionPlan: null,
      trajectoryPoints: [],
      selectedWaypointIndex: null,
    });
  },

  setDraggingWaypoint: (value) => {
    set({ isDraggingWaypoint: value });
  },
}));
