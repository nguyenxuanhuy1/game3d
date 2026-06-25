"use client";

import React, { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";
import GarageScene from "./GarageScene";
import GardenScene from "./GardenScene";

export default function HouseInteriorScene() {
  const isInsideHouse = useGameStore((state) => state.isInsideHouse);
  const currentRoom = useGameStore((state) => state.currentRoom);

  const [hoveredPortal, setHoveredPortal] = useState<"garage" | "garden" | null>(null);

  // References to animate the glowing door gateways
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);


  useFrame((state, delta) => {
    if (!isInsideHouse || currentRoom !== "living-room") return;

    // Pulsate the glowing doorways for subtle visual feedback
    const pulseFactor = 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
    
    if (leftDoorRef.current) {
      (leftDoorRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulseFactor;
    }
    if (rightDoorRef.current) {
      (rightDoorRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulseFactor;
    }
  });

  if (!isInsideHouse) return null;

  // Render sub-scenes if inside specific rooms
  if (currentRoom === "garage") {
    return <GarageScene />;
  }

  if (currentRoom === "garden") {
    return <GardenScene />;
  }

  return (
    <group>
      {/* 3D Living Room Environment */}
      {/* Cozy Wood Plank Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3.5]}>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#271e18" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 3, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#131317" roughness={0.9} />
      </mesh>

      {/* Cozy Back Wall */}
      <mesh receiveShadow position={[0, 1.5, -8]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.9} />
      </mesh>

      {/* LEFT WALL (Split to leave a Doorway at z = -3.5) */}
      {/* Back segment */}
      <mesh receiveShadow position={[-5, 1.5, -6.5]}>
        <boxGeometry args={[0.2, 3, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      {/* Front segment */}
      <mesh receiveShadow position={[-5, 1.5, -0.5]}>
        <boxGeometry args={[0.2, 3, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      {/* Lintel header above door */}
      <mesh receiveShadow position={[-5, 2.7, -3.5]}>
        <boxGeometry args={[0.2, 0.6, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>

      {/* RIGHT WALL (Split to leave a Doorway at z = -3.5) */}
      {/* Back segment */}
      <mesh receiveShadow position={[5, 1.5, -6.5]}>
        <boxGeometry args={[0.2, 3, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      {/* Front segment */}
      <mesh receiveShadow position={[5, 1.5, -0.5]}>
        <boxGeometry args={[0.2, 3, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      {/* Lintel header above door */}
      <mesh receiveShadow position={[5, 2.7, -3.5]}>
        <boxGeometry args={[0.2, 0.6, 3]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>

      {/* Front Wall (facing outside gate) */}
      <mesh receiveShadow position={[-3.5, 1.5, 1]}>
        <boxGeometry args={[3, 3, 0.2]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[3.5, 1.5, 1]}>
        <boxGeometry args={[3, 3, 0.2]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 2.7, 1]}>
        <boxGeometry args={[4, 0.6, 0.2]} />
        <meshStandardMaterial color="#18181f" roughness={0.9} />
      </mesh>
      {/* Left/Right frame dividers */}
      <mesh receiveShadow position={[-2.025, 1.2, 0.95]}>
        <boxGeometry args={[0.05, 2.4, 0.1]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
      <mesh receiveShadow position={[2.025, 1.2, 0.95]}>
        <boxGeometry args={[0.05, 2.4, 0.1]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>

      {/* Open Main Door (Visual continuity) */}
      <group position={[-2.0, 0, 0.9]} rotation={[0, -Math.PI / 1.6, 0]}>
        <mesh position={[1.0, 1.2, 0]}>
          <boxGeometry args={[2.0, 2.4, 0.08]} />
          <meshStandardMaterial color="#3d3027" roughness={0.8} />
        </mesh>
      </group>

      {/* Central Cozy Lights */}
      <pointLight
        position={[0, 2.7, -3.5]}
        intensity={2.8}
        color="#fcf3e8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 2.7, -1.0]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-3.8, 2.0, -5.5]} intensity={1.5} color="#bae6fd" />
      <pointLight position={[3.8, 2.0, -5.5]} intensity={1.5} color="#a7f3d0" />

      {/* 2D/3D Doorway Portal triggers */}
      {/* 1. Left Doorway (Garage) */}
      <group position={[-4.9, 1.2, -3.5]}>
        {/* Glow Sheet */}
        <mesh
          ref={leftDoorRef}
          onPointerOver={() => setHoveredPortal("garage")}
          onPointerOut={() => setHoveredPortal(null)}
        >
          <boxGeometry args={[0.02, 2.4, 2.0]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={hoveredPortal === "garage" ? 1.0 : 0.4}
            transparent
            opacity={0.15}
          />
        </mesh>

        <Html position={[0.2, 0.8, 0]} center distanceFactor={4.5}>
          <div
            className={`px-3 py-1.5 rounded-lg bg-zinc-950/90 border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-xl transition-all duration-300 ${
              hoveredPortal === "garage"
                ? "border-sky-400 text-sky-400 scale-110"
                : "border-zinc-800 text-zinc-400 opacity-60"
            }`}
          >
            ← Garage: Walk in to Wash Car
          </div>
        </Html>
      </group>

      {/* 2. Right Doorway (Garden) */}
      <group position={[4.9, 1.2, -3.5]}>
        {/* Glow Sheet */}
        <mesh
          ref={rightDoorRef}
          onPointerOver={() => setHoveredPortal("garden")}
          onPointerOut={() => setHoveredPortal(null)}
        >
          <boxGeometry args={[0.02, 2.4, 2.0]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={hoveredPortal === "garden" ? 1.0 : 0.4}
            transparent
            opacity={0.15}
          />
        </mesh>

        <Html position={[-0.2, 0.8, 0]} center distanceFactor={4.5}>
          <div
            className={`px-3 py-1.5 rounded-lg bg-zinc-950/90 border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-xl transition-all duration-300 ${
              hoveredPortal === "garden"
                ? "border-emerald-400 text-emerald-400 scale-110"
                : "border-zinc-800 text-zinc-400 opacity-60"
            }`}
          >
            Garden: Walk in to Water Plant →
          </div>
        </Html>
      </group>

      {/* --- COZY FURNITURE MODELS --- */}
      {/* 1. Sofa Set in center facing back wall (forming a living space) */}
      <group position={[0, 0, -4.5]}>
        {/* Bottom Cushions */}
        <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[2.0, 0.24, 0.9]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} />
        </mesh>
        {/* Backrest */}
        <mesh castShadow position={[0, 0.65, -0.38]}>
          <boxGeometry args={[2.0, 0.7, 0.16]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} />
        </mesh>
        {/* Left Armrest */}
        <mesh castShadow position={[-1.04, 0.35, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.9]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
        {/* Right Armrest */}
        <mesh castShadow position={[1.04, 0.35, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.9]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      </group>

      {/* 2. Cozy Coffee Table */}
      <group position={[0, 0, -2.8]}>
        {/* Tabletop */}
        <mesh castShadow position={[0, 0.32, 0]}>
          <boxGeometry args={[1.3, 0.04, 0.65]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        {/* Legs */}
        <mesh castShadow position={[-0.55, 0.15, -0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.55, 0.15, -0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.55, 0.15, 0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.55, 0.15, 0.25]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.9} />
        </mesh>
      </group>

      {/* 3. Soft Magenta/Purple Round Rug */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -3.3]}>
        <cylinderGeometry args={[1.3, 1.3, 0.01, 32]} />
        <meshStandardMaterial color="#701a75" roughness={0.95} />
      </mesh>

      {/* 4. Elegant Potted Fern Plant near Sofa */}
      <group position={[-1.7, 0, -4.5]}>
        {/* Pot */}
        <mesh castShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.18, 0.12, 0.4, 12]} />
          <meshStandardMaterial color="#ba8d6c" roughness={0.8} />
        </mesh>
        {/* Stems */}
        <mesh position={[-0.04, 0.45, 0.04]} rotation={[0.2, 0.1, -0.3]}>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
          <meshStandardMaterial color="#166534" />
        </mesh>
        <mesh position={[0.04, 0.45, -0.04]} rotation={[-0.2, -0.1, 0.3]}>
          <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
          <meshStandardMaterial color="#166534" />
        </mesh>
        {/* Leaves spheres */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.7} />
        </mesh>
        <mesh position={[-0.08, 0.5, 0.06]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#22c55e" roughness={0.7} />
        </mesh>
        <mesh position={[0.08, 0.5, -0.06]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#22c55e" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
