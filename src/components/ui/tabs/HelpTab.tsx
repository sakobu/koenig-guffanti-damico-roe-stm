import HelpScenariosPanel from "../panels/help/HelpScenariosPanel";
import HelpWaypointsPanel from "../panels/help/HelpWaypointsPanel";
import HelpHotkeysPanel from "../panels/help/HelpHotkeysPanel";
import HelpVelocityPanel from "../panels/help/HelpVelocityPanel";
import HelpCameraPanel from "../panels/help/HelpCameraPanel";
import HelpExportPanel from "../panels/help/HelpExportPanel";

export default function HelpTab() {
  return (
    <>
      <HelpScenariosPanel />
      <HelpWaypointsPanel />
      <HelpHotkeysPanel />
      <HelpVelocityPanel />
      <HelpCameraPanel />
      <HelpExportPanel />
    </>
  );
}
