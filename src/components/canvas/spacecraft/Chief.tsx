import { Spacecraft } from "./Spacecraft";

export default function Chief() {
  return (
    <Spacecraft
      position={[0, 0, 0]}
      scale={2}
      label="Chief"
      labelColor="#ff6666"
      mainBody={{
        width: 6,
        height: 6,
        depth: 8,
        color: "#cc4444",
        emissive: "#ff4422",
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
        { position: [0, 4, 5], color: "#ff4444", intensity: 5, distance: 150 },
        { position: [0, -4, 5], color: "#ff4444", intensity: 5, distance: 150 },
      ]}
    />
  );
}
