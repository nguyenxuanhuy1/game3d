"use client";

import React from "react";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import KitchenZone from "./KitchenZone";
import LivingZone from "./LivingZone";
import OutdoorZone from "./OutdoorZone";

// One continuous, walkable home: kitchen (left) → living room (centre) →
// glass doors out to the garden & carport (right). Layout matches the
// collision walls in PlayerControls.
export default function HomeWorld() {
  return (
    <group>
      {/* ---------------- Floors ---------------- */}
      {/* Living-room wood floor (reflective, lightly polished) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.25, 0, -1.5]} receiveShadow>
        <planeGeometry args={[11.5, 15]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1.6}
          mixStrength={1.2}
          blur={[300, 80]}
          roughness={0.7}
          color="#6b4a32"
          metalness={0.2}
          mirror={0.15}
        />
      </mesh>
      {/* Plank seams on the wood floor */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-5.3 + i * 0.84, 0.011, -1.5]}>
          <planeGeometry args={[0.03, 15]} />
          <meshBasicMaterial color="#3d2817" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* Kitchen tiled floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.25, 0.005, -1.5]} receiveShadow>
        <planeGeometry args={[9.5, 15]} />
        <meshStandardMaterial color="#cdbfa6" roughness={0.55} metalness={0.1} />
      </mesh>
      {Array.from({ length: 7 }).map((_, r) =>
        Array.from({ length: 11 }).map((_, c) => (
          <mesh
            key={`tile-${r}-${c}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-14.6 + c * 0.85, 0.012, -8.4 + r * 2.1]}
          >
            <planeGeometry args={[0.78, 0.06]} />
            <meshBasicMaterial color="#a8987c" />
          </mesh>
        ))
      )}

      {/* ---------------- Ceiling (interior only) ---------------- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-4.5, 3.2, -1.5]}>
        <planeGeometry args={[21, 15.4]} />
        <meshStandardMaterial color="#efe3d0" roughness={0.95} />
      </mesh>
      {/* Warm wood ceiling beams */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[-14 + i * 3.6, 3.1, -1.5]} castShadow>
          <boxGeometry args={[0.2, 0.18, 15]} />
          <meshStandardMaterial color="#6b4a30" roughness={0.8} />
        </mesh>
      ))}

      {/* ---------------- Walls ---------------- */}
      {/* Back wall */}
      <mesh receiveShadow position={[-4.5, 1.6, -9.1]}>
        <boxGeometry args={[21, 3.4, 0.3]} />
        <meshStandardMaterial color="#d8c7ad" roughness={0.92} />
      </mesh>
      {/* Left wall */}
      <mesh receiveShadow position={[-15.1, 1.6, -1.5]}>
        <boxGeometry args={[0.3, 3.4, 15.4]} />
        <meshStandardMaterial color="#cdbb9f" roughness={0.92} />
      </mesh>
      {/* Front wall – two segments leaving a central door gap */}
      <mesh receiveShadow position={[-8.3, 1.6, 6.1]}>
        <boxGeometry args={[13.6, 3.4, 0.3]} />
        <meshStandardMaterial color="#d8c7ad" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[3.6, 1.6, 6.1]}>
        <boxGeometry args={[4.8, 3.4, 0.3]} />
        <meshStandardMaterial color="#d8c7ad" roughness={0.92} />
      </mesh>
      {/* Door header over the entrance */}
      <mesh position={[0, 3.0, 6.1]}>
        <boxGeometry args={[2.6, 0.6, 0.3]} />
        <meshStandardMaterial color="#d8c7ad" roughness={0.92} />
      </mesh>

      {/* Kitchen | Living partition (with a wide doorway) */}
      <mesh receiveShadow position={[-5.5, 1.6, -5.0]}>
        <boxGeometry args={[0.3, 3.4, 8]} />
        <meshStandardMaterial color="#cdbb9f" roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[-5.5, 1.6, 4.2]}>
        <boxGeometry args={[0.3, 3.4, 3.8]} />
        <meshStandardMaterial color="#cdbb9f" roughness={0.92} />
      </mesh>
      {/* doorway header */}
      <mesh position={[-5.5, 3.0, 0.6]}>
        <boxGeometry args={[0.3, 0.6, 3.4]} />
        <meshStandardMaterial color="#cdbb9f" roughness={0.92} />
      </mesh>

      {/* Living | Outdoor glass wall (with a sliding-door gap) */}
      {[
        { z: -5.0, d: 8 },
        { z: 4.2, d: 3.8 },
      ].map((seg, i) => (
        <group key={`glass-${i}`} position={[6, 1.6, seg.z]}>
          {/* frame */}
          <mesh>
            <boxGeometry args={[0.12, 3.4, seg.d]} />
            <meshStandardMaterial color="#3a2c22" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* glass */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 3.0, seg.d - 0.2]} />
            <meshStandardMaterial color="#bfe3e8" transparent opacity={0.18} roughness={0.05} metalness={0.4} envMapIntensity={1.4} />
          </mesh>
        </group>
      ))}
      {/* glass door header */}
      <mesh position={[6, 3.0, 0.6]}>
        <boxGeometry args={[0.12, 0.6, 3.4]} />
        <meshStandardMaterial color="#3a2c22" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* ---------------- Soft warm fill lights (interior) ---------------- */}
      <pointLight position={[-10, 2.9, -3]} intensity={9} color="#ffd9a0" distance={11} decay={1.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[0, 2.9, -2]} intensity={10} color="#ffdca8" distance={12} decay={1.7} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[1, 2.9, 4]} intensity={5} color="#ffe6c0" distance={9} decay={1.8} />

      {/* ---------------- Zones ---------------- */}
      <KitchenZone />
      <LivingZone />
      <OutdoorZone />
    </group>
  );
}
