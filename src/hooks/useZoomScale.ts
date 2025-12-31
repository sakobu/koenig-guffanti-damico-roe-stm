import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Default camera distance at which zoomScale = 1.0 */
export const DEFAULT_BASE_DISTANCE = 1500;

interface UseZoomScaleOptions {
  baseDistance?: number;
  minScale?: number;
  maxScale?: number;
  threshold?: number;
}

/**
 * Computes a zoom scale factor based on camera distance.
 * Uses square root (logarithmic) scaling for subtle, natural feel.
 */
function computeZoomScale(
  distance: number,
  baseDistance: number,
  minScale: number,
  maxScale: number
): number {
  const ratio = distance / baseDistance;
  // Square root gives gradual scaling: 4x distance = 2x scale
  const scale = Math.pow(ratio, 0.5);
  return Math.max(minScale, Math.min(maxScale, scale));
}

/**
 * Hook that tracks camera distance and returns a responsive scale factor.
 * Use this to scale UI elements (text, markers, spacecraft) based on zoom level.
 *
 * @param options.baseDistance - Distance at which scale = 1.0 (default: 1500)
 * @param options.minScale - Minimum scale factor (default: 0.3)
 * @param options.maxScale - Maximum scale factor (default: 10)
 * @param options.threshold - Minimum change to trigger re-render (default: 0.01)
 */
export function useZoomScale(options: UseZoomScaleOptions = {}): number {
  const {
    baseDistance = DEFAULT_BASE_DISTANCE,
    minScale = 0.3,
    maxScale = 10,
    threshold = 0.01,
  } = options;

  const { camera } = useThree();
  const [scale, setScale] = useState(() =>
    computeZoomScale(camera.position.length(), baseDistance, minScale, maxScale)
  );
  const scaleRef = useRef(scale);

  useFrame(() => {
    const distance = camera.position.length();
    const newScale = computeZoomScale(distance, baseDistance, minScale, maxScale);

    // Only trigger re-render if change exceeds threshold
    if (Math.abs(newScale - scaleRef.current) > threshold) {
      scaleRef.current = newScale;
      setScale(newScale);
    }
  });

  return scale;
}

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
