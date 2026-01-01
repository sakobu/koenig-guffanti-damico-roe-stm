import HelpCameraPanel from '../panels/help/HelpCameraPanel';
import HelpExportPanel from '../panels/help/HelpExportPanel';
import HelpHotkeysPanel from '../panels/help/HelpHotkeysPanel';
import HelpScenariosPanel from '../panels/help/HelpScenariosPanel';
import HelpVelocityPanel from '../panels/help/HelpVelocityPanel';
import HelpWaypointsPanel from '../panels/help/HelpWaypointsPanel';

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
