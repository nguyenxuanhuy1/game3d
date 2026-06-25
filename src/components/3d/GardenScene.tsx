"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import * as THREE from "three";

export default function GardenScene() {
  const setRoom = useGameStore((state) => state.setRoom);
  const selectTool = useGameStore((state) => state.selectTool);
  const plantWaterLevel = useGameStore((state) => state.plantWaterLevel);
  const waterPlant = useGameStore((state) => state.waterPlant);

  const { pointer, viewport } = useThree();

  const wateringCanRef = useRef<THREE.Group>(null);
  const plantRef = useRef<THREE.Group>(null);

  const [isWatering, setIsWatering] = useState(false);
  const [droplets, setDroplets] = useState<
    { id: number; pos: [number, number, number]; velocityY: number }[]
  >([]);

  // Auto-select watering-can tool when in garden
  useEffect(() => {
    selectTool("watering-can");
    return () => selectTool("none");
  }, [selectTool]);

  // Set up mouse down/up listener on document to capture watering states
  useEffect(() => {
    const handleDown = () => setIsWatering(true);
    const handleUp = () => setIsWatering(false);

    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  useFrame((state, delta) => {
    // 1. Move watering can to track pointer in 3D (projected depth of z = 0.8)
    const targetX = (pointer.x * viewport.width) / 2;
    const targetY = (pointer.y * viewport.height) / 2 + 1.2; // adjusted for eye height
    const targetZ = 0.8;

    if (wateringCanRef.current) {
      wateringCanRef.current.position.x = THREE.MathUtils.lerp(
        wateringCanRef.current.position.x,
        targetX,
        12 * delta
      );
      wateringCanRef.current.position.y = THREE.MathUtils.lerp(
        wateringCanRef.current.position.y,
        targetY,
        12 * delta
      );
      wateringCanRef.current.position.z = THREE.MathUtils.lerp(
        wateringCanRef.current.position.z,
        targetZ,
        12 * delta
      );

      // Tilt watering can when user is holding mouse down
      const targetRotation = isWatering && plantWaterLevel < 100 ? -Math.PI / 4 : 0;
      wateringCanRef.current.rotation.z = THREE.MathUtils.lerp(
        wateringCanRef.current.rotation.z,
        targetRotation,
        8 * delta
      );
    }

    // 2. Spawn water droplets
    if (isWatering && plantWaterLevel < 100) {
      if (wateringCanRef.current) {
        const canPos = wateringCanRef.current.position;
        const newDroplet = {
          id: Math.random(),
          pos: [canPos.x - 0.16, canPos.y - 0.04, canPos.z] as [number, number, number],
          velocityY: -1.6,
        };
        setDroplets((d) => [...d, newDroplet].slice(-45));
      }
    }

    // 3. Update droplets position and detect collision with plant (located at [0, 0.4, -0.6])
    setDroplets((prev) =>
      prev
        .map((d) => {
          const newY = d.pos[1] + d.velocityY * delta;
          const hitPlant =
            newY <= 0.6 && Math.abs(d.pos[0]) < 0.35 && Math.abs(d.pos[2] - -0.6) < 0.35;

          if (hitPlant) {
            waterPlant(0.4);
            return null; // filter out hit droplets
          }
          return {
            ...d,
            pos: [d.pos[0], newY, d.pos[2]] as [number, number, number],
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null && d.pos[1] > 0)
    );

    // 4. Interpolate plant growth size based on soil moisture percentage
    if (plantRef.current) {
      const growthFactor = 0.5 + (plantWaterLevel / 100) * 0.6; // from 0.5 to 1.1 scale
      plantRef.current.scale.setScalar(
        THREE.MathUtils.lerp(plantRef.current.scale.x, growthFactor, 4 * delta)
      );
    }
  });

  const isFullyGrown = plantWaterLevel >= 100;

  return (
    <group>
      {/* Garden Conservatory Backdrop */}
      {/* Brick red-tinted warm floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -3]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#2d221e" roughness={0.9} />
      </mesh>
      {/* Walls */}
      <mesh receiveShadow position={[0, 1.5, -8]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#163f2d" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[-5, 1.5, -3]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#163f2d" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[5, 1.5, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#163f2d" roughness={0.8} />
      </mesh>

      {/* Golden Warm Sun Rays */}
      <pointLight position={[0, 2.7, -1]} intensity={2.8} color="#fef08a" castShadow />
      <pointLight position={[3, 2.5, -3]} intensity={1.5} color="#a7f3d0" />

      {/* Interactive Potted Plant */}
      <group position={[0, 0, -0.6]}>
        {/* Clay Pot */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.18, 0.5, 16]} />
          <meshStandardMaterial color="#ba8d6c" roughness={0.8} />
        </mesh>

        {/* Dirt in pot */}
        <mesh position={[0, 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 16]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>

        {/* Growing Plant Body */}
        <group ref={plantRef} position={[0, 0.5, 0]} scale={0.5}>
          {/* Main Stem */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.6} />
          </mesh>

          {/* Leaf Left */}
          <mesh position={[-0.14, 0.35, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.5} />
          </mesh>

          {/* Leaf Right */}
          <mesh position={[0.14, 0.45, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <sphereGeometry args={[0.11, 8, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.5} />
          </mesh>

          {/* Blossoming Flower Bud */}
          {isFullyGrown && (
            <group position={[0, 0.62, 0]}>
              {/* Flower Core */}
              <mesh castShadow>
                <sphereGeometry args={[0.18, 16, 16]} />
                <meshStandardMaterial color="#ec4899" roughness={0.3} />
              </mesh>
              {/* Petals */}
              <mesh position={[0, 0.08, 0]}>
                <boxGeometry args={[0.32, 0.02, 0.1]} />
                <meshStandardMaterial color="#f472b6" />
              </mesh>
              <mesh position={[0, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.32, 0.02, 0.1]} />
                <meshStandardMaterial color="#f472b6" />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* Watering Can Model */}
      <group ref={wateringCanRef} castShadow>
        {/* Main body cylinder */}
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.22, 16]} />
          <meshStandardMaterial color="#0891b2" roughness={0.4} />
        </mesh>
        {/* Long Spout */}
        <mesh castShadow position={[-0.15, 0.04, 0]} rotation={[0, 0, -Math.PI / 4.5]}>
          <cylinderGeometry args={[0.02, 0.03, 0.16, 8]} />
          <meshStandardMaterial color="#0891b2" roughness={0.4} />
        </mesh>
        {/* Handle */}
        <mesh castShadow position={[0.12, 0, 0]}>
          <torusGeometry args={[0.08, 0.016, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0891b2" roughness={0.4} />
        </mesh>
      </group>

      {/* Glowing Water Droplets */}
      {droplets.map((d) => (
        <mesh key={d.id} position={d.pos}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {/* HTML Overlay Panel */}
      <Html fullscreen>
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none select-none">
          {/* Header */}
          <div className="flex justify-between items-center w-full">
            <div className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 pointer-events-auto">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Active Room
              </span>
              <h2 className="text-sm font-semibold text-zinc-100">Garden (Plant Care)</h2>
            </div>

            <button
              onClick={() => setRoom("living-room")}
              className="px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-200 uppercase tracking-widest hover:border-zinc-700 hover:text-white transition-colors cursor-pointer pointer-events-auto shadow-lg"
            >
              Back to Hallway
            </button>
          </div>

          {/* Plant Growth Indicator */}
          <div className="m-auto flex flex-col items-center gap-2 pointer-events-auto">
            {isFullyGrown ? (
              <div className="px-8 py-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center shadow-2xl animate-bounce max-w-sm">
                <h3 className="text-lg font-bold text-emerald-200">Fully Grown!</h3>
                <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                  Beautiful blossom opened. Tranquility and growth achieved.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 bg-zinc-900/85 border border-zinc-800 rounded-xl p-4 shadow-xl min-w-[200px]">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Soil Moisture
                </span>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                  <div
                    className="h-full bg-sky-500 transition-all duration-100"
                    style={{ width: `${plantWaterLevel}%` }}
                  ></div>
                </div>
                <span className="text-xs text-sky-400 font-bold">{Math.round(plantWaterLevel)}%</span>
              </div>
            )}
          </div>

          {/* Explanatory Footer */}
          <div className="flex justify-center w-full">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center text-xs text-zinc-400">
              {isFullyGrown ? (
                <span className="text-emerald-400 font-medium">
                  The plant is thriving. Well done.
                </span>
              ) : (
                <span>
                  Click and <strong>hold down mouse</strong> to pour water from the{" "}
                  <strong className="text-sky-300">cyan watering can</strong> onto the plant.
                </span>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
