import { Text } from '@react-three/drei'
import { MainBody, type MainBodyProps } from './MainBody'
import { SolarPanel, type SolarPanelProps } from './SolarPanel'
import { NavigationLight, type NavigationLightProps } from './NavigationLight'

export interface ArmProps {
  position: [number, number, number]
  length: number
  direction: 'x' | 'y' | 'z'
}

export interface SpacecraftProps {
  position?: [number, number, number]
  scale?: number
  mainBody: MainBodyProps
  solarPanels: SolarPanelProps[]
  arms?: ArmProps[]
  navigationLights?: NavigationLightProps[]
  label?: string
  labelColor?: string
}

function Arm({ position, length, direction }: ArmProps) {
  const size: [number, number, number] =
    direction === 'x' ? [length, 0.8, 0.8] :
    direction === 'y' ? [0.8, length, 0.8] :
    [0.8, 0.8, length]

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
    </mesh>
  )
}

export function Spacecraft({
  position = [0, 0, 0],
  scale = 1,
  mainBody,
  solarPanels,
  arms = [],
  navigationLights = [],
  label,
  labelColor = '#ffffff'
}: SpacecraftProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <MainBody {...mainBody} />

      {arms.map((arm, index) => (
        <Arm key={`arm-${index}`} {...arm} />
      ))}

      {solarPanels.map((panel, index) => (
        <SolarPanel key={`panel-${index}`} {...panel} />
      ))}

      {navigationLights.map((light, index) => (
        <NavigationLight key={`light-${index}`} {...light} />
      ))}

      {label && (
        <Text
          position={[0, -mainBody.height - 8, 0]}
          fontSize={5}
          color={labelColor}
          anchorX="center"
          anchorY="top"
          outlineWidth={0.15}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
    </group>
  )
}
