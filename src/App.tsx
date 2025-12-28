import Scene from './components/canvas/Scene'
import RICAxes from './components/canvas/environment/RICAxes'
import Grid from './components/canvas/environment/Grid'
import Chief from './components/canvas/spacecraft/Chief'
import Deputy from './components/canvas/spacecraft/Deputy'
import Waypoints from './components/canvas/Waypoints'
import Trajectory from './components/canvas/Trajectory'
import Sidebar from './components/ui/Sidebar'
import { useMissionStore } from './stores/mission'

export default function App() {
  const initialPosition = useMissionStore((state) => state.initialPosition)

  return (
    <div className="w-screen h-screen bg-black">
      <Scene>
        <Grid />
        <RICAxes />
        <Chief />
        <Deputy position={initialPosition as [number, number, number]} />
        <Waypoints />
        <Trajectory />
      </Scene>
      <Sidebar />
    </div>
  )
}
