import { Spacecraft } from "./spacecraft";

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
        // Left arm
        { position: [-7, 0, 0], length: 8, direction: "x" },
        // Right arm
        { position: [7, 0, 0], length: 8, direction: "x" },
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
    />
  );
}
