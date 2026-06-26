"use client";

import React, { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// ---------------------------------------------------------------------------
// Real 3D scooter model (an underbone, same family as the Honda Wave Alpha).
//   Model: "low poly scooter" by Thomas Saint Pierre (s1pierro)
//   Source: https://poly.pizza/m/awXCP7LUcz6 — licensed CC-BY 3.0
// Native model dimensions (units): X 68.79, Y 122.77, Z 196.94 (length on Z),
// center [0, -5.22, 4.27], min.y -66.60. We normalise to ~1.7 long, drop it on
// the ground and centre it on the carport pad. Tweak the two constants below to
// re-size / re-orient the parked bike.
// ---------------------------------------------------------------------------
const MODEL_URL = "/models/scooter.glb";
const BIKE_SCALE = 0.0086; // 196.94 * 0.0086 ≈ 1.69 units long
const BIKE_ROT_Y = 0; // 0 = length runs along Z (side profile faces the door)
const MODEL_Y = 66.599 * BIKE_SCALE; // lift so the wheels touch the ground
const MODEL_Z = -4.273 * BIKE_SCALE; // re-centre length

// Grime blobs in the bike's normalised local frame (x = width ±0.3,
// y = height 0..1.05, z = length ±0.85). The player only cleans a blob by
// aiming the hose at it; dirty water then trickles down to the ground.
const BIKE_GRIME: [number, number, number][] = [
  [0.0, 0.5, 0.72],
  [0.26, 0.5, 0.5],
  [-0.26, 0.5, 0.5],
  [0.0, 0.32, 0.3],
  [0.28, 0.55, 0.05],
  [-0.28, 0.55, 0.05],
  [0.0, 0.78, -0.05],
  [0.26, 0.52, -0.4],
  [-0.26, 0.52, -0.4],
  [0.0, 0.42, -0.72],
  [0.0, 0.28, 0.8],
  [0.0, 0.28, -0.8],
  [0.22, 0.34, 0.78],
  [-0.22, 0.34, -0.78],
];
const SPLASH_COUNT = 10;

function ScooterModel() {
  const { scene } = useGLTF(MODEL_URL);
  // Clone so shadows / hidden helpers don't mutate the shared cache, and drop
  // the stray "Cube" helper node that ships inside this model.
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
      if (o.name === "Cube") o.visible = false;
    });
    return c;
  }, [scene]);

  return <primitive object={model} scale={BIKE_SCALE} position={[0, MODEL_Y, MODEL_Z]} />;
}
useGLTF.preload(MODEL_URL);

export default function OutdoorZone() {
  // ---- plant refs ----
  const plantRef = useRef<THREE.Group>(null);
  const soilMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flowerRef = useRef<THREE.Group>(null);
  const dropRefs = useRef<THREE.Mesh[]>([]);
  const canRef = useRef<THREE.Group>(null);
  const canStreamRef = useRef<THREE.Mesh>(null);

  // ---- bike wash refs ----
  const grimeRefs = useRef<THREE.Mesh[]>([]);
  const dripRefs = useRef<THREE.Mesh[]>([]);
  const splashRefs = useRef<THREE.Mesh[]>([]);
  const shineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const { progress, interactingId } = useGameStore.getState();
    const plant = progress.plant ?? 0;
    const bikeProg = progress.bike ?? 0;

    // ============ PLANT: watering can + growth ============
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
    if (canRef.current) {
      const targetTilt = watering ? -0.95 : 0;
      canRef.current.rotation.z = THREE.MathUtils.lerp(canRef.current.rotation.z, targetTilt, 0.12);
    }
    if (canStreamRef.current) {
      canStreamRef.current.visible = watering;
      canStreamRef.current.scale.y = 0.9 + Math.sin(t * 22) * 0.1;
    }
    dropRefs.current.forEach((m, i) => {
      if (!m) return;
      const frac = (t * 1.1 + i * 0.2) % 1;
      m.position.set(Math.sin(i * 3) * 0.12, 0.95 - frac * 0.85, Math.cos(i * 2) * 0.12);
      m.scale.setScalar(watering ? 0.022 : 0);
    });

    // ============ BIKE: dirt just mirrors wash progress ============
    // Washing happens in the dedicated workshop now; the parked bike simply
    // shows how clean it currently is (blobs vanish in order as progress rises).
    for (let i = 0; i < BIKE_GRIME.length; i++) {
      const gm = grimeRefs.current[i];
      if (gm) {
        gm.visible = bikeProg < ((i + 1) / BIKE_GRIME.length) * 100 - 4;
        gm.scale.set(0.06, 0.042, 0.06);
        (gm.material as THREE.MeshStandardMaterial).opacity = 1;
      }
      const dr = dripRefs.current[i];
      if (dr) dr.visible = false;
    }
    splashRefs.current.forEach((m) => { if (m) m.scale.setScalar(0); });

    // Mirror-finish sweep once the bike is spotless.
    if (shineRef.current) {
      const mat = shineRef.current.material as THREE.MeshBasicMaterial;
      if (bikeProg >= 100) {
        const sweep = Math.sin(t * 1.2) * 0.5 + 0.5;
        shineRef.current.position.z = -0.9 + sweep * 1.8;
        mat.opacity = 0.4 * (1 - Math.abs(sweep - 0.5) * 1.6);
      } else mat.opacity = 0;
    }
  });

  return (
    <group>
      {/* ---- Distant field bridging the garden to the panoramic horizon ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.05, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#5d7d4a" roughness={1} metalness={0} />
      </mesh>

      {/* ---- Grass ground ---- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.004, -1.5]} receiveShadow>
        <planeGeometry args={[8.2, 15.4]} />
        <meshStandardMaterial color="#3f7a34" roughness={0.95} />
      </mesh>
      {/* stone path from the glass door */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i % 2 ? 0.2 : -0.2]} position={[6.8 + i * 0.85, 0.014, 0.5]} receiveShadow>
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
          {/* blossom (toggled in useFrame) */}
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

        {/* ---- Watering can (tilts & pours while watering) ---- */}
        <group ref={canRef} position={[0.0, 1.0, 0.42]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.16, 0.26, 20]} />
            <meshStandardMaterial color="#2f9e44" roughness={0.4} metalness={0.4} envMapIntensity={1.1} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <torusGeometry args={[0.14, 0.015, 8, 20]} />
            <meshStandardMaterial color="#268a3a" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.18, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#268a3a" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0.18, 0.02, 0]} rotation={[0, 0, -0.7]}>
            <cylinderGeometry args={[0.018, 0.03, 0.34, 12]} />
            <meshStandardMaterial color="#268a3a" roughness={0.45} metalness={0.4} />
          </mesh>
          <mesh position={[0.3, 0.13, 0]} rotation={[0, 0, -0.7]}>
            <cylinderGeometry args={[0.05, 0.04, 0.04, 12]} />
            <meshStandardMaterial color="#1f7a31" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh ref={canStreamRef} position={[0.32, -0.35, 0]} visible={false}>
            <cylinderGeometry args={[0.012, 0.02, 0.8, 8]} />
            <meshStandardMaterial color="#bdecff" transparent opacity={0.6} emissive="#7dd3fc" emissiveIntensity={0.4} />
          </mesh>
        </group>

        {/* watering splash at the soil */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} ref={(el) => { if (el) dropRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.5} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>

      {/* ============ CARPORT + SCOOTER (Wave-Alpha-style underbone) ============ */}
      <group position={[10.8, 0, 1.0]}>
        {/* carport roof */}
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
        {/* paving under bike */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
          <planeGeometry args={[2.8, 2.8]} />
          <meshStandardMaterial color="#6b6358" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* the parked scooter + everything that lives in its normalised frame */}
        <group rotation={[0, BIKE_ROT_Y, 0]}>
          {/* contact shadow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
            <planeGeometry args={[0.7, 1.9]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.28} />
          </mesh>

          <Suspense fallback={null}>
            <ScooterModel />
          </Suspense>

          {/* ----- grime blobs (washed off by aiming the hose) ----- */}
          {BIKE_GRIME.map((p, i) => (
            <mesh key={i} position={p} ref={(el) => { if (el) grimeRefs.current[i] = el; }}>
              <sphereGeometry args={[1, 10, 10]} />
              <meshStandardMaterial color="#2e1c0e" roughness={1} transparent opacity={1} />
            </mesh>
          ))}
          {/* dirty water trickles */}
          {BIKE_GRIME.map((_, i) => (
            <mesh key={`drip-${i}`} ref={(el) => { if (el) dripRefs.current[i] = el; }} visible={false}>
              <cylinderGeometry args={[1, 1, 1, 6]} />
              <meshStandardMaterial color="#4a3318" transparent opacity={0.7} roughness={0.6} />
            </mesh>
          ))}
          {/* impact splash off the spot being rinsed */}
          {Array.from({ length: SPLASH_COUNT }).map((_, i) => (
            <mesh key={`splash-${i}`} ref={(el) => { if (el) splashRefs.current[i] = el; }}>
              <sphereGeometry args={[1, 6, 6]} />
              <meshStandardMaterial color="#dff4ff" transparent opacity={0.8} roughness={0.1} />
            </mesh>
          ))}
          {/* shine sweep once spotless (slides along the length) */}
          <mesh ref={shineRef} position={[0, 0.6, 0]} rotation={[0, 0, 0.3]}>
            <planeGeometry args={[0.6, 0.18]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>

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
