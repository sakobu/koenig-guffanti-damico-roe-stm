import { create } from "zustand";
import type {
  ClassicalOrbitalElements,
  DragConfig,
  MissionPlan,
  RelativeState,
  TrajectoryPoint,
  Vector3,
  Waypoint,
} from "@orbital";
import {
  generateMissionTrajectory,
  planMission,
  replanFromWaypoint,
  validateTargetingConfig,
} from "@orbital";
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
  /** For near-circular orbits (e < 0.05), eccentricity x-component derivative */
  dexDotDrag: number;
  /** For near-circular orbits (e < 0.05), eccentricity y-component derivative */
  deyDotDrag: number;

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
  updateWaypointVelocity: (index: number, velocity: Vector3 | undefined) => void;
  removeWaypoint: (index: number) => void;
  clearWaypoints: () => void;
  selectWaypoint: (index: number | null) => void;
  setIncludeJ2: (value: boolean) => void;
  setIncludeDrag: (value: boolean) => void;
  setDaDotDrag: (value: number) => void;
  setDexDotDrag: (value: number) => void;
  setDeyDotDrag: (value: number) => void;
  setScenario: (key: ScenarioKey) => void;
  setDraggingWaypoint: (value: boolean) => void;
}

type MissionStore = MissionState & MissionActions;

/** Eccentricity threshold for eccentric drag model (from Koenig et al. 2017) */
const ECCENTRICITY_THRESHOLD = 0.05;

// Recompute mission plan and trajectory
function computeMission(
  waypoints: Waypoint[],
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  includeJ2: boolean,
  includeDrag: boolean,
  daDotDrag: number,
  dexDotDrag: number,
  deyDotDrag: number,
  scenario: ScenarioKey
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
    // Auto-select drag model based on eccentricity
    const isNearCircular = chief.eccentricity < ECCENTRICITY_THRESHOLD;
    const dragConfig: DragConfig = isNearCircular
      ? { type: "arbitrary", daDotDrag, dexDotDrag, deyDotDrag }
      : { type: "eccentric", daDotDrag };

    const options = {
      includeJ2,
      includeDrag,
      dragConfig,
    };

    // Validate configuration before planning
    const validation = validateTargetingConfig(chief, options);
    if (!validation.valid) {
      console.warn("Targeting validation failed:", validation.message);
      if (validation.suggestion) {
        console.info("Suggestion:", validation.suggestion);
      }
      return { missionPlan: null, trajectoryPoints: [] };
    }

    const plan = planMission(initialState, waypoints, chief, options);

    const trajectory = generateMissionTrajectory(
      plan,
      chief,
      initialPosition,
      [0, 0, 0],
      options,
      SCENARIOS[scenario].trajectoryPointsPerLeg
    );

    return { missionPlan: plan, trajectoryPoints: trajectory };
  } catch (error) {
    console.error("Mission planning failed:", error);
    return { missionPlan: null, trajectoryPoints: [] };
  }
}

// Incremental replanning for waypoint updates - reuses unchanged legs
function computeMissionIncremental(
  existingPlan: MissionPlan | null,
  modifiedIndex: number,
  waypoints: Waypoint[],
  chief: ClassicalOrbitalElements,
  initialPosition: Vector3,
  includeJ2: boolean,
  includeDrag: boolean,
  daDotDrag: number,
  dexDotDrag: number,
  deyDotDrag: number,
  scenario: ScenarioKey
): {
  missionPlan: MissionPlan | null;
  trajectoryPoints: readonly TrajectoryPoint[];
} {
  // Fall back to full replan if no existing plan or modifying first waypoint
  if (!existingPlan || modifiedIndex === 0) {
    return computeMission(
      waypoints,
      chief,
      initialPosition,
      includeJ2,
      includeDrag,
      daDotDrag,
      dexDotDrag,
      deyDotDrag,
      scenario
    );
  }

  if (waypoints.length === 0) {
    return { missionPlan: null, trajectoryPoints: [] };
  }

  const initialState: RelativeState = {
    position: initialPosition,
    velocity: [0, 0, 0],
  };

  try {
    const isNearCircular = chief.eccentricity < ECCENTRICITY_THRESHOLD;
    const dragConfig: DragConfig = isNearCircular
      ? { type: "arbitrary", daDotDrag, dexDotDrag, deyDotDrag }
      : { type: "eccentric", daDotDrag };

    const options = {
      includeJ2,
      includeDrag,
      dragConfig,
    };

    const validation = validateTargetingConfig(chief, options);
    if (!validation.valid) {
      console.warn("Targeting validation failed:", validation.message);
      return { missionPlan: null, trajectoryPoints: [] };
    }

    // Use incremental replanning - reuses legs before modifiedIndex
    const plan = replanFromWaypoint(
      existingPlan,
      modifiedIndex,
      waypoints,
      chief,
      initialState,
      options
    );

    const trajectory = generateMissionTrajectory(
      plan,
      chief,
      initialPosition,
      [0, 0, 0],
      options,
      SCENARIOS[scenario].trajectoryPointsPerLeg
    );

    return { missionPlan: plan, trajectoryPoints: trajectory };
  } catch (error) {
    console.error("Incremental mission planning failed:", error);
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
  daDotDrag: SCENARIOS[DEFAULT_SCENARIO].defaultDaDotDrag,
  dexDotDrag: SCENARIOS[DEFAULT_SCENARIO].defaultDexDotDrag,
  deyDotDrag: SCENARIOS[DEFAULT_SCENARIO].defaultDeyDotDrag,
  scenario: DEFAULT_SCENARIO,
  selectedWaypointIndex: null,
  isDraggingWaypoint: false,

  // Actions
  addWaypoint: (position) => {
    const state = get();
    const newWaypoints = [...state.waypoints, { position }];
    const newIndex = newWaypoints.length - 1;
    const { missionPlan, trajectoryPoints } = computeMission(
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
    );
    // Auto-select the newly added waypoint
    set({
      waypoints: newWaypoints,
      missionPlan,
      trajectoryPoints,
      selectedWaypointIndex: newIndex,
    });
  },

  updateWaypoint: (index, position) => {
    const state = get();
    const newWaypoints = state.waypoints.map((wp, i) =>
      i === index ? { ...wp, position } : wp
    );
    // Use incremental replanning to reuse unchanged legs
    const { missionPlan, trajectoryPoints } = computeMissionIncremental(
      state.missionPlan,
      index,
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
    );
    set({ waypoints: newWaypoints, missionPlan, trajectoryPoints });
  },

  updateWaypointVelocity: (index, velocity) => {
    const state = get();
    const newWaypoints = state.waypoints.map((wp, i) =>
      i === index ? { ...wp, velocity } : wp
    );
    // Velocity change affects the leg, use full recompute
    const { missionPlan, trajectoryPoints } = computeMission(
      newWaypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
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
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
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
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
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
      state.daDotDrag,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
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
      value,
      state.dexDotDrag,
      state.deyDotDrag,
      state.scenario
    );
    set({ daDotDrag: value, missionPlan, trajectoryPoints });
  },

  setDexDotDrag: (value) => {
    const state = get();
    const { missionPlan, trajectoryPoints } = computeMission(
      state.waypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      state.daDotDrag,
      value,
      state.deyDotDrag,
      state.scenario
    );
    set({ dexDotDrag: value, missionPlan, trajectoryPoints });
  },

  setDeyDotDrag: (value) => {
    const state = get();
    const { missionPlan, trajectoryPoints } = computeMission(
      state.waypoints,
      state.chief,
      state.initialPosition,
      state.includeJ2,
      state.includeDrag,
      state.daDotDrag,
      state.dexDotDrag,
      value,
      state.scenario
    );
    set({ deyDotDrag: value, missionPlan, trajectoryPoints });
  },

  setScenario: (key) => {
    const scenario = SCENARIOS[key];
    // Clear waypoints and reset ALL physics settings when scenario changes
    set({
      scenario: key,
      chief: scenario.chief,
      initialPosition: scenario.initialPosition,
      // Reset physics toggles to defaults
      includeJ2: true,
      includeDrag: false,
      // Reset drag rates to scenario defaults
      daDotDrag: scenario.defaultDaDotDrag,
      dexDotDrag: scenario.defaultDexDotDrag,
      deyDotDrag: scenario.defaultDeyDotDrag,
      // Clear mission data
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
