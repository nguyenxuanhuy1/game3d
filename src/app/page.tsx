"use client";

// Suppress internal library deprecation warnings from R3F Canvas
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("THREE.Clock: This module has been deprecated")
    ) {
      return;
    }
    originalWarn(...args);
  };
}

import CanvasContainer from "@/components/3d/CanvasContainer";
import IntroDoorScene from "@/components/3d/IntroDoorScene";
import HouseInteriorScene from "@/components/3d/HouseInteriorScene";
import FirstPersonControls from "@/components/3d/FirstPersonControls";
import { useGameStore } from "@/store/gameStore";

export default function Home() {
  const isInsideHouse = useGameStore((state) => state.isInsideHouse);
  const isDoorOpening = useGameStore((state) => state.isDoorOpening);

  return (
    <main className="relative w-full h-full min-h-screen">
      {/* 3D Canvas Layer */}
      <CanvasContainer>
        <IntroDoorScene />
        <HouseInteriorScene />
        <FirstPersonControls />
      </CanvasContainer>

      {/* HTML Overlays (outside Canvas) */}
      {/* Left side: Intro Header */}
      {!isInsideHouse && (
        <div className="absolute top-8 left-8 z-10 pointer-events-none select-none">
          <h1 className="text-2xl font-light tracking-[0.3em] text-zinc-100 uppercase">
            No Stress
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1 tracking-widest uppercase">
            Immersive 3D Sensory Space
          </p>
        </div>
      )}

      {/* Center Instruction (Only show when outside at start) */}
      {!isInsideHouse && !isDoorOpening && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center select-none animate-pulse">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-300 font-medium">
            Interact with the door handle to enter
          </p>
        </div>
      )}

      {/* Door opening transition blur / fade */}
      {isDoorOpening && !isInsideHouse && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-black/10 backdrop-blur-[1px] transition-all duration-1000" />
      )}
    </main>
  );
}
