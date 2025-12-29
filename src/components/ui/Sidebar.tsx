import { useUIStore } from "../../stores/ui";
import WaypointPanel from "./WaypointPanel";
import MissionSummaryPanel from "./MissionSummaryPanel";

export default function Sidebar() {
  const isOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-70 bg-zinc-900/90
          z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-sm font-semibold text-zinc-100 tracking-wide">
            Koenig & D'Amico RPO Simulator
          </h1>
        </div>

        {/* Content area */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
          <WaypointPanel />
          <MissionSummaryPanel />
        </div>
      </div>

      {/* Toggle button - always visible */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-0.5 z-50 w-7 h-7 flex items-center justify-center
          bg-zinc-900/80 rounded cursor-pointer
          text-zinc-400 hover:text-zinc-100 transition-all duration-300 ease-in-out
          ${isOpen ? "left-66" : "left-0"}`}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "" : "rotate-180"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    </>
  );
}
