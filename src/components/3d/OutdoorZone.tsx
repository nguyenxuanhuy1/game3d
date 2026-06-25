"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// Mud spots on the bike (local to the bike group), cleaned in order as progress rises.
const BIKE_SPOTS: [number, number, number][] = [
  [0.62, 0.62, 0.16],
  [0.2, 0.74, 0.18],
  [-0.26, 0.76, 0.16],
  [-0.02, 0.42, 0.2],
  [-0.62, 0.5, 0.18],
  [0.62, 0.34, 0.2],
];

export default function OutdoorZone() {
  const plantRef = useRef<THREE.Group>(null);
  const soilMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const dropRefs = useRef<THREE.Mesh[]>([]);
  const bikeSpotRefs = useRef<THREE.Mesh[]>([]);
  const foamRefs = useRef<THREE.Mesh[]>([]);
  const sprayRefs = useRef<THREE.Mesh[]>([]);
  const shineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { progress, interactingId } = useGameStore.getState();
    const plant = progress.plant ?? 0;
    const bike = progress.bike ?? 0;

    // ----- Plant growth + watering -----
    const watering = interactingId === "plant" && plant < 100;
    if (plantRef.current) {
      const g = 0.5 + (plant / 100) * 0.7;
      plantRef.current.scale.setScalar(THREE.MathUtils.lerp(plantRef.current.scale.x, g, 0.05));
      plantRef.current.rotation.z = Math.sin(t * 1.2) * 0.04;
    }
    if (soilMatRef.current) {
      soilMatRef.current.color.set("#5b3a1a").lerp(new THREE.Color("#2c1a0a"), plant / 100);
    }
    if (flowerRef.current) flowerRef.current.visible = plant >= 100;
    dropRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 1.1 + i * 0.2) % 1;
      m.position.set(Math.sin(i * 3) * 0.18, 1.5 - frac * 1.0, Math.cos(i * 2) * 0.18);
      m.scale.setScalar(watering ? 0.025 : 0);
    });

    // ----- Bike: clean spots, foam/spray, shine -----
    const washing = interactingId === "bike" && bike < 100;
    bikeSpotRefs.current.forEach((m, i) => {
      if (m) m.visible = bike < ((i + 1) / BIKE_SPOTS.length) * 100;
    });
    foamRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.8 + i * 0.3) % 1;
      m.position.set(Math.sin(i * 4) * 0.5, 0.6 + frac * 0.5, Math.cos(i * 3) * 0.25);
      m.scale.setScalar(washing ? (1 - frac) * 0.05 + 0.01 : 0);
    });
    sprayRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 1.4 + i * 0.25) % 1;
      m.position.set(Math.sin(t * 3 + i) * 0.5, 1.0 - frac * 0.6, Math.cos(i) * 0.3);
      m.scale.setScalar(washing ? 0.02 : 0);
    });
    if (shineRef.current) {
      const mat = shineRef.current.material as THREE.MeshBasicMaterial;
      if (bike >= 100) {
        const sweep = Math.sin(t * 1.2) * 0.5 + 0.5;
        shineRef.current.position.x = -1.0 + sweep * 2.0;
        mat.opacity = 0.35 * (1 - Math.abs(sweep - 0.5) * 1.6);
      } else mat.opacity = 0;
    }
  });

  const chrome = <meshStandardMaterial color="#e8eaf0" roughness={0.12} metalness={1} envMapIntensity={1.4} />;
  const paint = <meshStandardMaterial color="#c2410c" roughness={0.13} metalness={0.6} envMapIntensity={1.3} />;

  return (
    <group>
      {/* ---- Grass ground ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.004, -1.5]} receiveShadow>
        <planeGeometry args={[8.2, 15.4]} />
        <meshStandardMaterial color="#3f7a34" roughness={0.95} />
      </mesh>
      {/* stone path from the glass door */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, (i % 2 ? 0.2 : -0.2)]} position={[6.8 + i * 0.85, 0.014, 0.5]} receiveShadow>
          <cylinderGeometry args={[0.34, 0.36, 0.03, 8]} />
          <meshStandardMaterial color="#8a8275" roughness={0.9} />
        </mesh>
      ))}

      {/* ---- Low garden fence ---- */}
      {[-9, 6].map((z, zi) => (
        <group key={`fz-${zi}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[6.4 + i * 1.0, 0.5, z]} castShadow>
              <boxGeometry args={[0.1, 1.0, 0.1]} />
              <meshStandardMaterial color="#8a6a4a" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`fx-${i}`} position={[14, 0.5, -8.5 + i * 1.9]} castShadow>
          <boxGeometry args={[0.1, 1.0, 0.1]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.85} />
        </mesh>
      ))}

      {/* drifting pollen */}
      <Sparkles count={50} scale={[7, 4, 13]} position={[10, 2, -1.5]} size={2} speed={0.25} opacity={0.6} color="#ffe9b0" />

      {/* shrubs */}
      {[[7.5, -8], [13, -7.5], [12.5, 4.5], [7.2, 5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} castShadow>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial color={i % 2 ? "#2f6b30" : "#3b7a3a"} roughness={0.85} />
        </mesh>
      ))}

      {/* ============ PLANT STATION ============ */}
      <group position={[10.2, 0, -5.6]}>
        {/* pot */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.22, 0.5, 24]} />
          <meshStandardMaterial color="#b06a43" roughness={0.5} metalness={0.15} envMapIntensity={1.1} />
        </mesh>
        <mesh position={[0, 0.49, 0]}>
          <cylinderGeometry args={[0.32, 0.31, 0.06, 24]} />
          <meshStandardMaterial color="#c47a4f" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.29, 24]} />
          <meshStandardMaterial ref={soilMatRef} color="#5b3a1a" roughness={0.95} />
        </mesh>
        {/* growing body */}
        <group ref={plantRef} position={[0, 0.52, 0]} scale={0.5}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 0.72, 8]} />
            <meshStandardMaterial color="#3a7d2c" roughness={0.6} />
          </mesh>
          {[
            { p: [-0.16, 0.34, 0.04], r: [0.3, 0.2, Math.PI / 4], s: 0.16, c: "#43a047" },
            { p: [0.16, 0.46, -0.04], r: [-0.3, -0.2, -Math.PI / 4], s: 0.14, c: "#4caf50" },
            { p: [-0.04, 0.58, 0.16], r: [0.4, 0.6, 0.2], s: 0.12, c: "#5cb85c" },
            { p: [0.1, 0.24, -0.14], r: [-0.5, 0.3, -0.3], s: 0.11, c: "#3a9d3a" },
          ].map((leaf, i) => (
            <mesh key={i} position={leaf.p as [number, number, number]} rotation={leaf.r as [number, number, number]} scale={[1, 0.4, 1]} castShadow>
              <sphereGeometry args={[leaf.s, 10, 10]} />
              <meshStandardMaterial color={leaf.c} roughness={0.5} />
            </mesh>
          ))}
          {/* blossom (visibility toggled in useFrame) */}
          <group ref={flowerRef} position={[0, 0.78, 0]} visible={false}>
            <Float speed={3} floatIntensity={0.3} rotationIntensity={0.2}>
              <mesh castShadow>
                <sphereGeometry args={[0.13, 16, 16]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} roughness={0.3} />
              </mesh>
              {Array.from({ length: 10 }).map((_, i) => {
                const a = (i * Math.PI * 2) / 10;
                return (
                  <mesh key={i} position={[Math.sin(a) * 0.13, 0.02, Math.cos(a) * 0.13]} rotation={[0.5, a, 0]} scale={[1, 0.3, 1.4]} castShadow>
                    <sphereGeometry args={[0.09, 10, 10]} />
                    <meshStandardMaterial color="#fb7185" roughness={0.4} emissive="#e11d48" emissiveIntensity={0.15} />
                  </mesh>
                );
              })}
            </Float>
          </group>
        </group>
        {/* watering droplets */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) dropRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.5} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* ============ CARPORT + MOTORBIKE STATION ============ */}
      {/* carport roof */}
      <group position={[10.8, 0, 1.0]}>
        <mesh position={[0, 2.4, 0]} castShadow>
          <boxGeometry args={[3.0, 0.1, 3.0]} />
          <meshStandardMaterial color="#5a4533" roughness={0.8} />
        </mesh>
        {[[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.2, z]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 10]} />
            <meshStandardMaterial color="#4a3526" roughness={0.8} />
          </mesh>
        ))}
        <pointLight position={[0, 2.2, 0]} intensity={5} color="#ffd9a0" distance={6} decay={1.8} />

        {/* paving under bike */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
          <planeGeometry args={[2.8, 2.8]} />
          <meshStandardMaterial color="#6b6358" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* ----- the motorbike (profile faces -Z toward the door) ----- */}
        <group position={[0, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
            <planeGeometry args={[1.9, 0.7]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.3} />
          </mesh>
          {[-0.62, 0.62].map((x, wi) => (
            <group key={wi} position={[x, 0.34, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[0.28, 0.075, 16, 32]} />
                <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.21, 0.21, 0.05, 24]} />
                <meshStandardMaterial color="#26262b" roughness={0.4} metalness={0.7} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
                <cylinderGeometry args={[0.07, 0.07, 0.07, 16]} />
                {chrome}
              </mesh>
              {Array.from({ length: 6 }).map((_, s) => (
                <mesh key={s} rotation={[0, 0, (s * Math.PI) / 3]}>
                  <boxGeometry args={[0.4, 0.018, 0.018]} />
                  {chrome}
                </mesh>
              ))}
            </group>
          ))}
          {/* engine */}
          <mesh position={[-0.02, 0.4, 0]} castShadow>
            <boxGeometry args={[0.5, 0.34, 0.34]} />
            <meshStandardMaterial color="#3b3b42" roughness={0.35} metalness={0.85} envMapIntensity={1.2} />
          </mesh>
          {/* tank */}
          <mesh position={[0.2, 0.74, 0]} castShadow>
            <sphereGeometry args={[0.26, 24, 16]} />
            {paint}
          </mesh>
          {/* seat */}
          <mesh position={[-0.32, 0.72, 0]} castShadow>
            <boxGeometry args={[0.62, 0.12, 0.26]} />
            <meshStandardMaterial color="#1b1714" roughness={0.7} />
          </mesh>
          <mesh position={[-0.1, 0.62, 0]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.7, 0.05, 0.05]} />
            {chrome}
          </mesh>
          {/* front fork + headlight + bar */}
          <group position={[0.62, 0, 0]}>
            <mesh position={[0, 0.62, 0.08]} rotation={[0, 0, 0.25]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.62, 12]} />
              {chrome}
            </mesh>
            <mesh position={[0, 0.62, -0.08]} rotation={[0, 0, 0.25]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.62, 12]} />
              {chrome}
            </mesh>
            <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.3, 0.04, 8, 24, Math.PI * 0.7]} />
              {paint}
            </mesh>
            <mesh position={[0.12, 0.86, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.1, 24]} />
              <meshStandardMaterial color="#2a2a2e" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.18, 0.86, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 24]} />
              <meshBasicMaterial color="#fff4d6" />
            </mesh>
            <mesh position={[0.02, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.56, 12]} />
              {chrome}
            </mesh>
          </group>
          {/* rear fender + taillight */}
          <mesh position={[-0.62, 0.6, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
            <torusGeometry args={[0.3, 0.04, 8, 24, Math.PI * 0.6]} />
            {paint}
          </mesh>
          <mesh position={[-0.92, 0.6, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.14]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* exhaust */}
          <mesh position={[0.0, 0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.1, 16]} />
            {chrome}
          </mesh>
          {/* mud spots */}
          {BIKE_SPOTS.map((p, i) => (
            <mesh key={i} position={p} ref={(el) => { if (el) bikeSpotRefs.current[i] = el; }}>
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshStandardMaterial color="#5b3618" roughness={0.98} />
            </mesh>
          ))}
        </group>

        {/* shine sweep handled in useFrame */}
        <mesh ref={shineRef} position={[0, 0.7, 0]} rotation={[0, 0, 0.3]}>
          <planeGeometry args={[0.18, 1.0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* soapy bucket */}
        <Float speed={2} floatIntensity={0.2} rotationIntensity={0.2}>
          <group position={[-1.2, 0.18, 0.9]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.17, 0.13, 0.32, 20]} />
              <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.1, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} transparent opacity={0.85} />
            </mesh>
          </group>
        </Float>

        {/* foam + spray pools */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`foam-${i}`} ref={(el) => { if (el) foamRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#ecfeff" roughness={0.02} metalness={0.1} transparent opacity={0.75} />
          </mesh>
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`spray-${i}`} ref={(el) => { if (el) sprayRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#bdecff" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* sparkles when bike is spotless */}
      <BikeCleanSparkles />
    </group>
  );
}

function BikeCleanSparkles() {
  const bike = useGameStore((s) => s.progress.bike ?? 0);
  if (bike < 100) return null;
  return <Sparkles count={36} scale={[2.4, 1.8, 2.4]} position={[10.8, 0.9, 1.0]} size={3} speed={0.4} color="#ffe6b0" />;
}
