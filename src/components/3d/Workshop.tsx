"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// Dedicated wash bay. The surrounding 360° auto-shop comes from the HDRI
// (swapped in CanvasContainer while inWorkshop); here we place the bike on a
// wet floor pad, cake it in real mud, and let the player hose it off with a
// single pressurised jet aimed by the cursor — dirt clears where you spray and
// dirty water runs off, just like real life.

const MODEL_URL = "/models/scooter.glb";
const BIKE_SCALE = 0.0095;
const MODEL_Y = 66.599 * BIKE_SCALE;
const MODEL_Z = -4.273 * BIKE_SCALE;

// Mud blobs in the bike's local frame. They sit on the side facing the camera
// (local −x once the bike is turned side-on) plus the top, so all are reachable
// from the fixed view. x = width, y = height, z = length.
const GRIME: [number, number, number][] = [
  [-0.28, 0.5, 0.5], [-0.29, 0.44, 0.18], [-0.3, 0.56, -0.12], [-0.28, 0.5, -0.42],
  [-0.29, 0.4, -0.66], [-0.27, 0.62, 0.34], [-0.28, 0.38, 0.62], [-0.22, 0.3, 0.82],
  [-0.22, 0.3, -0.82], [-0.05, 0.78, -0.1], [0.0, 0.72, 0.42], [-0.02, 0.82, -0.42],
  [-0.06, 0.86, 0.64], [-0.22, 0.6, 0.74], [-0.18, 0.7, 0.58], [-0.16, 0.34, 0.84],
  [-0.16, 0.34, -0.84], [-0.24, 0.5, 0.0],
];
const N = GRIME.length;
const JET_DROPS = 16;

function BikeModel() {
  const { scene } = useGLTF(MODEL_URL);
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
      if (o.name === "Cube") o.visible = false;
    });
    return c;
  }, [scene]);
  return <primitive object={model} scale={BIKE_SCALE} position={[0, MODEL_Y, MODEL_Z]} />;
}
useGLTF.preload(MODEL_URL);

export default function Workshop() {
  const { camera } = useThree();
  const addProgress = useGameStore((s) => s.addProgress);
  const exitWorkshop = useGameStore((s) => s.exitWorkshop);

  const mud = useTexture({
    map: "/textures/mud_forest_diff.jpg",
    normalMap: "/textures/mud_forest_nor_gl.jpg",
  }) as { map: THREE.Texture; normalMap: THREE.Texture };

  const grimeRefs = useRef<THREE.Mesh[]>([]);
  const dripRefs = useRef<THREE.Mesh[]>([]);
  const splashRefs = useRef<THREE.Mesh[]>([]);
  const rigRef = useRef<THREE.Group>(null);
  const jetRef = useRef<THREE.Mesh>(null);
  const jetDropRefs = useRef<THREE.Mesh[]>([]);
  const mistRef = useRef<THREE.Mesh>(null);
  const dirt = useRef<number[]>(GRIME.map(() => 1));

  const ndc = useRef(new THREE.Vector2(0, 0));
  const spraying = useRef(false);

  const scratch = useMemo(
    () => ({
      ray: new THREE.Raycaster(),
      muzzle: new THREE.Vector3(),
      aim: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    []
  );

  // Frame the bike, free the cursor, and wire pointer + ESC handlers.
  useEffect(() => {
    camera.position.set(0.15, 0.95, 2.55);
    camera.lookAt(0, 0.62, 0);

    const onMove = (e: MouseEvent) => {
      ndc.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    const onDown = (e: MouseEvent) => { if (e.button === 0) spraying.current = true; };
    const onUp = () => { spraying.current = false; };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key.toLowerCase() === "e") exitWorkshop(); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
      // hand the player back to the garden, beside the carport
      camera.position.set(10.8, 1.65, 4.6);
      camera.lookAt(10.8, 0.9, 1.0);
    };
  }, [camera, exitWorkshop]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const bikeProg = useGameStore.getState().progress.bike ?? 0;
    const isSpraying = spraying.current;

    // Aim ray from the cursor.
    scratch.ray.setFromCamera(ndc.current, camera);

    // What the jet lands on: a grime blob if the cursor is over one, else a
    // point a fixed distance down the ray (so the stream still reads).
    const blobs = grimeRefs.current.filter(Boolean);
    const hits = scratch.ray.intersectObjects(blobs, false);
    let hitIndex = -1;
    if (hits.length > 0) {
      scratch.aim.copy(hits[0].point);
      hitIndex = (hits[0].object.userData.idx as number) ?? -1;
    } else {
      scratch.ray.ray.at(2.4, scratch.aim);
    }

    // Clean the blob under the jet.
    if (isSpraying && hitIndex >= 0 && dirt.current[hitIndex] > 0) {
      dirt.current[hitIndex] = Math.max(0, dirt.current[hitIndex] - delta * 1.1);
    }

    // Update every blob's look + its runoff drip.
    let dirtSum = 0;
    for (let i = 0; i < N; i++) {
      const d = dirt.current[i];
      dirtSum += d;
      const gm = grimeRefs.current[i];
      if (gm) {
        gm.visible = d > 0.02;
        const s = 0.05 + d * 0.075;
        gm.scale.set(s, s * 0.55, s);
        (gm.material as THREE.MeshStandardMaterial).opacity = Math.min(1, d * 1.4);
      }
      const dr = dripRefs.current[i];
      if (dr) {
        const active = isSpraying && i === hitIndex && d > 0;
        dr.visible = active;
        if (active) {
          const base = GRIME[i];
          const frac = (t * 1.7) % 1;
          dr.position.set(base[0] - 0.03, base[1] * (1 - frac) + 0.02, base[2]);
          dr.scale.set(0.016, 0.07 + frac * 0.14, 0.016);
          (dr.material as THREE.MeshStandardMaterial).opacity = 0.8 * (1 - frac);
        }
      }
    }

    // Cleanliness drives the shared bike progress.
    const cleanPct = (1 - dirtSum / N) * 100;
    if (cleanPct > bikeProg + 0.1) addProgress("bike", cleanPct - bikeProg);

    // --- Spray gun viewmodel anchored to the camera ---
    if (rigRef.current) {
      rigRef.current.position.copy(camera.position);
      rigRef.current.quaternion.copy(camera.quaternion);
      const bob = isSpraying ? Math.sin(t * 30) * 0.004 : 0;
      rigRef.current.translateY(bob);
    }

    // Muzzle in world space (camera-space offset).
    scratch.muzzle.set(0.26, -0.2, -0.62).applyMatrix4(camera.matrixWorld);

    // --- Single pressurised jet from muzzle to aim point ---
    if (jetRef.current) {
      jetRef.current.visible = isSpraying;
      if (isSpraying) {
        scratch.dir.copy(scratch.aim).sub(scratch.muzzle);
        const len = scratch.dir.length();
        scratch.dir.normalize();
        scratch.quat.setFromUnitVectors(scratch.up, scratch.dir);
        scratch.mid.copy(scratch.muzzle).addScaledVector(scratch.dir, len / 2);
        jetRef.current.position.copy(scratch.mid);
        jetRef.current.quaternion.copy(scratch.quat);
        const wob = 0.9 + Math.sin(t * 45) * 0.1;
        jetRef.current.scale.set(0.012 * wob, len, 0.012 * wob);
      }
    }
    // droplets racing along the jet
    jetDropRefs.current.forEach((m, i) => {
      if (!m) return;
      if (!isSpraying) { m.scale.setScalar(0); return; }
      const frac = ((t * 2.2 + i / JET_DROPS) % 1);
      m.position.copy(scratch.muzzle).addScaledVector(scratch.dir, frac * scratch.muzzle.distanceTo(scratch.aim));
      m.position.x += Math.sin(i * 3 + t * 20) * 0.01;
      m.position.y += Math.cos(i * 2 + t * 18) * 0.01;
      m.scale.setScalar(0.012 + frac * 0.01);
    });
    if (mistRef.current) {
      mistRef.current.position.copy(scratch.muzzle);
      mistRef.current.scale.setScalar(isSpraying ? 0.05 + Math.sin(t * 12) * 0.01 : 0);
    }

    // Splash bursting where the jet lands.
    splashRefs.current.forEach((m, i) => {
      if (!m) return;
      if (isSpraying && hitIndex >= 0) {
        const frac = (t * 2.6 + i * 0.2) % 1;
        m.position.copy(scratch.aim);
        m.position.x += Math.sin(i * 2.1) * 0.12 * frac;
        m.position.y += 0.04 - frac * 0.18;
        m.position.z += Math.cos(i * 3.3) * 0.12 * frac;
        m.scale.setScalar((1 - frac) * 0.04);
      } else {
        m.scale.setScalar(0);
      }
    });
  });

  const gunMetal = <meshStandardMaterial color="#1f2937" roughness={0.35} metalness={0.7} />;

  return (
    <group>
      {/* soft fill above the bike */}
      <pointLight position={[0.5, 2.6, 1.5]} intensity={4} color="#fff3e0" distance={9} decay={1.6} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} />

      {/* wet concrete wash pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[2.6, 48]} />
        <meshStandardMaterial color="#3c4046" roughness={0.35} metalness={0.1} envMapIntensity={0.8} />
      </mesh>
      {/* puddle sheen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.3]}>
        <circleGeometry args={[1.3, 40]} />
        <meshStandardMaterial color="#5a6066" roughness={0.08} metalness={0.2} transparent opacity={0.5} envMapIntensity={1.2} />
      </mesh>

      {/* the bike, turned side-on to the camera */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <BikeModel />

        {/* caked mud */}
        {GRIME.map((p, i) => (
          <mesh
            key={i}
            position={p}
            userData={{ idx: i }}
            ref={(el) => { if (el) grimeRefs.current[i] = el; }}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial map={mud.map} normalMap={mud.normalMap} color="#5a3d22" roughness={1} transparent opacity={1} />
          </mesh>
        ))}
        {/* dirty runoff */}
        {GRIME.map((_, i) => (
          <mesh key={`drip-${i}`} ref={(el) => { if (el) dripRefs.current[i] = el; }} visible={false}>
            <cylinderGeometry args={[1, 1, 1, 6]} />
            <meshStandardMaterial color="#3f2c16" transparent opacity={0.8} roughness={0.6} />
          </mesh>
        ))}
        {/* splash */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`sp-${i}`} ref={(el) => { if (el) splashRefs.current[i] = el; }}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color="#dff4ff" transparent opacity={0.85} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* ---- spray gun viewmodel (anchored to camera) ---- */}
      <group ref={rigRef}>
        <mesh position={[0.26, -0.34, -0.5]} rotation={[0.35, 0, 0.12]}>
          <boxGeometry args={[0.05, 0.16, 0.06]} />
          {gunMetal}
        </mesh>
        <mesh position={[0.26, -0.22, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.055, 0.2, 0.07]} />
          {gunMetal}
        </mesh>
        <mesh position={[0.26, -0.2, -0.66]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.02, 0.16, 14]} />
          <meshStandardMaterial color="#e8eaf0" roughness={0.15} metalness={1} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0.3, -0.46, -0.45]} rotation={[0.6, 0, 0.4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 10]} />
          <meshStandardMaterial color="#155e75" roughness={0.7} />
        </mesh>
      </group>

      {/* the single jet + droplets + muzzle mist (world space) */}
      <mesh ref={jetRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#d8f0ff" transparent opacity={0.55} emissive="#bfe6ff" emissiveIntensity={0.4} depthWrite={false} />
      </mesh>
      {Array.from({ length: JET_DROPS }).map((_, i) => (
        <mesh key={`jd-${i}`} ref={(el) => { if (el) jetDropRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#eaf7ff" transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={mistRef}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}
