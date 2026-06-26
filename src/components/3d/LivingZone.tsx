"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import Model, { M, preload } from "./Model";

preload(M.fireplace, M.bookshelf, M.sofa, M.pillows, M.coffeeTable, M.lounge,
  M.cabinet, M.boombox, M.cat, M.vase, M.plant2);

// Tunable orientations (radians). Adjusted so each piece faces the room.
const ROT = {
  sofa: Math.PI,        // seat opens toward the fireplace (-z)
  lounge: 0,            // faces +z, toward the floating book
  cabinet: 0,
  bookshelf: 0,
};

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

    // Music: spin vinyl (if present) + rising notes
    const playing = music >= 100 || interactingId === "music";
    if (vinylRef.current) vinylRef.current.rotation.y += (playing ? 3.5 : 0) * 0.016;
    noteRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.5 + i * 0.5) % 1;
      m.position.set(Math.sin(t * 2 + i) * 0.3, 0.9 + frac * 1.0, 0.2 + Math.cos(i) * 0.2);
      m.rotation.z = Math.sin(t * 3 + i) * 0.4;
      m.scale.setScalar(playing ? (1 - frac) * 0.12 + 0.04 : 0);
    });

    // Cat: gentle sway + purr-bounce + hearts while petted
    const petting = interactingId === "cat" && cat < 100;
    if (catRef.current) {
      catRef.current.rotation.y = -0.3 + Math.sin(t * (petting ? 5 : 1)) * (petting ? 0.14 : 0.03);
      const purr = petting ? 1 + Math.sin(t * 22) * 0.02 : 1;
      catRef.current.scale.setScalar(purr);
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = 0.6 + Math.sin(t * (petting ? 7 : 2)) * (petting ? 0.5 : 0.15);
    }
    if (handRef.current) {
      handRef.current.visible = petting;
      if (petting) {
        const s = Math.sin(t * 3) * 0.5 + 0.5;
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

  return (
    <group>
      {/* ================= FIREPLACE — Scandinavian masonry heater ================= */}
      <Model url={M.fireplace} position={[-0.2, 0, -8.45]} rotation={[0, 0, 0]} />
      {/* live fire glowing in the firebox opening (front face ~ z -7.9) */}
      <group position={[-0.2, 0, -7.85]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.42, 0.05, 0.12]} />
          <meshStandardMaterial color="#ff5722" emissive="#ff4500" emissiveIntensity={2.4} />
        </mesh>
        <group position={[0, 0.54, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} ref={(el) => { if (el) flameRefs.current[i] = el; }} position={[-0.18 + i * 0.18, 0, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={["#f97316", "#ef4444", "#f59e0b"][i]} />
            </mesh>
          ))}
        </group>
        <pointLight position={[0, 0.7, 0.5]} intensity={4} color="#ff7a2a" distance={7} decay={1.7} />
      </group>

      {/* tall bookshelf against the back wall, left of the hearth */}
      <Model url={M.bookshelf} position={[-3.9, 0, -8.55]} rotation={[0, ROT.bookshelf, 0]} opaque />
      {/* rows of books filling the shelves so it doesn't read empty */}
      {[0.52, 0.97, 1.42, 1.87].map((y, row) =>
        Array.from({ length: 9 }).map((_, i) => {
          const colors = ["#7c2d12", "#1e3a5f", "#3f6212", "#7c3aed", "#9a3412", "#0f766e", "#b91c1c"];
          const h = 0.26 + ((i * 7 + row * 3) % 5) * 0.012;
          return (
            <mesh key={`bk-${row}-${i}`} position={[-4.42 + i * 0.105, y + h / 2, -8.42]} castShadow>
              <boxGeometry args={[0.085, h, 0.22]} />
              <meshStandardMaterial color={colors[(i + row * 3) % colors.length]} roughness={0.8} />
            </mesh>
          );
        })
      )}
      {/* vase as a shelf-top accent */}
      <Model url={M.vase} position={[-3.4, 2.05, -8.5]} scale={0.7} grounded={false} center />

      {/* ================= SOFA + throw pillows ================= */}
      <Model url={M.sofa} position={[1.0, 0, -2.4]} rotation={[0, ROT.sofa, 0]} />
      <Model url={M.pillows} position={[0.3, 0.46, -2.55]} rotation={[0, 0.5, 0]} grounded={false} center />

      {/* coffee table between sofa and fire */}
      <Model url={M.coffeeTable} position={[0.7, 0, -4.4]} rotation={[0, Math.PI / 2, 0]} />
      <Model url={M.vase} position={[0.55, 0.4, -4.4]} scale={0.55} grounded={false} center />

      {/* potted plant softening the corner */}
      <Model url={M.plant2} position={[4.6, 0, -3.0]} scale={1.1} />

      {/* ============ READING ARMCHAIR (station) ============ */}
      <Model url={M.lounge} position={[-1.4, 0, -5.6]} rotation={[0, ROT.lounge, 0]} />
      {/* open book floating where the reader holds it */}
      <group position={[-1.4, 0.78, -5.2]} rotation={[-0.5, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, 0.04, 0.24]} />
          <meshStandardMaterial ref={bookMatRef} color="#7c3aed" roughness={0.5} emissive="#a855f7" emissiveIntensity={0} />
        </mesh>
        <mesh ref={pageRef} position={[0, 0.03, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.2]} />
          <meshStandardMaterial color="#fdf6e3" roughness={0.6} />
        </mesh>
      </group>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`spark-${i}`} ref={(el) => { if (el) sparkRefs.current[i] = el; }} position={[-1.4, 0, -5.6]}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#d8b4fe" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* ============ MUSIC (station) — boombox on a console ============ */}
      <Model url={M.cabinet} position={[3.6, 0, -8.45]} rotation={[0, ROT.cabinet, 0]} />
      <Model url={M.boombox} position={[3.6, 1.58, -8.4]} rotation={[0, 0.05, 0]} grounded={false} center />
      {/* rising music notes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`note-${i}`} ref={(el) => { if (el) noteRefs.current[i] = el; }} position={[3.6, 1.7, -8.3]}>
          <boxGeometry args={[1, 1, 0.2]} />
          <meshBasicMaterial color="#fda4af" />
        </mesh>
      ))}

      {/* ============ CAT (station) — concrete cat on its bed ============ */}
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
        {/* the cat — animated group wraps the real model */}
        <group ref={catRef} position={[0, 0.13, 0]} rotation={[0, -0.3, 0]}>
          <Model url={M.cat} position={[0, 0, 0]} scale={1.5} />
        </group>

        {/* petting hand (appears while you stroke the cat) */}
        <group ref={handRef} position={[0, 0.34, 0.02]} visible={false}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.04, 0.15]} />
            <meshStandardMaterial color="#e8b48f" roughness={0.7} />
          </mesh>
          {[-0.04, -0.013, 0.013, 0.04].map((x, i) => (
            <mesh key={i} position={[x, -0.02, -0.1]} rotation={[0.6, 0, 0]} castShadow>
              <boxGeometry args={[0.022, 0.022, 0.09]} />
              <meshStandardMaterial color="#e8b48f" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0.07, -0.01, -0.02]} rotation={[0.3, 0, -0.5]} castShadow>
            <boxGeometry args={[0.02, 0.02, 0.07]} />
            <meshStandardMaterial color="#e8b48f" roughness={0.7} />
          </mesh>
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
