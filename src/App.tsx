import AnimationController from './components/canvas/AnimationController';
import Grid from './components/canvas/environment/Grid';
import RICAxes from './components/canvas/environment/RICAxes';
import ClickPlane from './components/canvas/mission/ClickPlane';
import Trajectory from './components/canvas/mission/Trajectory';
import Waypoints from './components/canvas/mission/Waypoints';
import Scene from './components/canvas/Scene';
import Chief from './components/canvas/spacecraft/Chief';
import Deputy from './components/canvas/spacecraft/Deputy';
import ErrorBoundary from './components/shared/error/ErrorBoundary';
import MissionErrorHandler from './components/shared/error/MissionErrorHandler';
import ToastContainer from './components/shared/toast/ToastContainer';
import ToastProvider from './components/shared/toast/ToastProvider';
import HUD from './components/ui/hud/HUD';
import Sidebar from './components/ui/Sidebar';
import { SCENARIOS } from './config/scenarios';
import { useMissionStore } from './stores/mission';

export default function App() {
  const scenario = useMissionStore((s) => s.scenario);
  const scenarioConfig = SCENARIOS[scenario];

  return (
    <ToastProvider>
      <ErrorBoundary name="Application">
        <div className="w-screen h-screen bg-black">
          {/* Key on Scene forces camera reset when scenario changes */}
          <Scene
            key={scenario}
            cameraDistance={scenarioConfig.cameraDistance}
            maxZoomOut={scenarioConfig.maxZoomOut}
          >
            <ClickPlane size={scenarioConfig.gridSize} />
            <Grid
              size={scenarioConfig.gridSize}
              cellSize={scenarioConfig.gridCellSize}
              sectionSize={scenarioConfig.gridSectionSize}
            />
            <RICAxes />
            <Chief />
            <Deputy />
            <Waypoints />
            <Trajectory />
            <AnimationController />
          </Scene>
          <Sidebar />
          <HUD />
        </div>
        <MissionErrorHandler />
        <ToastContainer />
      </ErrorBoundary>
    </ToastProvider>
  );
}
