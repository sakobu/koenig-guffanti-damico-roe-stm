import Panel from "../Panel";

export default function HelpExportPanel() {
  return (
    <Panel title="Exporting Data" defaultOpen={false}>
      <div className="space-y-4 text-xs text-zinc-400">
        <div>
          <p className="text-zinc-300 mb-1">Export Mission (JSON)</p>
          <p>
            Complete mission data with waypoints in both{" "}
            <span className="text-cyan-400">RIC</span> and{" "}
            <span className="text-cyan-400">ROE</span> formats. Includes chief
            orbit parameters, burn timing, and delta-V breakdown per leg.
          </p>
        </div>
        <div>
          <p className="text-zinc-300 mb-1">Export Ephemeris (CSV)</p>
          <p>
            Time-series trajectory with position and velocity in RIC. Includes
            event markers for coast phases, departure burns, and arrival burns.
          </p>
        </div>
      </div>
    </Panel>
  );
}
