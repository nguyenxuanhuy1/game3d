"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

export default function LivingZone() {
  const flameRefs = useRef<THREE.Mesh[]>([]);
  const vinylRef = useRef<THREE.Mesh>(null);
  const noteRefs = useRef<THREE.Mesh[]>([]);
  const bookMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pageRef = useRef<THREE.Mesh>(null);
  const sparkRefs = useRef<THREE.Mesh[]>([]);
  const heartRefs = useRef<THREE.Mesh[]>([]);
  const catRef = useRef<THREE.Group>(null);
  const handRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { progress, interactingId } = useGameStore.getState();
    const read = progress.read ?? 0;
    const music = progress.music ?? 0;
    const cat = progress.cat ?? 0;

    // Fireplace flicker
    flameRefs.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = 0.12 + Math.sin(t * (6 + i) + i) * 0.05;
      m.scale.setScalar(0.6 + Math.abs(Math.cos(t * (5 + i))) * 0.3);
    });

    // Reading: page flutter + calm sparkles
    const reading = interactingId === "read" && read < 100;
    if (pageRef.current) pageRef.current.rotation.x = reading ? Math.sin(t * 5) * 0.25 - 0.2 : -0.1;
    if (bookMatRef.current) bookMatRef.current.emissiveIntensity = (read / 100) * 0.4 + (reading ? 0.2 : 0);
    sparkRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.3 + i * 0.4) % 1;
      m.position.set(Math.sin(t + i) * 0.2, 0.7 + frac * 0.7, 0.1 + Math.cos(t + i) * 0.1);
      m.scale.setScalar((reading || read >= 100) ? (1 - frac) * 0.025 : 0);
    });

    // Music: spin vinyl + rising notes
    const playing = music >= 100 || interactingId === "music";
    if (vinylRef.current) vinylRef.current.rotation.y += (playing ? 3.5 : 0) * 0.016;
    noteRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.5 + i * 0.5) % 1;
      m.position.set(Math.sin(t * 2 + i) * 0.3, 0.9 + frac * 1.0, 0.2 + Math.cos(i) * 0.2);
      m.rotation.z = Math.sin(t * 3 + i) * 0.4;
      m.scale.setScalar(playing ? (1 - frac) * 0.12 + 0.04 : 0);
    });

    // Cat: stroke with the hand + happy wiggle + purr + hearts
    const petting = interactingId === "cat" && cat < 100;
    if (catRef.current) {
      // gentle sway when idle, happy wiggle + tiny purr-bounce while petted
      catRef.current.rotation.y = -0.3 + Math.sin(t * (petting ? 5 : 1)) * (petting ? 0.14 : 0.03);
      const purr = petting ? 1 + Math.sin(t * 22) * 0.02 : 1;
      catRef.current.scale.setScalar(purr);
    }
    if (tailRef.current) {
      // tail flicks happily while being stroked
      tailRef.current.rotation.z = 0.6 + Math.sin(t * (petting ? 7 : 2)) * (petting ? 0.5 : 0.15);
    }
    if (handRef.current) {
      handRef.current.visible = petting;
      if (petting) {
        const s = Math.sin(t * 3) * 0.5 + 0.5; // 0..1 stroke head→tail
        handRef.current.position.set(0.16 - s * 0.34, 0.34 + Math.sin(t * 6) * 0.015, 0.02);
        handRef.current.rotation.z = -0.2 + Math.sin(t * 3) * 0.12;
      }
    }
    heartRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.6 + i * 0.5) % 1;
      m.position.set(Math.sin(t + i) * 0.15, 0.3 + frac * 0.6, Math.cos(t + i) * 0.1);
      m.scale.setScalar(petting || cat >= 100 ? (1 - frac) * 0.06 : 0);
    });
  });

  const cushion = <meshStandardMaterial color="#c98a5a" roughness={0.85} />;
  const woodDark = <meshStandardMaterial color="#4a3526" roughness={0.6} />;

  return (
    <group>
      {/* ================= FIREPLACE (decor) ================= */}
      <group position={[0, 0, -8.7]}>
        <mesh position={[0, 0.7, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 1.4, 0.5]} />
          <meshStandardMaterial color="#8a6a4f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.45, 0.25]} castShadow>
          <boxGeometry args={[2.3, 0.14, 0.6]} />
          {woodDark}
        </mesh>
        {/* firebox */}
        <mesh position={[0, 0.45, 0.35]}>
          <boxGeometry args={[1.1, 0.8, 0.2]} />
          <meshStandardMaterial color="#1a1410" roughness={1} />
        </mesh>
        {/* embers */}
        <mesh position={[0, 0.12, 0.42]}>
          <boxGeometry args={[1.0, 0.05, 0.2]} />
          <meshStandardMaterial color="#ff5722" emissive="#ff4500" emissiveIntensity={2.2} />
        </mesh>
        <group position={[0, 0.16, 0.42]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} ref={(el) => { if (el) flameRefs.current[i] = el; }} position={[-0.25 + i * 0.25, 0, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color={["#f97316", "#ef4444", "#f59e0b"][i]} />
            </mesh>
          ))}
        </group>
        <pointLight position={[0, 0.5, 0.7]} intensity={4} color="#ff7a2a" distance={7} decay={1.7} />
      </group>

      {/* ================= SOFA ================= */}
      <group position={[1.0, 0, -3.0]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.3, 0.95]} />
          {woodDark}
        </mesh>
        <mesh position={[-0.55, 0.5, 0]} castShadow>
          <boxGeometry args={[1.0, 0.25, 0.85]} />
          {cushion}
        </mesh>
        <mesh position={[0.55, 0.5, 0]} castShadow>
          <boxGeometry args={[1.0, 0.25, 0.85]} />
          {cushion}
        </mesh>
        <mesh position={[0, 0.7, -0.4]} castShadow>
          <boxGeometry args={[2.2, 0.5, 0.18]} />
          {cushion}
        </mesh>
        {[-1.05, 1.05].map((x, i) => (
          <mesh key={i} position={[x, 0.55, 0]} castShadow>
            <boxGeometry args={[0.12, 0.4, 0.85]} />
            <meshStandardMaterial color="#a9714a" roughness={0.85} />
          </mesh>
        ))}
        {/* throw pillow */}
        <mesh position={[-0.5, 0.62, 0.18]} rotation={[0.1, 0.3, -0.2]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="#7c2d12" roughness={0.8} />
        </mesh>
      </group>

      {/* Coffee table */}
      <group position={[0.6, 0, -4.6]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 28]} />
          <meshStandardMaterial color="#caa37a" roughness={0.4} metalness={0.1} />
        </mesh>
        {[[0.35, 0.3], [-0.35, 0.3], [0.35, -0.3], [-0.35, -0.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            {woodDark}
          </mesh>
        ))}
      </group>

      {/* ============ READING ARMCHAIR (station) ============ */}
      <group position={[-1.4, 0, -5.6]}>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.3, 0.85]} />
          {cushion}
        </mesh>
        <mesh position={[0, 0.6, -0.36]} castShadow>
          <boxGeometry args={[0.9, 0.55, 0.16]} />
          {cushion}
        </mesh>
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0]} castShadow>
            <boxGeometry args={[0.12, 0.35, 0.8]} />
            <meshStandardMaterial color="#a9714a" roughness={0.85} />
          </mesh>
        ))}
        {/* open book floating in lap */}
        <group position={[0, 0.7, 0.18]} rotation={[-0.5, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.04, 0.24]} />
            <meshStandardMaterial ref={bookMatRef} color="#7c3aed" roughness={0.5} emissive="#a855f7" emissiveIntensity={0} />
          </mesh>
          <mesh ref={pageRef} position={[0, 0.03, 0]}>
            <boxGeometry args={[0.28, 0.01, 0.2]} />
            <meshStandardMaterial color="#fdf6e3" roughness={0.6} />
          </mesh>
        </group>
        {/* calm sparkles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) sparkRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#d8b4fe" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* ============ RECORD PLAYER (station) ============ */}
      <group position={[3.6, 0, -8.5]}>
        {/* console */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.8, 0.5]} />
          {woodDark}
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <boxGeometry args={[1.0, 0.06, 0.4]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* vinyl */}
        <mesh ref={vinylRef} position={[-0.15, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.01, 32]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[-0.15, 0.87, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.012, 24]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {/* tonearm */}
        <mesh position={[0.0, 0.88, -0.12]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[0.22, 0.012, 0.012]} />
          <meshStandardMaterial color="#c0c0c8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* music notes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) noteRefs.current[i] = el; }}>
            <boxGeometry args={[1, 1, 0.2]} />
            <meshBasicMaterial color="#fda4af" />
          </mesh>
        ))}
      </group>

      {/* ============ CAT + BOWL (station) ============ */}
      <group position={[-2.6, 0, 2.6]}>
        {/* round cat bed */}
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <cylinderGeometry args={[0.42, 0.46, 0.12, 24]} />
          <meshStandardMaterial color="#b45f3a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 24]} />
          <meshStandardMaterial color="#e6c9a8" roughness={0.95} />
        </mesh>
        {/* cat (curled, simple) */}
        <group ref={catRef} position={[0, 0.18, 0]} rotation={[0, -0.3, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.85} />
          </mesh>
          <mesh position={[0.16, 0.1, 0.05]} castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.85} />
          </mesh>
          {/* ears */}
          <mesh position={[0.12, 0.2, 0.0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.035, 0.07, 8]} />
            <meshStandardMaterial color="#2a2a2e" />
          </mesh>
          <mesh position={[0.2, 0.2, 0.08]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.035, 0.07, 8]} />
            <meshStandardMaterial color="#2a2a2e" />
          </mesh>
          {/* tail (flicks happily while petted) */}
          <mesh ref={tailRef} position={[-0.18, 0.02, -0.05]} rotation={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.025, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#3a3a3e" roughness={0.85} />
          </mesh>
          {/* eyes (content, closed-ish) */}
          <mesh position={[0.24, 0.12, 0.02]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#101012" roughness={0.4} />
          </mesh>
          <mesh position={[0.24, 0.12, 0.1]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#101012" roughness={0.4} />
          </mesh>
        </group>

        {/* petting hand (appears while you stroke the cat) */}
        <group ref={handRef} position={[0, 0.34, 0.02]} visible={false}>
          {/* back of hand */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.04, 0.15]} />
            <meshStandardMaterial color="#e8b48f" roughness={0.7} />
          </mesh>
          {/* fingers */}
          {[-0.04, -0.013, 0.013, 0.04].map((x, i) => (
            <mesh key={i} position={[x, -0.02, -0.1]} rotation={[0.6, 0, 0]} castShadow>
              <boxGeometry args={[0.022, 0.022, 0.09]} />
              <meshStandardMaterial color="#e8b48f" roughness={0.7} />
            </mesh>
          ))}
          {/* thumb */}
          <mesh position={[0.07, -0.01, -0.02]} rotation={[0.3, 0, -0.5]} castShadow>
            <boxGeometry args={[0.02, 0.02, 0.07]} />
            <meshStandardMaterial color="#e8b48f" roughness={0.7} />
          </mesh>
          {/* wrist */}
          <mesh position={[0, 0.0, 0.12]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.05, 0.12, 12]} />
            <meshStandardMaterial color="#caa07a" roughness={0.7} />
          </mesh>
        </group>

        {/* food bowl (decor) */}
        <group position={[0.5, 0, 0.1]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.1, 0.08, 0.06, 16]} />
            <meshStandardMaterial color="#0ea5e9" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.03, 16]} />
            <meshStandardMaterial color="#a16207" roughness={0.9} />
          </mesh>
        </group>
        {/* hearts */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) heartRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#fb7185" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
