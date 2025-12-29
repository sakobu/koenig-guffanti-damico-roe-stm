import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  hudVisible: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  toggleHUD: () => void;
  setSidebarOpen: (open: boolean) => void;
  setHudVisible: (visible: boolean) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarOpen: true,
  hudVisible: true,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleHUD: () => set((state) => ({ hudVisible: !state.hudVisible })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHudVisible: (visible) => set({ hudVisible: visible }),
}));
