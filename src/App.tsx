import Scene from './components/canvas/Scene'
import RICAxes from './components/canvas/RICAxes'
import Chief from './components/canvas/Chief'
import Deputy from './components/canvas/Deputy'
import Grid from './components/canvas/Grid'

export default function App() {
  return (
    <div className="w-screen h-screen bg-black">
      <Scene>
        <Grid />
        <RICAxes />
        <Chief />
        <Deputy position={[100, 50, 0]} />
      </Scene>
    </div>
  )
}
