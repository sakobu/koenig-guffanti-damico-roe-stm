import { Sphere, Billboard, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { Vector3 } from "@orbital";
import { useMissionStore } from "../../../stores/mission";
import {
  ricToThreePosition,
  threeToRicPosition,
} from "../../../utils/coordinates";

interface WaypointProps {
  position: Vector3;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (newPosition: Vector3) => void;
  scale?: number;
}

export default function Waypoint({
  position,
  index,
  isSelected,
  onSelect,
  onDrag,
  scale = 1,
}: WaypointProps) {
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const setDraggingWaypoint = useMissionStore((s) => s.setDraggingWaypoint);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const currentZ = useRef(position[2]);

  // Update Z ref when position changes externally
  useEffect(() => {
    currentZ.current = position[2];
  }, [position]);

  const getWorldPosition = useCallback(
    (clientX: number, clientY: number): Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Create plane at current Z position
      dragPlane.current.set(new THREE.Vector3(0, 0, 1), -currentZ.current);

      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane.current, intersection)) {
        // Convert Three.js position to RIC, preserving current C (z) value
        return threeToRicPosition(
          new THREE.Vector3(intersection.x, intersection.y, currentZ.current)
        );
      }
      return null;
    },
    [camera, gl]
  );

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggingWaypoint(true);
    document.body.style.cursor = "grabbing";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const newPos = getWorldPosition(e.clientX, e.clientY);
    if (newPos) {
      onDrag(newPos);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    setDraggingWaypoint(false);
    document.body.style.cursor = "grab";
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Scroll wheel for Z adjustment while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalize delta for trackpad vs mouse wheel
      const delta = e.deltaMode === 0 ? e.deltaY * 0.1 : e.deltaY * 3;
      currentZ.current -= delta;
      onDrag([position[0], position[1], currentZ.current]);
    };

    gl.domElement.addEventListener("wheel", handleWheel, { passive: false });
    return () => gl.domElement.removeEventListener("wheel", handleWheel);
  }, [isDragging, gl, onDrag, position]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isDragging) return;
    e.stopPropagation();
    onSelect();
  };

  const color = isSelected ? "#22d3ee" : "#f59e0b";
  const labelColor = isSelected ? "#67e8f9" : "#fbbf24";

  return (
    <group position={ricToThreePosition(position)}>
      <Sphere
        args={[5 * scale, 16, 16]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => {
          if (!isDragging) document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (!isDragging) document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={isSelected ? 0.7 : 0.5}
        />
      </Sphere>

      <Billboard position={[0, 15 * scale, 0]}>
        <Text
          fontSize={10 * scale}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {`WP${index + 1}`}
        </Text>
      </Billboard>
    </group>
  );
}
