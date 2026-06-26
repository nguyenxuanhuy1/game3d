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

import { Suspense, lazy } from "react";
import CanvasContainer from "@/components/3d/CanvasContainer";
import IntroDoorScene from "@/components/3d/IntroDoorScene";
import PlayerControls from "@/components/3d/PlayerControls";
import { useGameStore } from "@/store/gameStore";
import { STATIONS, STATION_MAP } from "@/components/3d/stations";

// The whole interactive home (and the spray hose) only loads once you step
// through the door, so the landing/door scene stays light and fast.
const HomeWorld = lazy(() => import("@/components/3d/HomeWorld"));
const SprayHose = lazy(() => import("@/components/3d/SprayHose"));

export default function Home() {
  const entered = useGameStore((s) => s.entered);
  const doorOpening = useGameStore((s) => s.doorOpening);
  const nearbyId = useGameStore((s) => s.nearbyStationId);
  const progress = useGameStore((s) => s.progress);
  const completed = useGameStore((s) => s.completed);

  const allDone = completed.length >= STATIONS.length;
  const nearby = nearbyId ? STATION_MAP[nearbyId] : null;
  const nearbyProgress = nearbyId ? Math.round(progress[nearbyId] ?? 0) : 0;
  const done = nearbyProgress >= 100;

  return (
    <main className="relative w-full h-full min-h-screen">
      <CanvasContainer>
        <IntroDoorScene />
        <Suspense fallback={null}>
          {entered && <HomeWorld />}
          {entered && <SprayHose />}
        </Suspense>
        <PlayerControls />
      </CanvasContainer>

      {/* ---------- INTRO ---------- */}
      {!entered && (
        <h1 className="absolute top-8 left-8 z-10 pointer-events-none select-none text-xl font-light tracking-[0.35em] text-amber-50/80 uppercase">
          No&nbsp;Stress
        </h1>
      )}

      {!entered && !doorOpening && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55 animate-pulse">
            Nhấp vào tay nắm cửa để vào nhà
          </p>
        </div>
      )}

      {doorOpening && !entered && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-black/10 backdrop-blur-[1px] transition-all duration-1000" />
      )}

      {/* ---------- IN-HOME (minimal) ---------- */}
      {entered && (
        <>
          {/* center reticle — grows slightly when something is in reach */}
          <div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
            <div
              className="w-1.5 h-1.5 rounded-full bg-white/80 ring-1 ring-black/40 transition-transform duration-200"
              style={{ transform: nearby ? "scale(1.8)" : "scale(1)" }}
            />
          </div>

          {/* contextual prompt — only when near an activity */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
            {allDone ? (
              <div className="px-6 py-2.5 rounded-full bg-black/35 border border-amber-200/25 backdrop-blur-xl">
                <span className="text-[13px] font-light tracking-wide text-amber-100/90">
                  Một ngày trọn vẹn 🌙
                </span>
              </div>
            ) : nearby ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/35 border border-white/10 backdrop-blur-xl">
                  <span className="text-lg leading-none">{nearby.icon}</span>
                  <span className="text-[13px] font-medium text-white/90">{nearby.label}</span>
                  <span className="text-[10px] text-white/40 tracking-wide">
                    {done ? "✓" : nearby.kind === "hold" ? "giữ chuột" : "nhấn chuột"}
                  </span>
                </div>
                <div className="w-40 h-1 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{ width: `${nearbyProgress}%`, backgroundColor: nearby.accent }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
