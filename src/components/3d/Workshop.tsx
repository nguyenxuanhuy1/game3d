"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import Model, { M, preload } from "./Model";

preload(M.hose, M.bucket, M.oilCan, M.car);

// Dedicated wash bay. The surrounding 360° auto-shop comes from the HDRI.
// The chosen vehicle arrives FILTHY — its whole bodywork is tinted muddy, dusty
// and matte. Orbit around it (drag to spin, wheel to zoom) and hose it down:
// holding the jet on it rinses the grime away until it's showroom-clean. The
// water keeps spraying even once it's spotless.

const DUSTY = new THREE.Color("#33291a");
const JET_DROPS = 16;
const WASH_RATE = 0.12; // grime removed per second under the jet (lower = slower)

interface VehicleCfg {
  url: string;
  scale: number;
  spin: number; // y-rotation so it faces the camera nicely
  camPos: [number, number, number];
  target: [number, number, number];
  minDist: number;
  maxDist: number;
}
const VEHICLES: Record<"scooter" | "car", VehicleCfg> = {
  scooter: { url: "/models/scooter.glb", scale: 0.0095, spin: Math.PI / 2, camPos: [2.0, 1.15, 2.0], target: [0, 0.55, 0], minDist: 1.2, maxDist: 4.5 },
  car: { url: M.car, scale: 1, spin: 0.5, camPos: [5.2, 2.0, 5.2], target: [0, 0.6, 0], minDist: 2.6, maxDist: 11 },
};

// Generic vehicle: clones the model, gives every mesh its OWN material instance
// (so dirtying the wash-bay copy never bleeds onto the parked garden bike), and
// auto-grounds + centres it. The forwarded ref is the outer group, used for both
// the cleaning raycast and the dirty-tint material sweep.
function VehicleModel({ url, scale, groupRef }: { url: string; scale: number; groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(url);
  const { object, offset } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : (m.material as THREE.Material).clone();
      }
      if (o.name === "Cube") o.visible = false;
    });
    // Force all nested node transforms to resolve before measuring, otherwise a
    // model with a deep hierarchy (e.g. the car) is measured wrong and floats.
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const off: [number, number, number] = [
      -((box.min.x + box.max.x) / 2) * scale,
      -box.min.y * scale,
      -((box.min.z + box.max.z) / 2) * scale,
    ];
    return { object: c, offset: off };
  }, [scene, scale]);

  return (
    <group ref={groupRef} position={offset}>
      <group scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}
useGLTF.preload("/models/scooter.glb");

interface MatRec { mat: THREE.MeshStandardMaterial; color: THREE.Color; rough: number; metal: number; }

export default function Workshop() {
  const { camera } = useThree();
  const addProgress = useGameStore((s) => s.addProgress);
  const exitWorkshop = useGameStore((s) => s.exitWorkshop);
  const vehicle = useGameStore((s) => s.vehicle);
  const cfg = VEHICLES[vehicle];

  const vehicleRef = useRef<THREE.Group>(null);
  const mats = useRef<MatRec[]>([]);
  const jetRef = useRef<THREE.Mesh>(null);
  const jetDropRefs = useRef<THREE.Mesh[]>([]);
  const mistRef = useRef<THREE.Mesh>(null);
  const splashRefs = useRef<THREE.Mesh[]>([]);
  const dirt = useRef(1);

  const ndc = useRef(new THREE.Vector2(0, 0));

  const scratch = useMemo(
    () => ({
      ray: new THREE.Raycaster(),
      aim: new THREE.Vector3(),
      muzzle: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    []
  );

  // Release the first-person pointer lock so the cursor is free to orbit + aim,
  // wire the cursor + ESC handlers.
  useEffect(() => {
    if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
    const onMove = (e: MouseEvent) => {
      ndc.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key.toLowerCase() === "e") exitWorkshop(); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      camera.position.set(10.8, 1.65, 4.6);
      camera.lookAt(10.8, 0.9, 1.0);
    };
  }, [camera, exitWorkshop]);

  // Reframe + reset grime whenever the chosen vehicle changes.
  useEffect(() => {
    camera.position.set(...cfg.camPos);
    camera.lookAt(...cfg.target);
    mats.current = [];
    dirt.current = 1;
  }, [camera, cfg]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const prog = useGameStore.getState().progress.bike ?? 0;

    // Collect the current vehicle's materials once it has mounted.
    if (mats.current.length === 0 && vehicleRef.current) {
      vehicleRef.current.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mm) => {
            const std = mm as THREE.MeshStandardMaterial;
            if (std && std.color) mats.current.push({ mat: std, color: std.color.clone(), rough: std.roughness ?? 0.6, metal: std.metalness ?? 0 });
          });
        }
      });
    }

    // Aim: ray from cursor; is it on the vehicle?
    scratch.ray.setFromCamera(ndc.current, camera);
    let onTarget = false;
    if (vehicleRef.current) {
      const hits = scratch.ray.intersectObject(vehicleRef.current, true);
      if (hits.length > 0) { scratch.aim.copy(hits[0].point); onTarget = true; }
    }
    if (!onTarget) scratch.ray.ray.at(2.4, scratch.aim);

    // Rinse (slow): holding the jet on the vehicle washes the grime away.
    if (onTarget && dirt.current > 0) dirt.current = Math.max(0, dirt.current - delta * WASH_RATE);
    const d = dirt.current;

    for (const rec of mats.current) {
      rec.mat.color.copy(rec.color).lerp(DUSTY, d * 0.82).multiplyScalar(1 - d * 0.32);
      rec.mat.roughness = THREE.MathUtils.lerp(rec.rough, 1, d);
      rec.mat.metalness = THREE.MathUtils.lerp(rec.metal, 0, d * 0.9);
    }

    const cleanPct = (1 - d) * 100;
    if (cleanPct > prog + 0.1) addProgress("bike", cleanPct - prog);

    // Water keeps spraying whenever the jet is on the vehicle — even when clean.
    const spraying = onTarget;

    scratch.muzzle.set(0.18, -0.28, -0.35).applyMatrix4(camera.matrixWorld);
    if (jetRef.current) {
      jetRef.current.visible = spraying;
      if (spraying) {
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
    jetDropRefs.current.forEach((m, i) => {
      if (!m) return;
      if (!spraying) { m.scale.setScalar(0); return; }
      const frac = (t * 2.2 + i / JET_DROPS) % 1;
      m.position.copy(scratch.muzzle).addScaledVector(scratch.dir, frac * scratch.muzzle.distanceTo(scratch.aim));
      m.position.x += Math.sin(i * 3 + t * 20) * 0.01;
      m.position.y += Math.cos(i * 2 + t * 18) * 0.01;
      m.scale.setScalar(0.012 + frac * 0.01);
    });
    if (mistRef.current) {
      mistRef.current.position.copy(scratch.muzzle);
      mistRef.current.scale.setScalar(spraying ? 0.05 + Math.sin(t * 12) * 0.01 : 0);
    }
    splashRefs.current.forEach((m, i) => {
      if (!m) return;
      if (spraying) {
        const frac = (t * 2.6 + i * 0.2) % 1;
        m.position.copy(scratch.aim);
        m.position.x += Math.sin(i * 2.1) * 0.12 * frac;
        m.position.y += 0.04 - frac * 0.18;
        m.position.z += Math.cos(i * 3.3) * 0.12 * frac;
        m.scale.setScalar((1 - frac) * 0.04);
      } else m.scale.setScalar(0);
    });
  });

  return (
    <group>
      {/* orbit the vehicle: drag to spin, wheel to zoom. Remounts per vehicle. */}
      <OrbitControls
        key={vehicle}
        makeDefault
        target={cfg.target}
        enablePan={false}
        minDistance={cfg.minDist}
        maxDistance={cfg.maxDist}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.12}
      />

      {/* bright wash-bay lighting */}
      <pointLight position={[0.5, 3.2, 1.5]} intensity={8} color="#fff3e0" distance={14} decay={1.5} />
      <pointLight position={[-2, 2.6, -2]} intensity={4.5} color="#dfe9ff" distance={12} decay={1.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} castShadow />
      <hemisphereLight args={["#ffffff", "#5a5550", 0.5]} />

      {/* wet concrete wash pad (big enough for the car) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <circleGeometry args={[3.4, 56]} />
        <meshStandardMaterial color="#3c4046" roughness={0.35} metalness={0.1} envMapIntensity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.3]}>
        <circleGeometry args={[1.7, 44]} />
        <meshStandardMaterial color="#5a6066" roughness={0.08} metalness={0.2} transparent opacity={0.5} envMapIntensity={1.2} />
      </mesh>

      {/* wash-bay props */}
      <group position={[-2.6, 0, -0.6]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#3a4048" roughness={0.5} metalness={0.6} />
        </mesh>
        <Model url={M.hose} position={[0, 0.95, 0.08]} rotation={[0, Math.PI / 2, 0]} grounded={false} center />
      </group>
      <Model url={M.bucket} position={[2.5, 0, -0.8]} scale={1.0} />
      <Model url={M.oilCan} position={[2.4, 0, 0.8]} rotation={[0, -0.7, 0]} />

      {/* the chosen vehicle, turned to face the camera */}
      <group rotation={[0, cfg.spin, 0]}>
        <VehicleModel key={vehicle} url={cfg.url} scale={cfg.scale} groupRef={vehicleRef} />
      </group>

      {/* splash where the jet lands (world space) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`sp-${i}`} ref={(el) => { if (el) splashRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color="#dff4ff" transparent opacity={0.85} roughness={0.1} />
        </mesh>
      ))}

      {/* the jet + droplets + muzzle mist — kept clear & watery */}
      <mesh ref={jetRef} visible={false}>
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#cfeeff" transparent opacity={0.22} emissive="#bfe6ff" emissiveIntensity={0.1} roughness={0.1} depthWrite={false} />
      </mesh>
      {Array.from({ length: JET_DROPS }).map((_, i) => (
        <mesh key={`jd-${i}`} ref={(el) => { if (el) jetDropRefs.current[i] = el; }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#eaf7ff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={mistRef}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}
