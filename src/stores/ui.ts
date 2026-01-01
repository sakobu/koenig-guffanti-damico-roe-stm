import { create } from "zustand";

export type SidebarTab = "help" | "config";

interface UIState {
  sidebarOpen: boolean;
  hudVisible: boolean;
  activeTab: SidebarTab;
}

interface UIActions {
  toggleSidebar: () => void;
  toggleHUD: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHudVisible: (visible: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarOpen: true,
  hudVisible: true,
  activeTab: "config",

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleHUD: () => set((state) => ({ hudVisible: !state.hudVisible })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
