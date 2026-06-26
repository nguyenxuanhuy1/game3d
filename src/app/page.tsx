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

import { Suspense, lazy, useEffect, useState } from "react";
import { Html, useGLTF } from "@react-three/drei";
import CanvasContainer from "@/components/3d/CanvasContainer";
import IntroDoorScene from "@/components/3d/IntroDoorScene";
import PlayerControls from "@/components/3d/PlayerControls";
import { useGameStore } from "@/store/gameStore";
import { STATIONS, STATION_MAP } from "@/components/3d/stations";
import { M } from "@/components/3d/Model";

// Every heavy asset the home + wash bay need. We fetch (and parse the models)
// up front on the landing screen so stepping inside is smooth instead of janky.
const PRELOAD_MODELS = [...Object.values(M), "/models/scooter.glb"]; // M.car covers the ferrari
const PRELOAD_OTHER = [
  "/textures/wood_floor_diff.jpg", "/textures/wood_floor_nor_gl.jpg", "/textures/wood_floor_rough.jpg",
  "/textures/brown_floor_tiles_diff.jpg", "/textures/brown_floor_tiles_nor_gl.jpg", "/textures/brown_floor_tiles_rough.jpg",
  "/textures/beige_wall_001_diff.jpg", "/textures/beige_wall_001_nor_gl.jpg", "/textures/beige_wall_001_rough.jpg",
  "/textures/mud_forest_diff.jpg", "/textures/mud_forest_nor_gl.jpg",
  "/hdris/qwantani_noon_1k.hdr", "/hdris/autoshop_01_1k.hdr",
];

// The whole interactive home (and the spray hose) only loads once you step
// through the door, so the landing/door scene stays light and fast.
const HomeWorld = lazy(() => import("@/components/3d/HomeWorld"));
const SprayHose = lazy(() => import("@/components/3d/SprayHose"));
// The wash bay is its own chunk — only fetched the first time you wash the bike.
const Workshop = lazy(() => import("@/components/3d/Workshop"));

export default function Home() {
  const entered = useGameStore((s) => s.entered);
  const doorOpening = useGameStore((s) => s.doorOpening);
  const assetsReady = useGameStore((s) => s.assetsReady);
  const setAssetsReady = useGameStore((s) => s.setAssetsReady);
  const [loadPct, setLoadPct] = useState(0);

  // Warm the browser cache + parse all models while the player is still at the
  // door, so entering doesn't stream 13 MB mid-walk. Gate the door on this.
  useEffect(() => {
    PRELOAD_MODELS.forEach((u) => useGLTF.preload(u));
    const all = [...PRELOAD_MODELS, ...PRELOAD_OTHER];
    let done = 0;
    let cancelled = false;
    Promise.all(
      all.map((u) =>
        fetch(u)
          .catch(() => {})
          .finally(() => {
            if (cancelled) return;
            done += 1;
            setLoadPct(Math.round((done / all.length) * 100));
          })
      )
    ).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => { cancelled = true; };
  }, [setAssetsReady]);
  const inWorkshop = useGameStore((s) => s.inWorkshop);
  const exitWorkshop = useGameStore((s) => s.exitWorkshop);
  const nearbyId = useGameStore((s) => s.nearbyStationId);
  const progress = useGameStore((s) => s.progress);
  const completed = useGameStore((s) => s.completed);
  const interactingId = useGameStore((s) => s.interactingId);
  const vehicle = useGameStore((s) => s.vehicle);
  const setVehicle = useGameStore((s) => s.setVehicle);

  const allDone = completed.length >= STATIONS.length;
  const bikeProgress = Math.round(progress.bike ?? 0);
  const nearby = nearbyId ? STATION_MAP[nearbyId] : null;
  const nearbyProgress = nearbyId ? Math.round(progress[nearbyId] ?? 0) : 0;
  const done = nearbyProgress >= 100;
  const isChoppingFocus = interactingId === "firewood";

  return (
    <main className="relative w-full h-full min-h-screen">
      <CanvasContainer>
        {!inWorkshop && <IntroDoorScene />}
        {/* Home world: its own chunk, loaded when you step inside. */}
        <Suspense fallback={null}>
          {entered && !inWorkshop && <HomeWorld />}
          {entered && !inWorkshop && <SprayHose />}
        </Suspense>
        {/* Wash bay: a completely separate chunk + assets, fetched only the
            first time you enter it. A loader shows while it streams in. */}
        {entered && inWorkshop && (
          <Suspense
            fallback={
              <Html fullscreen>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#15110d] text-amber-100/80">
                  <div className="w-10 h-10 border-4 border-amber-900/40 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-sm tracking-widest uppercase font-light">Đang vào xưởng rửa xe…</p>
                </div>
              </Html>
            }
          >
            <Workshop />
          </Suspense>
        )}
        <PlayerControls />
      </CanvasContainer>

      {/* ---------- INTRO ---------- */}
      {!entered && (
        <h1 className="absolute top-8 left-8 z-10 pointer-events-none select-none text-xl font-light tracking-[0.35em] text-amber-50/80 uppercase">
          No&nbsp;Stress
        </h1>
      )}

      {!entered && !doorOpening && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none flex flex-col items-center gap-3">
          {assetsReady ? (
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/55 animate-pulse">
              Nhấp vào tay nắm cửa để vào nhà
            </p>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.25em] text-amber-100/70">
                Đang tải khung cảnh… {loadPct}%
              </p>
              <div className="w-48 h-1 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-300/80 transition-all duration-200"
                  style={{ width: `${loadPct}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {doorOpening && !entered && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-black/10 backdrop-blur-[1px] transition-all duration-1000" />
      )}

      {/* ---------- IN-HOME (minimal) ---------- */}
      {entered && !inWorkshop && (
        <>
          {/* center reticle — grows slightly when something is in reach */}
          {!isChoppingFocus && (
            <div className="absolute inset-0 z-10 grid place-items-center pointer-events-none">
              <div
                className="w-1.5 h-1.5 rounded-full bg-white/80 ring-1 ring-black/40 transition-transform duration-200"
                style={{ transform: nearby ? "scale(1.8)" : "scale(1)" }}
              />
            </div>
          )}

          {/* focused chopping instructions */}
          {isChoppingFocus && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none px-6 py-3.5 rounded-full bg-black/55 border border-amber-500/25 backdrop-blur-2xl flex flex-col items-center gap-1">
              <div className="flex items-center gap-2.5 text-amber-100/90 font-medium">
                <span className="text-base">🪓</span>
                <span className="text-[13px] tracking-wide uppercase">Chế độ chẻ củi</span>
              </div>
              <span className="text-[11px] text-white/60 tracking-wider">
                Nhấp chuột / Spacebar để CHẶT · Nhấn E để THOÁT
              </span>
            </div>
          )}

          {/* contextual prompt — only when near an activity */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none">
            {allDone ? (
              <div className="px-6 py-2.5 rounded-full bg-black/35 border border-amber-200/25 backdrop-blur-xl">
                <span className="text-[13px] font-light tracking-wide text-amber-100/90">
                  Một ngày trọn vẹn 🌙
                </span>
              </div>
            ) : nearby && !isChoppingFocus ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/35 border border-white/10 backdrop-blur-xl">
                  <span className="text-lg leading-none">{nearby.icon}</span>
                  <span className="text-[13px] font-medium text-white/90">{nearby.label}</span>
                  <span className="text-[10px] text-white/40 tracking-wide">
                    {done
                      ? "✓"
                      : nearby.id === "firewood"
                      ? "nhấp/E để vào"
                      : nearby.id === "bike"
                      ? "nhấp/E để vào xưởng rửa"
                      : nearby.kind === "hold"
                      ? "giữ chuột"
                      : "nhấn chuột"}
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

      {/* ---------- WASH BAY (workshop) ---------- */}
      {entered && inWorkshop && (
        <div className="absolute inset-0 z-10 pointer-events-none select-none">
          {/* top label */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/45 border border-white/10 backdrop-blur-xl">
            <span className="text-lg">🚗💦</span>
            <span className="text-[13px] font-medium tracking-wide text-white/90">Xưởng rửa xe</span>
          </div>

          {/* vehicle picker — left side tabs */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/45 pl-1 mb-0.5">Chọn xe</span>
            {([
              { id: "scooter", icon: "🛵", label: "Xe máy" },
              { id: "car", icon: "🏎️", label: "Siêu xe" },
            ] as const).map((v) => {
              const active = vehicle === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVehicle(v.id)}
                  className={`group flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl border backdrop-blur-xl transition-all ${
                    active
                      ? "bg-cyan-400/20 border-cyan-300/60 shadow-lg shadow-cyan-500/10"
                      : "bg-black/40 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl leading-none">{v.icon}</span>
                  <span className={`text-[13px] font-medium tracking-wide ${active ? "text-cyan-100" : "text-white/80"}`}>
                    {v.label}
                  </span>
                  {active && <span className="ml-1 text-cyan-300 text-xs">●</span>}
                </button>
              );
            })}
          </div>

          {/* progress + controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] text-white/70 tracking-wide">
                Rê chuột lên xe để xịt rửa · kéo để xoay · lăn chuột để zoom · sạch {bikeProgress}%
              </span>
              <div className="w-56 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all duration-150"
                  style={{ width: `${bikeProgress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => exitWorkshop()}
              className="pointer-events-auto px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[12px] text-white/90 tracking-wide backdrop-blur-xl transition-colors"
            >
              {bikeProgress >= 100 ? "Sạch bóng! Ra ngoài ✓" : "Xong / Ra ngoài (ESC)"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
