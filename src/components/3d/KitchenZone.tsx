"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import Model, { M, preload } from "./Model";

preload(M.kettle, M.stove, M.pan, M.pot, M.potEnamel, M.cabinet, M.plant4, M.coffeeCart);

export default function KitchenZone() {
  const cupFillRef = useRef<THREE.Mesh>(null);
  const steamRefs = useRef<THREE.Mesh[]>([]);
  const burnerRef = useRef<THREE.Mesh>(null);
  const foodRef = useRef<THREE.Mesh>(null);
  const foodMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const sizzleRefs = useRef<THREE.Mesh[]>([]);
  const foamRefs = useRef<THREE.Mesh[]>([]);
  const streamRef = useRef<THREE.Mesh>(null);
  const spongeRef = useRef<THREE.Group>(null);
  const plateMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { progress, interactingId } = useGameStore.getState();
    const coffee = progress.coffee ?? 0;
    const stove = progress.stove ?? 0;
    const dishes = progress.dishes ?? 0;

    // ----- Coffee: fill cup + steam -----
    if (cupFillRef.current) {
      const sY = Math.max(0.001, coffee / 100);
      cupFillRef.current.scale.y = sY;
      cupFillRef.current.position.y = -0.035 + (0.07 * sY) / 2;
    }
    const steaming = coffee > 5;
    steamRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.4 + i * 0.33) % 1;
      m.position.set(Math.sin(t * 1.5 + i) * 0.04, 0.07 + frac * 0.4, 0.0);
      m.scale.setScalar(steaming ? (1 - frac) * 0.05 : 0);
    });

    // ----- Stove: burner glow, cooking food, sizzle -----
    const cooking = interactingId === "stove" && stove < 100;
    if (burnerRef.current) {
      const mat = burnerRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = (cooking ? 2.2 : stove < 100 ? 0.8 : 0.3) + Math.sin(t * 8) * 0.2;
    }
    if (foodRef.current) {
      foodRef.current.position.y = 0.045 + (cooking ? Math.abs(Math.sin(t * 6)) * 0.06 : 0);
      foodRef.current.rotation.y = t * (cooking ? 2 : 0.3);
    }
    if (foodMatRef.current) {
      foodMatRef.current.color.set("#e7a17a").lerp(new THREE.Color("#7c4a1e"), stove / 100);
    }
    sizzleRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 1.2 + i * 0.4) % 1;
      m.position.set(Math.sin(i * 2) * 0.12, 0.08 + frac * 0.25, Math.cos(i * 3) * 0.1);
      m.scale.setScalar(cooking ? (1 - frac) * 0.03 : 0);
    });

    // ----- Dishes: water stream + foam + plate shine -----
    const washing = interactingId === "dishes" && dishes < 100;
    if (streamRef.current) {
      streamRef.current.visible = washing;
      streamRef.current.scale.y = 0.9 + Math.sin(t * 20) * 0.1;
    }
    if (spongeRef.current) {
      spongeRef.current.visible = washing;
      if (washing) {
        spongeRef.current.position.set(
          -0.02 + Math.cos(t * 9) * 0.06,
          0.075 + Math.abs(Math.sin(t * 9)) * 0.015,
          0.08 + Math.sin(t * 9) * 0.06
        );
        spongeRef.current.rotation.y = t * 2;
      }
    }
    foamRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 0.8 + i * 0.27) % 1;
      m.position.set(Math.sin(i * 5) * 0.18, 0.0 + frac * 0.22, Math.cos(i * 4) * 0.16);
      m.scale.setScalar(washing ? (1 - frac) * 0.04 + 0.01 : 0);
    });
    plateMatRefs.current.forEach((mat) => {
      if (mat) mat.emissiveIntensity = (dishes / 100) * 0.5 + (dishes >= 100 ? Math.sin(t * 2) * 0.1 + 0.2 : 0);
    });
  });

  const woodCab = <meshStandardMaterial color="#7c5236" roughness={0.65} />;
  const counterTop = <meshStandardMaterial color="#e7ddc9" roughness={0.4} metalness={0.1} />;
  const steel = <meshStandardMaterial color="#c2c8d0" roughness={0.25} metalness={0.9} envMapIntensity={1.4} />;

  return (
    <group>
      {/* ---- Back-wall counter run (x -14.5 .. -6) ---- */}
      <group>
        <mesh position={[-10.25, 0.45, -8.6]} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.9, 0.6]} />
          {woodCab}
        </mesh>
        <mesh position={[-10.25, 0.92, -8.6]} castShadow>
          <boxGeometry args={[8.7, 0.06, 0.66]} />
          {counterTop}
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-13.8 + i * 1.4, 0.45, -8.28]}>
            <boxGeometry args={[0.04, 0.7, 0.02]} />
            <meshStandardMaterial color="#5b3c26" />
          </mesh>
        ))}
        {/* Upper cabinets */}
        <mesh position={[-10.25, 2.5, -8.85]} castShadow>
          <boxGeometry args={[8.5, 0.8, 0.35]} />
          {woodCab}
        </mesh>
      </group>

      {/* ---- Left-wall sink counter (z -6 .. -3) ---- */}
      <mesh position={[-14.4, 0.45, -4.4]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.9, 3]} />
        {woodCab}
      </mesh>
      <mesh position={[-14.4, 0.92, -4.4]} castShadow>
        <boxGeometry args={[0.66, 0.06, 3.1]} />
        {counterTop}
      </mesh>

      {/* tall pantry cabinet + a leafy plant for life */}
      <Model url={M.cabinet} position={[-6.6, 0, -8.5]} rotation={[0, 0, 0]} />
      <Model url={M.plant4} position={[-13.9, 0.95, -6.2]} scale={1.4} grounded={false} center />

      {/* ============ COFFEE STATION — vintage kettle + filling cup ============ */}
      <group position={[-11.4, 0.95, -7.4]}>
        <Model url={M.kettle} position={[-0.18, 0, 0]} rotation={[0, 0.5, 0]} />
        {/* cup */}
        <group position={[0.16, 0, 0.04]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.08, 16]} />
            <meshStandardMaterial color="#faf5ec" roughness={0.3} />
          </mesh>
          <mesh ref={cupFillRef} position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.045, 0.035, 0.07, 16]} />
            <meshStandardMaterial color="#3b1d0e" roughness={0.2} emissive="#1a0c05" emissiveIntensity={0.2} />
          </mesh>
          {/* steam */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} ref={(el) => { if (el) steamRefs.current[i] = el; }}>
              <sphereGeometry args={[1, 6, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ============ STOVE STATION — hot plate + brass pan & pot ============ */}
      <group position={[-9.0, 0.95, -7.4]}>
        {/* induction hot plate */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.7, 0.06, 0.5]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.35} metalness={0.5} />
        </mesh>
        {/* glowing burner ring */}
        <mesh ref={burnerRef} position={[-0.02, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.16, 24]} />
          <meshStandardMaterial color="#ff5722" emissive="#ff4500" emissiveIntensity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.12, 0]} intensity={2} color="#ff6a2a" distance={1.6} decay={2} />
        {/* brass pan over the burner */}
        <Model url={M.pan} position={[-0.02, 0.06, 0]} rotation={[0, Math.PI / 2, 0]} grounded={false} center />
        {/* food (egg/patty) sizzling in the pan */}
        <mesh ref={foodRef} position={[-0.02, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial ref={foodMatRef} color="#e7a17a" roughness={0.6} />
        </mesh>
        {/* a brass pot resting beside it */}
        <Model url={M.pot} position={[0.26, 0.06, -0.02]} scale={0.7} grounded={false} center />
        {/* sizzle */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) sizzleRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#fff2d0" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* ============ SINK / DISHES STATION ============ */}
      <group position={[-13.4, 0.95, -4.4]}>
        {/* basin */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.4, 0.16, 0.5]} />
          <meshStandardMaterial color="#aeb6bf" roughness={0.2} metalness={0.85} envMapIntensity={1.3} />
        </mesh>
        <mesh position={[0, 0.0, 0]}>
          <boxGeometry args={[0.32, 0.14, 0.42]} />
          <meshStandardMaterial color="#7e868f" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* faucet */}
        <mesh position={[0.12, 0.18, -0.18]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 10]} />
          {steel}
        </mesh>
        <mesh position={[0.04, 0.32, -0.12]} rotation={[Math.PI / 2.4, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.22, 10]} />
          {steel}
        </mesh>
        {/* water stream */}
        <mesh ref={streamRef} position={[0.02, 0.16, -0.04]}>
          <cylinderGeometry args={[0.008, 0.008, 0.28, 8]} />
          <meshStandardMaterial color="#bdecff" transparent opacity={0.6} emissive="#7dd3fc" emissiveIntensity={0.4} />
        </mesh>
        {/* enamel pot draining on the side */}
        <Model url={M.potEnamel} position={[0.3, 0.0, 0.22]} rotation={[0, 0.6, 0]} grounded={false} center />
        {/* stacked plates (shine when clean) */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.02, 0.04 + i * 0.016, 0.08]}>
            <cylinderGeometry args={[0.12 - i * 0.01, 0.12 - i * 0.01, 0.012, 24]} />
            <meshStandardMaterial
              ref={(m) => { if (m) plateMatRefs.current[i] = m; }}
              color="#f3efe7"
              roughness={0.3}
              metalness={0.2}
              emissive="#ffffff"
              emissiveIntensity={0}
            />
          </mesh>
        ))}
        {/* scrub sponge */}
        <group ref={spongeRef} position={[-0.02, 0.075, 0.08]} visible={false}>
          <mesh castShadow>
            <boxGeometry args={[0.07, 0.03, 0.05]} />
            <meshStandardMaterial color="#fde047" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.066, 0.014, 0.046]} />
            <meshStandardMaterial color="#22c55e" roughness={0.95} />
          </mesh>
        </group>
        {/* foam */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`f-${i}`} ref={(el) => { if (el) foamRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
