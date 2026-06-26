"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// A first-person pressure-washer the player "holds". It appears in the lower
// right of the screen while washing the motorbike and fires a pressurized fan
// of water + droplet streaks straight at whatever the camera is pointed at, so
// the player literally aims the jet at the bike to clean it.
//
// The whole rig is re-anchored to the camera every frame (the default R3F
// camera isn't part of the scene graph, so we can't simply parent to it). All
// child coordinates are therefore in *camera space*: -Z is forward / into the
// screen, +X right, +Y up.

const JET_COUNT = 18; // droplet streaks
const MIST_COUNT = 7; // soft mist puffs near the nozzle

// Nozzle muzzle position in camera space and the direction the jet travels.
const MUZZLE = new THREE.Vector3(0.3, -0.26, -0.82);
const JET_DIR = new THREE.Vector3(-0.05, 0.06, -1).normalize();

export default function SprayHose() {
  const { camera } = useThree();
  const interactingId = useGameStore((s) => s.interactingId);
  const washing = interactingId === "bike";

  const rigRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  const coneMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const jetRefs = useRef<THREE.Mesh[]>([]);
  const mistRefs = useRef<THREE.Mesh[]>([]);
  const triggerPull = useRef(0);

  // Per-droplet random offsets (stable across frames) for a natural fan spread.
  const drops = useMemo(
    () =>
      Array.from({ length: JET_COUNT }).map((_, i) => ({
        phase: i / JET_COUNT,
        spread: new THREE.Vector3(
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.12,
          0
        ),
        speed: 0.9 + Math.random() * 0.5,
      })),
    []
  );
  const mist = useMemo(
    () =>
      Array.from({ length: MIST_COUNT }).map((_, i) => ({
        phase: i / MIST_COUNT,
        off: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.08,
          0
        ),
      })),
    []
  );

  // Reusable orientation so the spray cone aligns with the jet direction.
  const coneQuat = useMemo(() => {
    const q = new THREE.Quaternion();
    // cone's default axis is +Y; aim it down the jet direction
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), JET_DIR);
    return q;
  }, []);

  useFrame((state, delta) => {
    const rig = rigRef.current;
    if (!rig) return;

    // Smoothly fade the rig in/out (a touch of inertia feels handheld).
    triggerPull.current = THREE.MathUtils.lerp(
      triggerPull.current,
      washing ? 1 : 0,
      Math.min(1, delta * 10)
    );
    const on = triggerPull.current;
    rig.visible = on > 0.01;
    if (!rig.visible) return;

    // Re-anchor the rig to the camera (camera-space viewmodel).
    rig.position.copy(camera.position);
    rig.quaternion.copy(camera.quaternion);

    const t = state.clock.getElapsedTime();
    // Subtle handheld sway + recoil while the trigger is held.
    const sway = on * 0.012;
    rig.translateX(Math.sin(t * 2.3) * sway);
    rig.translateY(Math.cos(t * 3.1) * sway - (1 - on) * 0.25);

    // Spray cone flicker.
    if (coneRef.current && coneMatRef.current) {
      coneRef.current.quaternion.copy(coneQuat);
      const flick = 0.85 + Math.sin(t * 40) * 0.15;
      coneRef.current.scale.set(on, on * flick, on);
      coneMatRef.current.opacity = 0.16 * on * flick;
    }

    // Droplet streaks racing along the jet.
    jetRefs.current.forEach((m, i) => {
      if (!m) return;
      const d = drops[i];
      const frac = (t * d.speed + d.phase) % 1;
      const dist = frac * 3.4; // travel distance from the muzzle
      m.position
        .copy(MUZZLE)
        .addScaledVector(JET_DIR, dist)
        .addScaledVector(d.spread, dist * 6); // fan widens with distance
      const s = on * (0.018 + frac * 0.02);
      m.scale.set(s * 0.5, s * 0.5, s * (2.5 + frac * 4)); // stretched along travel
      m.quaternion.copy(coneQuat);
    });

    // Nozzle mist puffs.
    mistRefs.current.forEach((m, i) => {
      if (!m) return;
      const mm = mist[i];
      const frac = (t * 1.6 + mm.phase) % 1;
      m.position
        .copy(MUZZLE)
        .addScaledVector(JET_DIR, frac * 0.5)
        .add(mm.off);
      m.scale.setScalar(on * (1 - frac) * 0.06);
    });
  });

  const metal = (
    <meshStandardMaterial color="#1f2937" roughness={0.35} metalness={0.7} envMapIntensity={1.2} />
  );

  return (
    <group ref={rigRef} visible={false}>
      {/* ---------------- Spray gun viewmodel ---------------- */}
      {/* grip */}
      <mesh position={[0.3, -0.42, -0.5]} rotation={[0.35, 0, 0.12]}>
        <boxGeometry args={[0.05, 0.18, 0.07]} />
        {metal}
      </mesh>
      {/* trigger guard */}
      <mesh position={[0.3, -0.34, -0.55]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.045, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* body */}
      <mesh position={[0.3, -0.29, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.06, 0.22, 0.08]} />
        {metal}
      </mesh>
      {/* barrel — points forward (−Z) into the screen */}
      <mesh position={[0.3, -0.27, -0.72]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.26, 16]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* chrome nozzle tip */}
      <mesh position={MUZZLE.toArray()} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.02, 0.05, 16]} />
        <meshStandardMaterial color="#e8eaf0" roughness={0.12} metalness={1} envMapIntensity={1.4} />
      </mesh>
      {/* hose trailing off-screen */}
      <mesh position={[0.34, -0.55, -0.45]} rotation={[0.6, 0, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 10]} />
        <meshStandardMaterial color="#155e75" roughness={0.7} />
      </mesh>

      {/* ---------------- Water jet ---------------- */}
      {/* translucent pressurized fan */}
      <mesh ref={coneRef} position={MUZZLE.clone().addScaledVector(JET_DIR, 1.7).toArray()}>
        <coneGeometry args={[0.45, 3.4, 18, 1, true]} />
        <meshBasicMaterial
          ref={coneMatRef}
          color="#cdeeff"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* droplet streaks */}
      {Array.from({ length: JET_COUNT }).map((_, i) => (
        <mesh key={`jet-${i}`} ref={(el) => { if (el) jetRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#dff4ff" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      ))}
      {/* nozzle mist */}
      {Array.from({ length: MIST_COUNT }).map((_, i) => (
        <mesh key={`mist-${i}`} ref={(el) => { if (el) mistRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
