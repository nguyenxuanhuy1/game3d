"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";

// Dirty spot positions relative to the car mesh
const SPOT_CONFIGS: { id: number; pos: [number, number, number] }[] = [
  { id: 1, pos: [-0.6, 0.35, 0.51] },
  { id: 2, pos: [0, 0.35, 0.51] },
  { id: 3, pos: [0.6, 0.35, 0.51] },
  { id: 4, pos: [-0.4, 0.55, 0.35] },
  { id: 5, pos: [0.4, 0.55, 0.35] },
  { id: 6, pos: [0, 0.7, -0.1] },
];

export default function GarageScene() {
  const setRoom = useGameStore((state) => state.setRoom);
  const selectTool = useGameStore((state) => state.selectTool);
  const spotsCleaned = useGameStore((state) => state.spotsCleaned);
  const cleanSpot = useGameStore((state) => state.cleanSpot);

  const { pointer, viewport } = useThree();

  const spongeRef = useRef<THREE.Mesh>(null);
  const elapsedTimeRef = useRef(0);

  const [bubbles, setBubbles] = useState<
    { id: number; pos: [number, number, number]; scale: number }[]
  >([]);

  // Auto-select sponge tool when in garage
  useEffect(() => {
    selectTool("sponge");
    return () => selectTool("none");
  }, [selectTool]);

  useFrame((state, delta) => {
    elapsedTimeRef.current += delta;
    const time = elapsedTimeRef.current;

    // 1. Move Sponge to track pointer in 3D (projected depth of z = 0.8)
    const targetX = (pointer.x * viewport.width) / 2;
    const targetY = (pointer.y * viewport.height) / 2 + 1.2; // adjusted for eye height
    const targetZ = 0.8;

    if (spongeRef.current) {
      spongeRef.current.position.x = THREE.MathUtils.lerp(
        spongeRef.current.position.x,
        targetX,
        12 * delta
      );
      spongeRef.current.position.y = THREE.MathUtils.lerp(
        spongeRef.current.position.y,
        targetY,
        12 * delta
      );
      spongeRef.current.position.z = THREE.MathUtils.lerp(
        spongeRef.current.position.z,
        targetZ,
        12 * delta
      );

      // Micro-rotations on the sponge for fluid movement
      spongeRef.current.rotation.z = Math.sin(time * 6) * 0.15;
      spongeRef.current.rotation.x = Math.cos(time * 5) * 0.08;

      // 2. Collision detection: Sponge vs. Dirty Spots
      const spongePos = spongeRef.current.position;
      SPOT_CONFIGS.forEach((spot, index) => {
        if (spotsCleaned[index]) return;

        // Convert local spot position to world coordinates (car is at [0, 0.8, -1])
        const spotWorldPos = new THREE.Vector3(
          spot.pos[0] + 0,
          spot.pos[1] + 0.8,
          spot.pos[2] + -1.0
        );

        const distance = spongePos.distanceTo(spotWorldPos);
        if (distance < 0.45) {
          // Spot rubbed clean!
          cleanSpot(index);

          // Spawn soapy bubbles
          const newBubbles = Array.from({ length: 4 }).map((_, i) => ({
            id: Math.random() + i,
            pos: [
              spotWorldPos.x + (Math.random() - 0.5) * 0.25,
              spotWorldPos.y + (Math.random() - 0.5) * 0.25,
              spotWorldPos.z + (Math.random() - 0.5) * 0.15,
            ] as [number, number, number],
            scale: Math.random() * 0.06 + 0.02,
          }));

          setBubbles((b) => [...b, ...newBubbles].slice(-32));
        }
      });
    }

    // Drift and fade bubbles
    setBubbles((prev) =>
      prev
        .map((b) => ({
          ...b,
          pos: [
            b.pos[0],
            b.pos[1] + 0.3 * delta,
            b.pos[2] + (Math.random() - 0.5) * 0.1 * delta,
          ] as [number, number, number],
          scale: b.scale - 0.04 * delta,
        }))
        .filter((b) => b.scale > 0.005)
    );
  });

  const isAllClean = spotsCleaned.every((s) => s);

  return (
    <group>
      {/* Garage Interior Environment */}
      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>
      {/* Wall */}
      <mesh receiveShadow position={[0, 1.5, -8]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[-5, 1.5, -3]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[5, 1.5, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} />
      </mesh>

      {/* Industrial/Cozy garage lighting */}
      <pointLight position={[0, 2.6, -1]} intensity={2.8} color="#e0f2fe" castShadow />
      <pointLight position={[-3, 2.2, -4]} intensity={1.2} color="#bae6fd" />

      {/* A Stylized Minimalist SUV Car Model */}
      <group position={[0, 0.8, -1.0]}>
        {/* Car chassis shadow helper */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]} receiveShadow>
          <planeGeometry args={[2.0, 1.2]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.3} />
        </mesh>

        {/* Lower Car Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.5, 0.9]} />
          <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.85} />
        </mesh>

        {/* Upper Cabin */}
        <mesh castShadow position={[-0.1, 0.45, 0]}>
          <boxGeometry args={[1.1, 0.4, 0.8]} />
          <meshStandardMaterial color="#18181b" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Windshield */}
        <mesh position={[0.46, 0.45, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.02, 0.4, 0.76]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} roughness={0.05} />
        </mesh>

        {/* Wheels */}
        <mesh position={[-0.55, -0.3, 0.46]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.95} />
        </mesh>
        <mesh position={[0.55, -0.3, 0.46]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.95} />
        </mesh>
        <mesh position={[-0.55, -0.3, -0.46]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.95} />
        </mesh>
        <mesh position={[0.55, -0.3, -0.46]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.95} />
        </mesh>

        {/* Mud / Dirty Patches */}
        {SPOT_CONFIGS.map(
          (spot, index) =>
            !spotsCleaned[index] && (
              <mesh key={spot.id} position={spot.pos} castShadow>
                <sphereGeometry args={[0.16, 16, 8]} />
                <meshStandardMaterial color="#78350f" roughness={0.95} transparent opacity={0.7} />
              </mesh>
            )
        )}
      </group>

      {/* Interactive Sponge Tool */}
      <mesh ref={spongeRef} castShadow>
        <boxGeometry args={[0.26, 0.08, 0.15]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>

      {/* Soap bubbles list */}
      {bubbles.map((b) => (
        <mesh key={b.id} position={b.pos}>
          <sphereGeometry args={[b.scale, 8, 8]} />
          <meshStandardMaterial
            color="#f0f9ff"
            roughness={0.05}
            metalness={0.1}
            transparent
            opacity={0.65}
          />
        </mesh>
      ))}

      {/* HTML Overlay Panel */}
      <Html fullscreen>
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none select-none">
          {/* Header */}
          <div className="flex justify-between items-center w-full">
            <div className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 pointer-events-auto">
              <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase">
                Active Room
              </span>
              <h2 className="text-sm font-semibold text-zinc-100">Garage (Car Washing)</h2>
            </div>

            <button
              onClick={() => setRoom("living-room")}
              className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-200 uppercase tracking-widest hover:border-zinc-700 hover:text-white transition-colors cursor-pointer pointer-events-auto shadow-lg"
            >
              Back to Hallway
            </button>
          </div>

          {/* Success Dialog */}
          {isAllClean && (
            <div className="m-auto px-8 py-5 rounded-2xl bg-sky-950/80 border border-sky-500/40 text-center shadow-2xl pointer-events-auto animate-bounce max-w-sm">
              <h3 className="text-lg font-bold text-sky-200">Car Spotless!</h3>
              <p className="text-xs text-sky-300/80 mt-1 leading-relaxed">
                Tension washed away. Feel the cleanliness.
              </p>
            </div>
          )}

          {/* Explanatory Footer */}
          <div className="flex justify-center w-full">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center text-xs text-zinc-400">
              {isAllClean ? (
                <span className="text-emerald-400 font-medium">
                  All clean! Satisfying job done. You can return to the main hallway.
                </span>
              ) : (
                <span>
                  Rub the <strong className="text-yellow-300">yellow sponge</strong> over the
                  brown mud spots to wash them away.
                </span>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
