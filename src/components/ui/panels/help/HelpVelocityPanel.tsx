import Panel from "../Panel";

export default function HelpVelocityPanel() {
  return (
    <Panel title="Setting Velocity" defaultOpen={false}>
      <div className="space-y-3 text-xs text-zinc-500">
        <p>
          By default, waypoints have zero arrival velocity (stationary).
        </p>
        <p>
          <span className="text-zinc-400">1.</span> Select a waypoint by
          clicking it in the 3D view or waypoint list.
        </p>
        <p>
          <span className="text-zinc-400">2.</span> In the Waypoints panel, use
          the <span className="text-cyan-400">Arrival Velocity</span> dropdown.
        </p>
        <p>
          <span className="text-zinc-400">3.</span> Choose a preset or select{" "}
          <span className="text-cyan-400">Custom</span> to enter R/I/C velocity
          in m/s.
        </p>
      </div>
    </Panel>
  );
}
