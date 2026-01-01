import Panel from "../Panel";

export default function HelpWaypointsPanel() {
  return (
    <Panel title="Adding Waypoints" defaultOpen>
      <div className="space-y-3 text-xs text-zinc-400">
        <p>
          <kbd className="px-1.5 py-0.5 bg-zinc-800 text-cyan-400 rounded font-mono">
            Shift
          </kbd>
          {" + click"} on the grid plane to add a waypoint.
        </p>
        <p>
          <span className="text-zinc-300">Drag</span> any waypoint to
          reposition it in the R-I plane.
        </p>
        <p>
          <span className="text-zinc-300">Scroll wheel</span> while dragging to
          adjust the C (cross-track) axis.
        </p>
      </div>
    </Panel>
  );
}
