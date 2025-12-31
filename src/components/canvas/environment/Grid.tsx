import { Grid as DreiGrid, Text } from "@react-three/drei";
import { useMemo } from "react";

interface GridProps {
  size?: number;
  cellSize?: number;
  sectionSize?: number;
}

export default function Grid({
  size = 2000,
  cellSize = 50,
  sectionSize = 250,
}: GridProps) {
  // Use sectionSize as marker interval
  const markerInterval = sectionSize;

  // Scale font size based on grid scale (larger grid = larger text)
  const fontSize = Math.max(7, size / 300);
  const markerOffset = Math.max(8, size / 250);

  const markers = useMemo(() => {
    const half = size / 2;
    const result: {
      position: [number, number, number];
      label: string;
      axis: "I" | "R";
    }[] = [];

    // Distance markers along I axis (at R=0)
    for (let d = -half; d <= half; d += markerInterval) {
      if (d !== 0) {
        result.push({
          position: [d, -markerOffset, 0],
          label: `${d}`,
          axis: "I",
        });
      }
    }

    // Distance markers along R axis (at I=0)
    for (let d = -half; d <= half; d += markerInterval) {
      if (d !== 0) {
        result.push({
          position: [-markerOffset * 1.5, d, 0],
          label: `${d}`,
          axis: "R",
        });
      }
    }

    return result;
  }, [size, markerInterval, markerOffset]);

  return (
    <group>
      <DreiGrid
        args={[size, size]}
        rotation={[Math.PI / 2, 0, 0]}
        cellSize={cellSize}
        cellThickness={0.4}
        cellColor="#1a3d5c"
        sectionSize={sectionSize}
        sectionThickness={0.8}
        sectionColor="#2a5478"
        fadeDistance={size}
        fadeStrength={1.5}
      />
      {markers.map((marker, i) => (
        <Text
          key={`marker-${i}`}
          position={marker.position}
          fontSize={fontSize}
          color="#4a6a8a"
          anchorX={marker.axis === "I" ? "center" : "right"}
          anchorY={marker.axis === "I" ? "top" : "middle"}
        >
          {marker.label}
        </Text>
      ))}
    </group>
  );
}
