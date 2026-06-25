"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

interface CanvasContainerProps {
  children: React.ReactNode;
}

export default function CanvasContainer({ children }: CanvasContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-zinc-800 border-t-zinc-200 rounded-full animate-spin"></div>
          <p className="text-sm tracking-widest uppercase font-light">Loading Calming World...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden bg-zinc-950">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ antialias: true, alpha: false }}
        camera={{
          fov: 60,
          near: 0.1,
          far: 100,
          position: [0, 1.6, 4.5], // Starting position outside the gate
        }}
      >
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {children}
      </Canvas>
    </div>
  );
}
