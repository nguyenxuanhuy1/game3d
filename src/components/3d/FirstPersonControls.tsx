"use client";

import React, { useEffect, useRef, useState } from "react";
import { PointerLockControls, Html } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";

export default function FirstPersonControls() {
  const isInsideHouse = useGameStore((state) => state.isInsideHouse);
  const currentRoom = useGameStore((state) => state.currentRoom);
  const setRoom = useGameStore((state) => state.setRoom);
  const startActivity = useGameStore((state) => state.startActivity);

  const controlsRef = useRef<any>(null);
  const [locked, setLocked] = useState(false);

  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false });

  // Handle re-spawning player position when they return to the living room from other activities
  useEffect(() => {
    if (currentRoom === "living-room" && isInsideHouse) {
      if (camera.position.x < -3.8) {
        camera.position.set(-3.6, 1.6, -3.5);
      } else if (camera.position.x > 3.8) {
        camera.position.set(3.6, 1.6, -3.5);
      }
    }
  }, [currentRoom, camera, isInsideHouse]);

  // Bind WASD / Arrow keyboard listeners
  useEffect(() => {
    if (!isInsideHouse) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.w = true;
      if (key === "s" || key === "arrowdown") keys.current.s = true;
      if (key === "a" || key === "arrowleft") keys.current.a = true;
      if (key === "d" || key === "arrowright") keys.current.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "arrowup") keys.current.w = false;
      if (key === "s" || key === "arrowdown") keys.current.s = false;
      if (key === "a" || key === "arrowleft") keys.current.a = false;
      if (key === "d" || key === "arrowright") keys.current.d = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInsideHouse]);

  useEffect(() => {
    if (!isInsideHouse) {
      setLocked(false);
      return;
    }

    const handleLock = () => setLocked(true);
    const handleUnlock = () => setLocked(false);

    const timer = setTimeout(() => {
      const controls = controlsRef.current;
      if (controls) {
        controls.addEventListener("lock", handleLock);
        controls.addEventListener("unlock", handleUnlock);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      const controls = controlsRef.current;
      if (controls) {
        controls.removeEventListener("lock", handleLock);
        controls.removeEventListener("unlock", handleUnlock);
      }
    };
  }, [isInsideHouse]);

  useFrame((state, delta) => {
    // Only allow movement if inside the house, in the living room, and pointer lock is active
    if (!isInsideHouse || currentRoom !== "living-room" || !locked) return;

    const speed = 3.0; // meters per second walking speed
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Flatten look direction to horizontal plane to avoid vertical drift
    const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDirection = new THREE.Vector3(0, 0, 0);
    if (keys.current.w) moveDirection.add(forward);
    if (keys.current.s) moveDirection.sub(forward);
    if (keys.current.d) moveDirection.add(right);
    if (keys.current.a) moveDirection.sub(right);

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize().multiplyScalar(speed * delta);
      const newPos = camera.position.clone().add(moveDirection);

      // Living Room Boundaries check (width 10m, depth 10m)
      const minX = -4.6;
      const maxX = 4.6;
      const minZ = -7.6;
      const maxZ = 0.4;

      if (newPos.x >= minX && newPos.x <= maxX) {
        camera.position.x = newPos.x;
      }
      if (newPos.z >= minZ && newPos.z <= maxZ) {
        camera.position.z = newPos.z;
      }

      // Check doorway collision points to trigger room loading
      // 1. Left Doorway (Garage)
      if (camera.position.x <= -4.0 && camera.position.z >= -4.5 && camera.position.z <= -2.5) {
        setRoom("garage");
        startActivity("car-washing");
        if (controlsRef.current) {
          controlsRef.current.unlock();
        }
      }

      // 2. Right Doorway (Garden)
      if (camera.position.x >= 4.0 && camera.position.z >= -4.5 && camera.position.z <= -2.5) {
        setRoom("garden");
        startActivity("plant-watering");
        if (controlsRef.current) {
          controlsRef.current.unlock();
        }
      }
    }
  });

  if (!isInsideHouse) return null;

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      
      {!locked && (
        <Html fullscreen>
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[2px] cursor-pointer select-none transition-all duration-300"
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.lock();
              }
            }}
          >
            <div className="px-6 py-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center shadow-2xl max-w-xs animate-fade-in hover:border-zinc-700 transition-colors">
              <p className="text-sm font-semibold text-zinc-100 uppercase tracking-widest">
                Click to Enter Game
              </p>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Use <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">WASD</span> or arrows to walk.<br />
                Move mouse to look around.<br />
                Press <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">ESC</span> to release cursor.
              </p>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
