import Scene from './components/canvas/Scene'
import RICAxes from './components/canvas/environment/RICAxes'
import Grid from './components/canvas/environment/Grid'
import Chief from './components/canvas/spacecraft/Chief'
import Deputy from './components/canvas/spacecraft/Deputy'
import Waypoints from './components/canvas/mission/Waypoints'
import Trajectory from './components/canvas/mission/Trajectory'
import ClickPlane from './components/canvas/mission/ClickPlane'
import Sidebar from './components/ui/Sidebar'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Scene>
        <ClickPlane />
        <Grid />
        <RICAxes />
        <Chief />
        <Deputy />
        <Waypoints />
        <Trajectory />
      </Scene>
      <Sidebar />
    </div>
  )
}
