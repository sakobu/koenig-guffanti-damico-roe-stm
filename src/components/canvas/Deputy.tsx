import { Spacecraft } from "./spacecraft/Spacecraft";

interface DeputyProps {
  position?: [number, number, number];
}

export default function Deputy({ position = [150, 80, 0] }: DeputyProps) {
  return (
    <Spacecraft
      position={position}
      scale={1.8}
      label="Deputy"
      labelColor="#6688ff"
      mainBody={{
        width: 6,
        height: 6,
        depth: 8,
        color: "#4466cc",
        emissive: "#2266ff",
        emissiveIntensity: 0.6,
      }}
      arms={[
        // Left arm - connects body edge (x=-3) to panel (x=-14)
        { position: [-8.5, 0, 0], length: 11, direction: "x" },
        // Right arm
        { position: [8.5, 0, 0], length: 11, direction: "x" },
      ]}
      solarPanels={[
        // Left panel
        {
          width: 1,
          height: 10,
          depth: 8,
          position: [-14, 0, 0],
        },
        // Right panel
        {
          width: 1,
          height: 10,
          depth: 8,
          position: [14, 0, 0],
        },
      ]}
      navigationLights={[
        { position: [0, 4, 5], color: "#4488ff", intensity: 5, distance: 150 },
        { position: [0, -4, 5], color: "#4488ff", intensity: 5, distance: 150 },
      ]}
    />
  );
}
