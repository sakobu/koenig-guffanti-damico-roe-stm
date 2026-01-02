import { SCENARIO_OPTIONS } from '@config/scenarios';
import { useMissionStore } from '@stores/mission';

import Select from '../../../shared/controls/Select';
import Panel from '../Panel';

export default function ScenarioPanel() {
  const scenario = useMissionStore((state) => state.scenario);
  const chief = useMissionStore((state) => state.chief);
  const setScenario = useMissionStore((state) => state.setScenario);

  return (
    <Panel title="Orbit Scenario" defaultOpen>
      <div className="space-y-3">
        <Select
          label="Scenario"
          value={scenario}
          onChange={(value) => setScenario(value as typeof scenario)}
          options={SCENARIO_OPTIONS}
        />

        {/* Orbit parameters (read-only) */}
        <div className="pt-2 border-t border-zinc-800 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Semi-major axis</span>
            <span className="font-mono text-zinc-300">
              {(chief.semiMajorAxis / 1000).toFixed(0)} km
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Eccentricity</span>
            <span className="font-mono text-zinc-300">
              {chief.eccentricity.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Inclination</span>
            <span className="font-mono text-zinc-300">
              {((chief.inclination * 180) / Math.PI).toFixed(1)}°
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
