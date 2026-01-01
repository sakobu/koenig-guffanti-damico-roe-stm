import Panel from '../Panel';

export default function HelpScenariosPanel() {
  return (
    <Panel title="Scenarios" defaultOpen>
      <div className="space-y-3 text-xs text-zinc-500">
        <p>
          Scenarios are <span className="text-zinc-400">presets</span> that
          configure the chief orbit, initial deputy position, and visualization
          scale.
        </p>
        <div className="space-y-1.5">
          <p>
            <span className="text-cyan-400">ISS Circular</span> — Standard LEO,
            near-circular (~400 km)
          </p>
          <p>
            <span className="text-cyan-400">High-Alt Eccentric</span> — Higher
            altitude with e=0.1
          </p>
          <p>
            <span className="text-cyan-400">Low-Alt Eccentric</span> — Lower
            altitude, stronger drag at perigee
          </p>
          <p>
            <span className="text-cyan-400">Long-Duration Hold</span> —
            Optimized for station-keeping
          </p>
          <p>
            <span className="text-cyan-400">Large Formation</span> — Scaled for
            km-range separations
          </p>
        </div>
      </div>
    </Panel>
  );
}
