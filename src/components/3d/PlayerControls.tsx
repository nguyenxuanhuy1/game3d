"use client";

import React, { useEffect, useRef, useState } from "react";
import { PointerLockControls, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { STATIONS, STATION_MAP } from "./stations";

// Axis-aligned wall segments {x1,x2,z1,z2}. Player slides along them.
const PLAYER_R = 0.38;
const WALLS: { x1: number; x2: number; z1: number; z2: number }[] = [
  // Outer interior shell
  { x1: -15.4, x2: -14.8, z1: -9.4, z2: 6.4 }, // left
  { x1: -15.4, x2: 14.4, z1: -9.4, z2: -8.8 }, // back
  { x1: 13.8, x2: 14.4, z1: -9.4, z2: 6.4 }, // far right (garden fence)
  // Front wall with a central door gap (x in [-1.2, 1.2])
  { x1: -15.4, x2: -1.2, z1: 5.8, z2: 6.4 },
  { x1: 1.2, x2: 14.4, z1: 5.8, z2: 6.4 },
  // Kitchen | Living partition at x=-5.5, gap z in [-1, 2.2]
  { x1: -5.8, x2: -5.2, z1: -9.0, z2: -1.0 },
  { x1: -5.8, x2: -5.2, z1: 2.2, z2: 6.2 },
  // Living | Outdoor glass partition at x=6, gap z in [-1, 2.2]
  { x1: 5.7, x2: 6.3, z1: -9.0, z2: -1.0 },
  { x1: 5.7, x2: 6.3, z1: 2.2, z2: 6.2 },
];

const BOUNDS = { minX: -14.6, maxX: 13.6, minZ: -8.6, maxZ: 6.0 };

function collides(px: number, pz: number): boolean {
  for (const w of WALLS) {
    if (px + PLAYER_R > w.x1 && px - PLAYER_R < w.x2 && pz + PLAYER_R > w.z1 && pz - PLAYER_R < w.z2) {
      return true;
    }
  }
  return false;
}

export default function PlayerControls() {
  const entered = useGameStore((s) => s.entered);
  const setNearby = useGameStore((s) => s.setNearby);
  const setInteracting = useGameStore((s) => s.setInteracting);
  const addProgress = useGameStore((s) => s.addProgress);

  const controlsRef = useRef<any>(null);
  const [locked, setLocked] = useState(false);

  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const holdE = useRef(false);
  const holdMouse = useRef(false);
  const prevActing = useRef(false);
  const nearbyRef = useRef<string | null>(null);

  // Spawn just inside the front door when entering.
  useEffect(() => {
    if (entered) {
      camera.position.set(0, 1.65, 4.2);
    }
  }, [entered, camera]);

  // Keyboard
  useEffect(() => {
    if (!entered) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.current.w = true;
      if (k === "s" || k === "arrowdown") keys.current.s = true;
      if (k === "a" || k === "arrowleft") keys.current.a = true;
      if (k === "d" || k === "arrowright") keys.current.d = true;
      if (k === "e") holdE.current = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "arrowup") keys.current.w = false;
      if (k === "s" || k === "arrowdown") keys.current.s = false;
      if (k === "a" || k === "arrowleft") keys.current.a = false;
      if (k === "d" || k === "arrowright") keys.current.d = false;
      if (k === "e") holdE.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [entered]);

  // Mouse acts as the interact button while pointer is locked.
  useEffect(() => {
    if (!entered) return;
    const down = () => { holdMouse.current = true; };
    const up = () => { holdMouse.current = false; };
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [entered]);

  // Track pointer-lock state.
  useEffect(() => {
    if (!entered) return;
    const onLock = () => setLocked(true);
    const onUnlock = () => setLocked(false);
    const timer = setTimeout(() => {
      const c = controlsRef.current;
      if (c) {
        c.addEventListener("lock", onLock);
        c.addEventListener("unlock", onUnlock);
      }
    }, 60);
    return () => {
      clearTimeout(timer);
      const c = controlsRef.current;
      if (c) {
        c.removeEventListener("lock", onLock);
        c.removeEventListener("unlock", onUnlock);
      }
    };
  }, [entered]);

  useFrame((_, delta) => {
    if (!entered) return;

    // ---- Movement ----
    if (locked) {
      const speed = 3.4;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const forward = new THREE.Vector3(dir.x, 0, dir.z).normalize();
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (keys.current.w) move.add(forward);
      if (keys.current.s) move.sub(forward);
      if (keys.current.d) move.add(right);
      if (keys.current.a) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed * delta);
        let nx = camera.position.x + move.x;
        let nz = camera.position.z + move.z;
        nx = THREE.MathUtils.clamp(nx, BOUNDS.minX, BOUNDS.maxX);
        nz = THREE.MathUtils.clamp(nz, BOUNDS.minZ, BOUNDS.maxZ);
        if (!collides(nx, camera.position.z)) camera.position.x = nx;
        if (!collides(camera.position.x, nz)) camera.position.z = nz;
      }
    }
    camera.position.y = 1.65;

    // ---- Nearest interactable station ----
    let best: string | null = null;
    let bestD = Infinity;
    for (const s of STATIONS) {
      const dx = camera.position.x - s.pos[0];
      const dz = camera.position.z - s.pos[2];
      const d = Math.hypot(dx, dz);
      if (d < s.radius && d < bestD) {
        bestD = d;
        best = s.id;
      }
    }
    if (best !== nearbyRef.current) {
      nearbyRef.current = best;
      setNearby(best);
    }

    // ---- Interaction ----
    const acting = locked && (holdE.current || holdMouse.current);
    const station = best ? STATION_MAP[best] : null;

    if (acting && station) {
      if (station.kind === "hold") {
        addProgress(station.id, station.step * delta);
        setInteracting(station.id);
      } else if (!prevActing.current) {
        // tap: one shot on the rising edge
        addProgress(station.id, station.step);
        setInteracting(station.id);
      }
    } else {
      setInteracting(null);
    }
    prevActing.current = acting;
  });

  if (!entered) return null;

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      {!locked && (
        <Html fullscreen>
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[2px] cursor-pointer select-none"
            onClick={() => controlsRef.current?.lock()}
          >
            <div className="px-7 py-5 rounded-2xl bg-zinc-900/90 border border-amber-700/40 text-center shadow-2xl max-w-sm">
              <p className="text-sm font-semibold text-amber-50 uppercase tracking-widest">
                Nhấp để bắt đầu một ngày
              </p>
              <p className="text-xs text-amber-100/70 mt-3 leading-relaxed">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-200 font-mono">WASD</span> để đi ·
                di chuột để nhìn quanh<br />
                Lại gần đồ vật rồi giữ <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-200 font-mono">E</span> hoặc <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-200 font-mono">chuột</span> để làm việc<br />
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-200 font-mono">ESC</span> để thả chuột
              </p>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
