"use client";

import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface ModelProps {
  /** Path under /public, e.g. "/models/sofa_03.glb" */
  url: string;
  /** Uniform scale (Poly Haven models are real-world metres, so ~1 is correct). */
  scale?: number;
  /** Anchor in world space. With `grounded`, this is where the model's BASE sits. */
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Drop the model so its lowest point rests exactly on position.y (default true). */
  grounded?: boolean;
  /** Re-centre the model on X/Z around the anchor (default true). */
  center?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Force every material fully opaque (fixes models that ship a stray alpha). */
  opaque?: boolean;
  children?: React.ReactNode;
}

/**
 * Generic glTF placer. Clones the cached scene (so shadow flags / animations
 * don't mutate the shared asset), turns shadows on, and — crucially —
 * auto-grounds + auto-centres using the model's own bounding box. That means a
 * zone only has to say "put this at (x, z)" and the helper makes the base rest
 * on the floor, regardless of where the artist placed the model's origin.
 */
export default function Model({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  grounded = true,
  center = true,
  castShadow = true,
  receiveShadow = true,
  opaque = false,
  children,
}: ModelProps) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = castShadow;
        m.receiveShadow = receiveShadow;
        if (opaque) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            const std = mat as THREE.MeshStandardMaterial;
            std.transparent = false;
            std.opacity = 1;
            std.alphaTest = 0;
            std.depthWrite = true;
            std.needsUpdate = true;
          });
        }
      }
    });
    return c;
  }, [scene, castShadow, receiveShadow, opaque]);

  // Offset (in unscaled parent units) that grounds + centres the scaled model.
  const offset = useMemo<[number, number, number]>(() => {
    const box = new THREE.Box3().setFromObject(object);
    if (!isFinite(box.min.y)) return [0, 0, 0];
    const ox = center ? -((box.min.x + box.max.x) / 2) * scale : 0;
    const oz = center ? -((box.min.z + box.max.z) / 2) * scale : 0;
    const oy = grounded ? -box.min.y * scale : 0;
    return [ox, oy, oz];
  }, [object, scale, center, grounded]);

  return (
    <group position={position} rotation={rotation}>
      <group position={offset}>
        <group scale={scale}>
          <primitive object={object} />
        </group>
      </group>
      {/* extra props (animated bits) live in the anchor's frame */}
      {children}
    </group>
  );
}

// Central catalogue of every CC0 model path. Keeps the zone files tidy and gives
// one place to preload.
export const M = {
  // living room
  sofa: "/models/sofa_03.glb",
  lounge: "/models/mid_century_lounge_chair.glb",
  coffeeTable: "/models/modern_coffee_table_01.glb",
  bookshelf: "/models/wooden_bookshelf_worn.glb",
  fireplace: "/models/scandinavian_masonry_heater.glb",
  boombox: "/models/boombox.glb",
  cat: "/models/concrete_cat_statue.glb",
  pillows: "/models/throw_pillows_01.glb",
  deskLamp: "/models/desk_lamp_arm_01.glb",
  chandelier: "/models/Chandelier_01.glb",
  vase: "/models/ceramic_vase_01.glb",
  // kitchen
  stove: "/models/electric_stove.glb",
  cabinet: "/models/painted_wooden_cabinet.glb",
  kettle: "/models/vintage_electric_kettle.glb",
  coffeeCart: "/models/CoffeeCart_01.glb",
  pan: "/models/brass_pan_01.glb",
  pot: "/models/brass_pot_01.glb",
  potEnamel: "/models/pot_enamel_01.glb",
  // garden
  plant1: "/models/potted_plant_01.glb",
  plant2: "/models/potted_plant_02.glb",
  plant4: "/models/potted_plant_04.glb",
  fern: "/models/fern_02.glb",
  wateringCan: "/models/watering_can_metal_01.glb",
  planter: "/models/planter_box_01.glb",
  stump: "/models/tree_stump_01.glb",
  axe: "/models/wooden_axe_03.glb",
  bucket: "/models/wooden_bucket_01.glb",
  // garage / wash bay
  hose: "/models/garden_hose_wall_mounted_01.glb",
  oilCan: "/models/small_oil_can_01.glb",
  car: "/models/ferrari.glb",
} as const;

/** Preload a set of model urls (call at module scope inside a zone). */
export function preload(...urls: string[]) {
  urls.forEach((u) => useGLTF.preload(u));
}
