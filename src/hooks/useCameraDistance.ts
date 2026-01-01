import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Returns the raw camera distance without scaling.
 * Useful for components that need direct access to zoom level.
 */
export function useCameraDistance(): number {
  const { camera } = useThree();
  const [distance, setDistance] = useState(() => camera.position.length());
  const distanceRef = useRef(distance);

  useFrame(() => {
    const newDistance = camera.position.length();
    // Only update if changed significantly (>1 unit)
    if (Math.abs(newDistance - distanceRef.current) > 1) {
      distanceRef.current = newDistance;
      setDistance(newDistance);
    }
  });

  return distance;
}
