"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// A satisfying firewood-chopping station (in the relaxing spirit of
// screen.toys/firewood, but built from scratch to match this scene's style).
// Hold the mouse while standing close: the axe swings down in a loop, the
// standing log shaves down, wood chips burst on each strike, and a pile of
// split firewood grows beside the block.

const PILE: { p: [number, number, number]; r: [number, number, number]; c: string }[] = [
  { p: [0.8, 0.08, 0.12], r: [0, 0.3, Math.PI / 2], c: "#9a6b3f" },
  { p: [0.96, 0.08, -0.06], r: [0, -0.2, Math.PI / 2], c: "#8a5e36" },
  { p: [0.7, 0.08, -0.2], r: [0, 0.1, Math.PI / 2], c: "#90613a" },
  { p: [1.06, 0.08, 0.16], r: [0, -0.5, Math.PI / 2], c: "#a4744a" },
  { p: [0.85, 0.21, 0.02], r: [0, 0.6, Math.PI / 2], c: "#a4744a" },
  { p: [1.0, 0.21, -0.12], r: [0, 0.2, Math.PI / 2], c: "#90613a" },
  { p: [0.78, 0.21, -0.18], r: [0, -0.3, Math.PI / 2], c: "#86592f" },
  { p: [0.92, 0.33, -0.04], r: [0, 0.4, Math.PI / 2], c: "#9a6b3f" },
];

export default function FirewoodStation() {
  const axeRef = useRef<THREE.Group>(null);
  const logRef = useRef<THREE.Mesh>(null);
  const pileRefs = useRef<THREE.Mesh[]>([]);
  const chipRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const { progress, interactingId } = useGameStore.getState();
    const fire = progress.firewood ?? 0;
    const chopping = interactingId === "firewood" && fire < 100;
    const swing = Math.sin(t * 7);

    // Axe swing: looped chop while working, raised & resting otherwise.
    if (axeRef.current) {
      const target = chopping ? 0.3 + swing * 0.6 : 0.6;
      axeRef.current.rotation.x = THREE.MathUtils.lerp(
        axeRef.current.rotation.x,
        target,
        chopping ? 0.5 : 0.08
      );
    }

    // Standing log shaves down as it's chopped (base stays on the block top).
    if (logRef.current) {
      const h = Math.max(0.04, 1 - fire / 100);
      logRef.current.scale.y = h;
      logRef.current.position.y = 0.5 + (0.5 * h) / 2;
    }

    // Split-log pile grows as progress climbs.
    pileRefs.current.forEach((m, i) => {
      if (m) m.visible = fire > ((i + 1) / PILE.length) * 100 - 6;
    });

    // Wood chips burst at the bottom of each strike.
    const striking = chopping && swing < -0.45;
    chipRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 2.4 + i * 0.17) % 1;
      m.position.set(
        Math.sin(i * 2.1) * 0.34 * frac,
        0.82 - frac * 0.72,
        0.05 + Math.cos(i * 3.3) * 0.32 * frac
      );
      m.rotation.set(t * 4 + i, t * 3 + i, 0);
      m.scale.setScalar(striking ? (1 - frac) * 0.045 : 0);
    });

    // (delta kept for symmetry with other stations; swing is time-driven)
    void delta;
  });

  const bark = <meshStandardMaterial color="#7a5230" roughness={0.85} />;

  return (
    <group position={[8.0, 0, 4.0]}>
      {/* chopping block (tree stump) */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.5, 20]} />
        {bark}
      </mesh>
      {/* lighter cut top with rings */}
      <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 20]} />
        <meshStandardMaterial color="#c79a63" roughness={0.8} />
      </mesh>
      {[0.1, 0.2, 0.3].map((r, i) => (
        <mesh key={i} position={[0, 0.503, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r, r + 0.012, 24]} />
          <meshBasicMaterial color="#8a6238" />
        </mesh>
      ))}

      {/* standing log to be chopped */}
      <mesh ref={logRef} position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.5, 16]} />
        {bark}
      </mesh>
      {/* log top end-grain */}
      <mesh position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 16]} />
        <meshStandardMaterial color="#d8af74" roughness={0.8} />
      </mesh>

      {/* split firewood pile */}
      {PILE.map((log, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) pileRefs.current[i] = el; }}
          position={log.p}
          rotation={log.r}
          visible={false}
          castShadow
        >
          <cylinderGeometry args={[0.07, 0.07, 0.42, 10]} />
          <meshStandardMaterial color={log.c} roughness={0.85} />
        </mesh>
      ))}

      {/* axe (pivots above the log and swings down) */}
      <group ref={axeRef} position={[0, 1.05, 0.42]} rotation={[0.6, 0, 0]}>
        {/* handle */}
        <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.62, 10]} />
          <meshStandardMaterial color="#8a5a2c" roughness={0.7} />
        </mesh>
        {/* axe head */}
        <group position={[0, 0, -0.6]}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.17, 0.1]} />
            <meshStandardMaterial color="#3a3d44" roughness={0.35} metalness={0.85} envMapIntensity={1.2} />
          </mesh>
          {/* blade edge */}
          <mesh position={[0, -0.11, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.05, 0.12, 4]} />
            <meshStandardMaterial color="#c3c7cf" roughness={0.2} metalness={0.9} envMapIntensity={1.4} />
          </mesh>
        </group>
      </group>

      {/* flying wood chips */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`chip-${i}`} ref={(el) => { if (el) chipRefs.current[i] = el; }}>
          <boxGeometry args={[1, 0.5, 0.4]} />
          <meshStandardMaterial color="#d6a866" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
