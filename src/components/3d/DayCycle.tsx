"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

interface Key {
  t: number;
  bg: string;
  fog: string;
  amb: string;
  ambI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  sun: string;
  sunI: number;
  sunPos: [number, number, number];
  fogNear: number;
  fogFar: number;
}

// Colour & light keyframes across a day. 0 = pre-dawn, 0.5 = noon, 0.86 = sunset, 1 = night.
const KEYS: Key[] = [
  { t: 0.0, bg: "#20203a", fog: "#26243f", amb: "#3a3a5a", ambI: 0.3, hemiSky: "#3a3a6a", hemiGround: "#1a1410", hemiI: 0.3, sun: "#9aa6d8", sunI: 0.5, sunPos: [-10, 5, 8], fogNear: 10, fogFar: 55 },
  { t: 0.16, bg: "#bcd6ea", fog: "#cfe0ec", amb: "#fff0db", ambI: 0.7, hemiSky: "#dcecff", hemiGround: "#b7a187", hemiI: 0.6, sun: "#ffe2b0", sunI: 2.3, sunPos: [-12, 7, 9], fogNear: 16, fogFar: 72 },
  { t: 0.5, bg: "#aacdEa", fog: "#cfe2f0", amb: "#fff6ea", ambI: 0.95, hemiSky: "#eaf4ff", hemiGround: "#cbb79a", hemiI: 0.75, sun: "#fff4e0", sunI: 3.0, sunPos: [2, 16, 4], fogNear: 20, fogFar: 85 },
  { t: 0.72, bg: "#e7d3ad", fog: "#ecd9b8", amb: "#ffe9c8", ambI: 0.85, hemiSky: "#ffe6c0", hemiGround: "#b89a72", hemiI: 0.72, sun: "#ffd28a", sunI: 2.7, sunPos: [10, 9, 6], fogNear: 16, fogFar: 76 },
  { t: 0.86, bg: "#e1894e", fog: "#dd8a55", amb: "#ffca87", ambI: 0.72, hemiSky: "#ff9a5a", hemiGround: "#5a3320", hemiI: 0.62, sun: "#ff7e3c", sunI: 2.3, sunPos: [15, 3, 8], fogNear: 12, fogFar: 62 },
  { t: 1.0, bg: "#0e0b18", fog: "#140f1e", amb: "#5b5a86", ambI: 0.32, hemiSky: "#2a2350", hemiGround: "#0e0a12", hemiI: 0.36, sun: "#aab4e6", sunI: 0.6, sunPos: [-8, 9, 6], fogNear: 8, fogFar: 46 },
];

export default function DayCycle() {
  const timeTarget = useGameStore((s) => s.timeTarget);
  const { scene } = useThree();

  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const curTime = useRef(timeTarget);

  // Precompute colour objects for each keyframe.
  const cKeys = useMemo(
    () =>
      KEYS.map((k) => ({
        ...k,
        bgC: new THREE.Color(k.bg),
        fogC: new THREE.Color(k.fog),
        ambC: new THREE.Color(k.amb),
        hemiSkyC: new THREE.Color(k.hemiSky),
        hemiGroundC: new THREE.Color(k.hemiGround),
        sunC: new THREE.Color(k.sun),
      })),
    []
  );

  // Reusable scratch colours (mutated each frame, no per-frame allocation).
  const tmp = useMemo(
    () => ({
      bg: new THREE.Color("#bcd6ea"),
      fog: new THREE.Color("#cfe0ec"),
      amb: new THREE.Color(),
      hemiSky: new THREE.Color(),
      hemiGround: new THREE.Color(),
      sun: new THREE.Color(),
    }),
    []
  );

  useEffect(() => {
    scene.background = tmp.bg;
    scene.fog = new THREE.Fog(tmp.fog, 16, 72);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, tmp]);

  useFrame((_, delta) => {
    // Smoothly drift toward the target time-of-day.
    curTime.current = THREE.MathUtils.lerp(curTime.current, timeTarget, Math.min(1, delta * 0.7));
    const t = curTime.current;

    // Find the surrounding keyframes.
    let a = cKeys[0];
    let b = cKeys[cKeys.length - 1];
    for (let i = 0; i < cKeys.length - 1; i++) {
      if (t >= cKeys[i].t && t <= cKeys[i + 1].t) {
        a = cKeys[i];
        b = cKeys[i + 1];
        break;
      }
    }
    const f = THREE.MathUtils.clamp((t - a.t) / Math.max(1e-4, b.t - a.t), 0, 1);

    tmp.bg.copy(a.bgC).lerp(b.bgC, f);
    tmp.fog.copy(a.fogC).lerp(b.fogC, f);
    tmp.amb.copy(a.ambC).lerp(b.ambC, f);
    tmp.hemiSky.copy(a.hemiSkyC).lerp(b.hemiSkyC, f);
    tmp.hemiGround.copy(a.hemiGroundC).lerp(b.hemiGroundC, f);
    tmp.sun.copy(a.sunC).lerp(b.sunC, f);

    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = THREE.MathUtils.lerp(a.fogNear, b.fogNear, f);
      fog.far = THREE.MathUtils.lerp(a.fogFar, b.fogFar, f);
    }

    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.lerp(a.ambI, b.ambI, f);
      ambRef.current.color.copy(tmp.amb);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(a.hemiI, b.hemiI, f);
      hemiRef.current.color.copy(tmp.hemiSky);
      hemiRef.current.groundColor.copy(tmp.hemiGround);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, f);
      dirRef.current.color.copy(tmp.sun);
      dirRef.current.position.set(
        THREE.MathUtils.lerp(a.sunPos[0], b.sunPos[0], f),
        THREE.MathUtils.lerp(a.sunPos[1], b.sunPos[1], f),
        THREE.MathUtils.lerp(a.sunPos[2], b.sunPos[2], f)
      );
    }
  });

  const showStars = timeTarget > 0.88;

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.7} />
      <hemisphereLight ref={hemiRef} intensity={0.6} position={[0, 20, 0]} />
      <directionalLight
        ref={dirRef}
        position={[-12, 7, 9]}
        intensity={2.3}
        castShadow
        shadow-bias={-0.0003}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={70}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      {showStars && (
        <Stars radius={90} depth={50} count={1800} factor={4} saturation={0.4} fade speed={0.4} />
      )}
    </>
  );
}
