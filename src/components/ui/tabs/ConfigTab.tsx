import ExportPanel from '../panels/config/ExportPanel';
import PhysicsPanel from '../panels/config/PhysicsPanel';
import ResultsPanel from '../panels/config/ResultsPanel';
import ScenarioPanel from '../panels/config/ScenarioPanel';
import WaypointPanel from '../panels/config/WaypointPanel';

export default function ConfigTab() {
  return (
    <>
      <ScenarioPanel />
      <PhysicsPanel />
      <WaypointPanel />
      <ResultsPanel />
      <ExportPanel />
    </>
  );
}
