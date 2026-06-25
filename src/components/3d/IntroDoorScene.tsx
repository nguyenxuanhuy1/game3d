"use client";

import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";

export default function IntroDoorScene() {
  const isInsideHouse = useGameStore((state) => state.isInsideHouse);
  const isDoorOpening = useGameStore((state) => state.isDoorOpening);
  const openDoor = useGameStore((state) => state.openDoor);
  const enterHouse = useGameStore((state) => state.enterHouse);

  const { camera } = useThree();

  const doorHingeRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Group>(null);
  const handLeftRef = useRef<THREE.Group>(null);
  const handRightRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);

  // Animation values to interpolate
  const targetDoorRotation = useRef(0);
  const targetHandleRotation = useRef(0);
  const currentDoorRotation = useRef(0);
  const currentHandleRotation = useRef(0);

  // Handle pointer down / click to trigger the door opening animation
  const handleInteract = () => {
    if (isDoorOpening || isInsideHouse) return;
    openDoor();
    targetHandleRotation.current = Math.PI / 4; // Rotate handle down 45 degrees
  };

  useFrame((state, delta) => {
    // 1. Hands follow mouse position smoothly at a specific depth
    const pointer = state.pointer;
    const viewport = state.viewport;

    // Calculate mouse position relative to camera at Z depth of door (~4.0)
    const zDepth = 1.2; // depth relative to camera position
    const targetHandX = (pointer.x * viewport.width) / 2;
    const targetHandY = (pointer.y * viewport.height) / 2 + 1.2;

    if (handLeftRef.current && handRightRef.current) {
      // Left hand follows mouse slightly offset
      handLeftRef.current.position.x = THREE.MathUtils.lerp(
        handLeftRef.current.position.x,
        targetHandX - 0.2,
        6 * delta
      );
      handLeftRef.current.position.y = THREE.MathUtils.lerp(
        handLeftRef.current.position.y,
        targetHandY - 0.1,
        6 * delta
      );
      handLeftRef.current.position.z = THREE.MathUtils.lerp(
        handLeftRef.current.position.z,
        camera.position.z - zDepth,
        6 * delta
      );

      // Right hand follows mouse
      handRightRef.current.position.x = THREE.MathUtils.lerp(
        handRightRef.current.position.x,
        targetHandX + 0.15,
        8 * delta
      );
      handRightRef.current.position.y = THREE.MathUtils.lerp(
        handRightRef.current.position.y,
        targetHandY - 0.05,
        8 * delta
      );
      handRightRef.current.position.z = THREE.MathUtils.lerp(
        handRightRef.current.position.z,
        camera.position.z - zDepth,
        8 * delta
      );
    }

    // 2. Door & Handle Rotation animations
    if (isDoorOpening) {
      // Step A: Rotate handle
      currentHandleRotation.current = THREE.MathUtils.lerp(
        currentHandleRotation.current,
        targetHandleRotation.current,
        10 * delta
      );
      if (handleRef.current) {
        handleRef.current.rotation.z = -currentHandleRotation.current;
      }

      // Step B: Swing door open (once handle has rotated slightly)
      if (currentHandleRotation.current > 0.15) {
        targetDoorRotation.current = -Math.PI / 1.7; // Swing inward
      }

      currentDoorRotation.current = THREE.MathUtils.lerp(
        currentDoorRotation.current,
        targetDoorRotation.current,
        3 * delta
      );

      if (doorHingeRef.current) {
        doorHingeRef.current.rotation.y = currentDoorRotation.current;
      }

      // Step C: Move camera inside the house (once door has opened significantly)
      if (currentDoorRotation.current < -0.4) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, -1.0, 2.0 * delta);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0.0, 2.0 * delta);
        
        // Once camera passes the door frame plane (z = 0), enter the house
        if (camera.position.z <= 0.1) {
          enterHouse();
        }
      }
    }
  });

  if (isInsideHouse) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Hands - Follow the cursor */}
      {/* 3D Left Arm & Hand - Reaching from bottom-left */}
      <group ref={handLeftRef}>
        {/* Palm */}
        <mesh castShadow>
          <boxGeometry args={[0.07, 0.02, 0.09]} />
          <meshStandardMaterial color="#ebd4c1" roughness={0.6} />
        </mesh>
        {/* Sleeve/Forearm */}
        <mesh castShadow position={[-0.05, -0.12, 0.28]} rotation={[0.4, -0.1, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </group>

      {/* 3D Right Arm & Hand - Reaching from bottom-right */}
      <group ref={handRightRef}>
        {/* Palm */}
        <mesh castShadow>
          <boxGeometry args={[0.07, 0.02, 0.09]} />
          <meshStandardMaterial color="#ebd4c1" roughness={0.6} />
        </mesh>
        {/* Sleeve/Forearm */}
        <mesh castShadow position={[0.05, -0.12, 0.28]} rotation={[0.4, 0.1, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </group>

      {/* Cozy Garden Grass Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#2d372e" roughness={0.95} />
      </mesh>

      {/* Stone Walkway leading to the door */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 2.5]}>
        <planeGeometry args={[1.8, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Bright Warm Cozy Stone Wall Exterior */}
      <mesh receiveShadow position={[-2.4, 1.25, 0]}>
        <boxGeometry args={[3, 2.7, 0.2]} />
        <meshStandardMaterial color="#e6e1d5" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[2.4, 1.25, 0]}>
        <boxGeometry args={[3, 2.7, 0.2]} />
        <meshStandardMaterial color="#e6e1d5" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[1.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#e6e1d5" roughness={0.8} />
      </mesh>

      {/* Door Frame */}
      <group position={[0, 1.2, 0]}>
        {/* Left Frame column */}
        <mesh position={[-0.925, 0, 0.05]}>
          <boxGeometry args={[0.05, 2.4, 0.15]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        {/* Right Frame column */}
        <mesh position={[0.925, 0, 0.05]}>
          <boxGeometry args={[0.05, 2.4, 0.15]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        {/* Top Frame piece */}
        <mesh position={[0, 1.225, 0.05]}>
          <boxGeometry args={[1.9, 0.05, 0.15]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
      </group>

      {/* Door Hinge and Panel Assembly */}
      {/* Pivot point is set on the left edge (x = -0.9) */}
      <group ref={doorHingeRef} position={[-0.9, 0, 0]}>
        <group position={[0.9, 1.2, 0]}>
          {/* Golden Oak Wooden Door Panel */}
          <mesh
            castShadow
            receiveShadow
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={handleInteract}
          >
            <boxGeometry args={[1.8, 2.4, 0.08]} />
            <meshStandardMaterial
              color={hovered ? "#bd9368" : "#a77b55"}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>

          {/* Golden Brass Handle Assembly */}
          <group ref={handleRef} position={[0.7, -0.05, 0.06]}>
            {/* Handle Base Mount */}
            <mesh castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
              <meshStandardMaterial
                color="#e5c158"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
            {/* Handle Lever */}
            <mesh
              castShadow
              position={[0.08, 0, 0.015]}
              rotation={[Math.PI / 2, 0, -Math.PI / 2]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.18, 16]} />
              <meshStandardMaterial
                color="#e5c158"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* Cozy Warm Front Porch Light fixture and Light source */}
      <group position={[0, 2.3, 0.5]}>
        {/* Light Box Mount */}
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.06, 0.16]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Glowing bulb */}
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Warm Porch Light Source */}
        <pointLight
          intensity={2.8}
          color="#fef08a"
          distance={8}
          decay={2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      </group>
    </group>
  );
}
