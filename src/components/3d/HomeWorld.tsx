"use client";

import React, { Suspense, lazy, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Each zone/station is its own lazy chunk so the whole world isn't bundled and
// parsed up front — they stream in independently right after you step inside.
const KitchenZone = lazy(() => import("./KitchenZone"));
const LivingZone = lazy(() => import("./LivingZone"));
const OutdoorZone = lazy(() => import("./OutdoorZone"));
const FirewoodStation = lazy(() => import("./FirewoodStation"));

// Real CC0 PBR textures (Poly Haven) give the surfaces believable grain instead
// of flat colours. Helper loads a diff/normal/rough set and tiles it.
function useSurface(
  slug: string,
  repeatX: number,
  repeatY: number
): { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture } {
  const tex = useTexture({
    map: `/textures/${slug}_diff.jpg`,
    normalMap: `/textures/${slug}_nor_gl.jpg`,
    roughnessMap: `/textures/${slug}_rough.jpg`,
  }) as { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };

  return useMemo(() => {
    tex.map.colorSpace = THREE.SRGBColorSpace;
    [tex.map, tex.normalMap, tex.roughnessMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeatX, repeatY);
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
    return tex;
  }, [tex, repeatX, repeatY]);
}

// One continuous, walkable home: kitchen (left) → living room (centre) →
// glass doors out to the garden & carport (right). Layout matches the
// collision walls in PlayerControls.
export default function HomeWorld() {
  const wood = useSurface("wood_floor", 4, 5);
  const tiles = useSurface("brown_floor_tiles", 5, 7);
  const plaster = useSurface("beige_wall_001", 5, 1.4);

  return (
    <group>
      {/* ---------------- Floors ---------------- */}
      {/* Living-room wood floor — matte/satin real wood (no mirror, low env
          reflection) so it no longer throws a red glossy sheen from the ceiling. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.25, 0, -1.5]} receiveShadow>
        <planeGeometry args={[11.5, 15]} />
        <meshStandardMaterial
          map={wood.map}
          normalMap={wood.normalMap}
          roughnessMap={wood.roughnessMap}
          metalness={0}
          envMapIntensity={0.35}
        />
      </mesh>

      {/* Kitchen tiled floor (real tile texture) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.25, 0.005, -1.5]} receiveShadow>
        <planeGeometry args={[9.5, 15]} />
        <meshStandardMaterial
          map={tiles.map}
          normalMap={tiles.normalMap}
          roughnessMap={tiles.roughnessMap}
          metalness={0}
          envMapIntensity={0.4}
        />
      </mesh>

      {/* ---------------- Ceiling (interior only) ---------------- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-4.5, 3.2, -1.5]}>
        <planeGeometry args={[21, 15.4]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} color="#f2ead9" roughness={1} metalness={0} envMapIntensity={0.25} />
      </mesh>
      {/* Warm wood ceiling beams */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[-14 + i * 3.6, 3.1, -1.5]} castShadow>
          <boxGeometry args={[0.2, 0.18, 15]} />
          <meshStandardMaterial color="#6b4a30" roughness={0.8} />
        </mesh>
      ))}

      {/* ---------------- Walls (plaster texture) ---------------- */}
      {/* Back wall */}
      <mesh receiveShadow position={[-4.5, 1.6, -9.1]}>
        <boxGeometry args={[21, 3.4, 0.3]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e9dcc4" metalness={0} envMapIntensity={0.3} />
      </mesh>
      {/* Left wall */}
      <mesh receiveShadow position={[-15.1, 1.6, -1.5]}>
        <boxGeometry args={[0.3, 3.4, 15.4]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e3d5bc" metalness={0} envMapIntensity={0.3} />
      </mesh>
      {/* Front wall – two segments leaving a central door gap */}
      <mesh receiveShadow position={[-8.3, 1.6, 6.1]}>
        <boxGeometry args={[13.6, 3.4, 0.3]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e9dcc4" metalness={0} envMapIntensity={0.3} />
      </mesh>
      <mesh receiveShadow position={[3.6, 1.6, 6.1]}>
        <boxGeometry args={[4.8, 3.4, 0.3]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e9dcc4" metalness={0} envMapIntensity={0.3} />
      </mesh>
      {/* Door header over the entrance */}
      <mesh position={[0, 3.0, 6.1]}>
        <boxGeometry args={[2.6, 0.6, 0.3]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} color="#e9dcc4" metalness={0} envMapIntensity={0.3} />
      </mesh>

      {/* Kitchen | Living partition (with a wide doorway) */}
      <mesh receiveShadow position={[-5.5, 1.6, -5.0]}>
        <boxGeometry args={[0.3, 3.4, 8]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e3d5bc" metalness={0} envMapIntensity={0.3} />
      </mesh>
      <mesh receiveShadow position={[-5.5, 1.6, 4.2]}>
        <boxGeometry args={[0.3, 3.4, 3.8]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} roughnessMap={plaster.roughnessMap} color="#e3d5bc" metalness={0} envMapIntensity={0.3} />
      </mesh>
      {/* doorway header */}
      <mesh position={[-5.5, 3.0, 0.6]}>
        <boxGeometry args={[0.3, 0.6, 3.4]} />
        <meshStandardMaterial map={plaster.map} normalMap={plaster.normalMap} color="#e3d5bc" metalness={0} envMapIntensity={0.3} />
      </mesh>

      {/* Living | Outdoor glass wall (with a sliding-door gap) */}
      {[
        { z: -5.0, d: 8 },
        { z: 4.2, d: 3.8 },
      ].map((seg, i) => (
        <group key={`glass-${i}`} position={[6, 1.6, seg.z]}>
          {/* frame */}
          <mesh>
            <boxGeometry args={[0.12, 3.4, seg.d]} />
            <meshStandardMaterial color="#3a2c22" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* glass */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 3.0, seg.d - 0.2]} />
            <meshStandardMaterial color="#bfe3e8" transparent opacity={0.18} roughness={0.05} metalness={0.4} envMapIntensity={1.2} />
          </mesh>
        </group>
      ))}
      {/* glass door header */}
      <mesh position={[6, 3.0, 0.6]}>
        <boxGeometry args={[0.12, 0.6, 3.4]} />
        <meshStandardMaterial color="#3a2c22" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* ---------------- Soft fill lights (interior) ----------------
          Softer & less saturated than before so the room reads as natural warm
          daylight instead of a heavy orange wash. Sun shadows come from DayCycle. */}
      <pointLight position={[-10, 2.9, -3]} intensity={6} color="#ffe9cc" distance={11} decay={1.7} />
      <pointLight position={[0.5, 2.9, 0]} intensity={6.5} color="#ffead6" distance={14} decay={1.7} />

      {/* ---------------- Zones (each loads as its own chunk) ---------------- */}
      <Suspense fallback={null}><KitchenZone /></Suspense>
      <Suspense fallback={null}><LivingZone /></Suspense>
      <Suspense fallback={null}><OutdoorZone /></Suspense>
      <Suspense fallback={null}><FirewoodStation /></Suspense>
    </group>
  );
}
