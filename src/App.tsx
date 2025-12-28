import Scene from './components/canvas/Scene'
import RICAxes from './components/canvas/environment/RICAxes'
import Grid from './components/canvas/environment/Grid'
import Chief from './components/canvas/spacecraft/Chief'
import Deputy from './components/canvas/spacecraft/Deputy'
import Sidebar from './components/ui/Sidebar'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Scene>
        <Grid />
        <RICAxes />
        <Chief />
        <Deputy position={[100, 50, 0]} />
      </Scene>
      <Sidebar />
    </div>
  )
}
