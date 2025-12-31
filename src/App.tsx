import Scene from './components/canvas/Scene'
import RICAxes from './components/canvas/environment/RICAxes'
import Grid from './components/canvas/environment/Grid'
import Chief from './components/canvas/spacecraft/Chief'
import Deputy from './components/canvas/spacecraft/Deputy'
import Waypoints from './components/canvas/mission/Waypoints'
import Trajectory from './components/canvas/mission/Trajectory'
import ClickPlane from './components/canvas/mission/ClickPlane'
import Sidebar from './components/ui/Sidebar'
import { useMissionStore } from './stores/mission'
import { SCENARIOS } from './config/scenarios'

export default function App() {
  const scenario = useMissionStore((s) => s.scenario)
  const scenarioConfig = SCENARIOS[scenario]

  return (
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
        <Chief scale={scenarioConfig.spacecraftScale} />
        <Deputy scale={scenarioConfig.spacecraftScale} />
        <Waypoints scale={scenarioConfig.spacecraftScale} />
        <Trajectory />
      </Scene>
      <Sidebar />
    </div>
  )
}
