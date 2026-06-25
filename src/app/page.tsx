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
import HomeWorld from "@/components/3d/HomeWorld";
import PlayerControls from "@/components/3d/PlayerControls";
import { useGameStore } from "@/store/gameStore";
import { STATIONS, STATION_MAP } from "@/components/3d/stations";

function phaseLabel(t: number): { name: string; icon: string } {
  if (t < 0.28) return { name: "Buổi sáng", icon: "🌅" };
  if (t < 0.58) return { name: "Buổi trưa", icon: "☀️" };
  if (t < 0.78) return { name: "Buổi chiều", icon: "🌤️" };
  if (t < 0.95) return { name: "Hoàng hôn", icon: "🌇" };
  return { name: "Buổi tối", icon: "🌙" };
}

export default function Home() {
  const entered = useGameStore((s) => s.entered);
  const doorOpening = useGameStore((s) => s.doorOpening);
  const nearbyId = useGameStore((s) => s.nearbyStationId);
  const progress = useGameStore((s) => s.progress);
  const completed = useGameStore((s) => s.completed);
  const timeTarget = useGameStore((s) => s.timeTarget);

  const phase = phaseLabel(timeTarget);
  const total = STATIONS.length;
  const doneCount = completed.length;
  const allDone = doneCount >= total;

  const nearby = nearbyId ? STATION_MAP[nearbyId] : null;
  const nearbyProgress = nearbyId ? Math.round(progress[nearbyId] ?? 0) : 0;

  return (
    <main className="relative w-full h-full min-h-screen">
      <CanvasContainer>
        <IntroDoorScene />
        {entered && <HomeWorld />}
        <PlayerControls />
      </CanvasContainer>

      {/* ---------- INTRO OVERLAYS ---------- */}
      {!entered && (
        <div className="absolute top-8 left-8 z-10 pointer-events-none select-none">
          <h1 className="text-2xl font-light tracking-[0.3em] text-amber-50 uppercase drop-shadow-lg">
            A Cozy Day
          </h1>
          <p className="text-xs text-amber-100/70 font-light mt-1 tracking-widest uppercase">
            Ngôi nhà nhỏ · việc thường ngày · thư giãn
          </p>
        </div>
      )}

      {!entered && !doorOpening && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center select-none animate-pulse">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/90 font-medium drop-shadow">
            Nhấp vào tay nắm cửa để bước vào nhà
          </p>
        </div>
      )}

      {doorOpening && !entered && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-black/10 backdrop-blur-[1px] transition-all duration-1000" />
      )}

      {/* ---------- IN-HOME HUD ---------- */}
      {entered && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none select-none">
          {/* Top bar */}
          <div className="flex justify-between items-start w-full">
            {/* Day clock */}
            <div className="px-5 py-3 rounded-2xl bg-zinc-950/70 border border-amber-800/40 backdrop-blur-md shadow-2xl flex flex-col gap-0.5">
              <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase">Thời gian</span>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{phase.icon}</span>
                <span className="text-xs font-bold text-amber-50">{phase.name}</span>
              </div>
            </div>

            {/* Tasks done */}
            <div className="px-5 py-3 rounded-2xl bg-zinc-950/70 border border-amber-800/40 backdrop-blur-md shadow-2xl flex flex-col items-end gap-1">
              <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase">Việc đã xong</span>
              <span className="text-sm font-bold text-amber-50">{doneCount} / {total}</span>
              <div className="flex gap-1 mt-0.5">
                {STATIONS.map((s) => (
                  <span
                    key={s.id}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ backgroundColor: completed.includes(s.id) ? s.accent : "#3f3f46" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: interaction prompt OR all-done banner */}
          <div className="flex justify-center w-full">
            {allDone ? (
              <div className="px-8 py-5 rounded-2xl bg-amber-900/70 border border-amber-400/50 text-center shadow-2xl max-w-md backdrop-blur-md animate-pulse">
                <h3 className="text-md font-bold text-amber-100 uppercase tracking-wide">Một ngày trọn vẹn 🌙</h3>
                <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                  Bạn đã chăm sóc cả ngôi nhà. Trời đã tối — hãy hít thở và thư giãn.
                </p>
              </div>
            ) : nearby ? (
              <div
                className="px-5 py-3 rounded-2xl bg-zinc-950/80 border backdrop-blur-md shadow-2xl flex flex-col items-center gap-2 min-w-[260px]"
                style={{ borderColor: `${nearby.accent}88` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: nearby.accent }}>
                    {nearby.kind === "hold" ? "Giữ" : "Nhấn"}{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white">E</kbd> / chuột
                  </span>
                </div>
                <span className="text-sm font-bold text-zinc-50">{nearby.label}</span>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${nearbyProgress}%`, backgroundColor: nearby.accent }}
                  />
                </div>
                <span className="text-[10px] font-bold" style={{ color: nearby.accent }}>
                  {nearbyProgress >= 100 ? "Hoàn thành ✓" : `${nearbyProgress}%`}
                </span>
              </div>
            ) : (
              <div className="px-5 py-2.5 rounded-2xl bg-zinc-950/65 border border-zinc-800 text-center text-[11px] text-zinc-300 backdrop-blur-md">
                Dùng <strong className="text-amber-300">WASD</strong> đi quanh nhà · lại gần đồ vật để bắt đầu một việc
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
