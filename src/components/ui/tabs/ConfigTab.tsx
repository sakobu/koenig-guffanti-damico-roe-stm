import ScenarioPanel from "../panels/config/ScenarioPanel";
import PhysicsPanel from "../panels/config/PhysicsPanel";
import WaypointPanel from "../panels/config/WaypointPanel";
import ResultsPanel from "../panels/config/ResultsPanel";
import ExportPanel from "../panels/config/ExportPanel";

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
