"use client";

import React, { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";

export default function IntroDoorScene() {
  const isInsideHouse = useGameStore((state) => state.entered);
  const isDoorOpening = useGameStore((state) => state.doorOpening);
  const openDoor = useGameStore((state) => state.openDoor);
  const enterHouse = useGameStore((state) => state.enterHome);

  const { camera } = useThree();

  const doorHingeRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Group>(null);
  const firefliesRef = useRef<THREE.Group>(null);

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

    // 3. Animate fireflies
    if (firefliesRef.current) {
      const time = state.clock.getElapsedTime();
      firefliesRef.current.children.forEach((child, i) => {
        const speed = 0.4 + (i % 3) * 0.2;
        child.position.y += Math.sin(time * speed + i) * 0.0015;
        child.position.x += Math.cos(time * speed + i) * 0.0015;
      });
    }
  });

  if (isInsideHouse) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Cozy Garden Grass Ground (golden-hour lit lawn) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#3a6b34" roughness={0.95} />
      </mesh>

      {/* Cozy winding stepping stones walkway */}
      <group>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.015, 0.8]}>
          <cylinderGeometry args={[0.34, 0.36, 0.03, 8]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, -0.1]} position={[-0.18, 0.015, 1.6]}>
          <cylinderGeometry args={[0.3, 0.32, 0.03, 8]} />
          <meshStandardMaterial color="#44403c" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[0.12, 0.015, 2.4]}>
          <cylinderGeometry args={[0.36, 0.38, 0.03, 8]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, -0.3]} position={[-0.12, 0.015, 3.2]}>
          <cylinderGeometry args={[0.32, 0.34, 0.03, 8]} />
          <meshStandardMaterial color="#44403c" roughness={0.9} />
        </mesh>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.15]} position={[0.18, 0.015, 4.0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.03, 8]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>
      </group>

      {/* Scattered grass blades/tufts */}
      <group>
        {Array.from({ length: 35 }).map((_, i) => {
          const x = Math.sin(i * 12345.67) * 5.0 + (i % 2 === 0 ? 1.6 : -1.6);
          const z = Math.cos(i * 98765.43) * 3.0 + 2.5;
          const scale = 0.06 + Math.abs(Math.sin(i)) * 0.09;
          return (
            <group key={`grass-${i}`} position={[x, 0.02, z]}>
              <mesh castShadow>
                <coneGeometry args={[0.016, scale, 4]} />
                <meshStandardMaterial color="#166534" roughness={0.9} />
              </mesh>
              <mesh position={[0.01, 0, -0.01]} rotation={[0.2, 0, 0.2]} castShadow>
                <coneGeometry args={[0.01, scale * 0.8, 4]} />
                <meshStandardMaterial color="#15803d" roughness={0.9} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Floating fireflies */}
      <group ref={firefliesRef}>
        {Array.from({ length: 16 }).map((_, i) => {
          const x = Math.sin(i * 5432.1) * 4.0;
          const y = 0.2 + Math.abs(Math.cos(i * 999.9)) * 1.5;
          const z = 0.8 + Math.abs(Math.sin(i * 777.7)) * 4.0;
          return (
            <mesh key={`firefly-${i}`} position={[x, y, z]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshBasicMaterial color="#a7f3d0" />
            </mesh>
          );
        })}
      </group>

      {/* Cozy Cottage Walls - Horizontal Siding panels */}
      <group position={[-2.4, 1.25, 0]}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`siding-l-${i}`} position={[0, -1.25 + i * 0.2, 0]} receiveShadow castShadow>
            <boxGeometry args={[3.2, 0.18, 0.2]} />
            <meshStandardMaterial color="#5a4533" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[2.4, 1.25, 0]}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={`siding-r-${i}`} position={[0, -1.25 + i * 0.2, 0]} receiveShadow castShadow>
            <boxGeometry args={[3.2, 0.18, 0.2]} />
            <meshStandardMaterial color="#5a4533" roughness={0.8} />
          </mesh>
        ))}
      </group>
      <group position={[0, 2.6, 0]}>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={`siding-t-${i}`} position={[0, -0.15 + i * 0.2, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.8, 0.18, 0.2]} />
            <meshStandardMaterial color="#5a4533" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Windows with glowing warm yellow interior light */}
      {/* Left Window */}
      <group position={[-2.3, 1.3, 0.11]}>
        {/* Frame */}
        <mesh castShadow>
          <boxGeometry args={[1.0, 1.2, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Glowing pane */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.9, 1.1, 0.02]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Window Cross Grid */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.04, 1.1, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.9, 0.04, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Right Window */}
      <group position={[2.3, 1.3, 0.11]}>
        {/* Frame */}
        <mesh castShadow>
          <boxGeometry args={[1.0, 1.2, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Glowing pane */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.9, 1.1, 0.02]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Window Cross Grid */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.04, 1.1, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.9, 0.04, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Timber Porch Awning */}
      <group position={[0, 2.5, 0.45]} rotation={[0.15, 0, 0]}>
        {/* Awning Roof */}
        <mesh castShadow>
          <boxGeometry args={[2.3, 0.04, 0.9]} />
          <meshStandardMaterial color="#18181b" roughness={0.7} />
        </mesh>
        {/* Left Timber Support */}
        <mesh position={[-1.05, -0.22, -0.4]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.05, 0.45, 0.05]} />
          <meshStandardMaterial color="#3f2f25" roughness={0.8} />
        </mesh>
        {/* Right Timber Support */}
        <mesh position={[1.05, -0.22, -0.4]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.05, 0.45, 0.05]} />
          <meshStandardMaterial color="#3f2f25" roughness={0.8} />
        </mesh>
      </group>

      {/* Door Frame */}
      <group position={[0, 1.2, 0]}>
        {/* Left Frame column */}
        <mesh position={[-0.925, 0, 0.05]}>
          <boxGeometry args={[0.05, 2.4, 0.15]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
        {/* Right Frame column */}
        <mesh position={[0.925, 0, 0.05]}>
          <boxGeometry args={[0.05, 2.4, 0.15]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
        {/* Top Frame piece */}
        <mesh position={[0, 1.225, 0.05]}>
          <boxGeometry args={[1.9, 0.05, 0.15]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
      </group>

      {/* Door Hinge and Panel Assembly */}
      {/* Pivot point is set on the left edge (x = -0.9) */}
      <group ref={doorHingeRef} position={[-0.9, 0, 0]}>
        <group position={[0.9, 1.2, 0]}>
          {/* Detailed Oak Wooden Door Panel */}
          <mesh
            castShadow
            receiveShadow
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={handleInteract}
          >
            <boxGeometry args={[1.8, 2.4, 0.08]} />
            <meshStandardMaterial
              color={hovered ? "#926848" : "#7c5335"}
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>

          {/* Decorative Door Panels */}
          {/* Panel Top Left */}
          <mesh position={[-0.35, 0.3, 0.042]} castShadow>
            <boxGeometry args={[0.5, 0.45, 0.015]} />
            <meshStandardMaterial color={hovered ? "#855d3f" : "#6f492e"} roughness={0.7} />
          </mesh>
          {/* Panel Top Right */}
          <mesh position={[0.35, 0.3, 0.042]} castShadow>
            <boxGeometry args={[0.5, 0.45, 0.015]} />
            <meshStandardMaterial color={hovered ? "#855d3f" : "#6f492e"} roughness={0.7} />
          </mesh>
          {/* Panel Bottom Left */}
          <mesh position={[-0.35, -0.45, 0.042]} castShadow>
            <boxGeometry args={[0.5, 0.75, 0.015]} />
            <meshStandardMaterial color={hovered ? "#855d3f" : "#6f492e"} roughness={0.7} />
          </mesh>
          {/* Panel Bottom Right */}
          <mesh position={[0.35, -0.45, 0.042]} castShadow>
            <boxGeometry args={[0.5, 0.75, 0.015]} />
            <meshStandardMaterial color={hovered ? "#855d3f" : "#6f492e"} roughness={0.7} />
          </mesh>

          {/* Translucent Glowing Glass Window insert in door */}
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[1.1, 0.28, 0.09]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[1.0, 0.2, 0.1]} />
            <meshStandardMaterial 
              color="#fef08a" 
              emissive="#f59e0b" 
              emissiveIntensity={0.8} 
              transparent 
              opacity={0.8} 
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
                roughness={0.15}
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
                roughness={0.15}
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
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Lantern support arm */}
        <mesh position={[0, 0.08, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Lantern glass cylinder */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 8, 1, true]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.2} roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Lantern frame struts */}
        <mesh position={[-0.07, -0.15, -0.07]}>
          <boxGeometry args={[0.012, 0.18, 0.012]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0.07, -0.15, -0.07]}>
          <boxGeometry args={[0.012, 0.18, 0.012]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[-0.07, -0.15, 0.07]}>
          <boxGeometry args={[0.012, 0.18, 0.012]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0.07, -0.15, 0.07]}>
          <boxGeometry args={[0.012, 0.18, 0.012]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        {/* Glowing bulb */}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Warm Porch Light Source */}
        <pointLight
          intensity={3.2}
          color="#fef08a"
          distance={10}
          decay={1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      </group>
    </group>
  );
}
