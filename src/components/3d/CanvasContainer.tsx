"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import DayCycle from "./DayCycle";
import { useGameStore } from "@/store/gameStore";

interface CanvasContainerProps {
  children: React.ReactNode;
}

export default function CanvasContainer({ children }: CanvasContainerProps) {
  const [mounted, setMounted] = useState(false);
  const inWorkshop = useGameStore((s) => s.inWorkshop);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1c1410] text-amber-100/70">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-900/40 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-sm tracking-widest uppercase font-light text-amber-100/80">
            Đang chuẩn bị ngôi nhà...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden bg-[#160f17]">
      <Canvas
        flat
        // Cap resolution lower so high-DPI screens stay smooth, and let R3F drop
        // quality before it ever drops frames.
        dpr={[1, 1.4]}
        performance={{ min: 0.5 }}
        shadows={{ type: THREE.PCFShadowMap }}
        // antialias is handled by the EffectComposer (multisampling) below, so we
        // turn off the context-level MSAA to avoid paying for it twice.
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance", stencil: false, depth: true }}
        camera={{ fov: 60, near: 0.1, far: 220, position: [0, 1.65, 10] }}
      >
        {/* Sky colour, fog and sun/ambient all driven by the time-of-day cycle */}
        <DayCycle />

        {/* Real 360° outdoor panorama (CC0 Poly Haven "qwantani_noon"): green
            fields, rolling hills and a clouded blue sky. It's both the sky you
            see beyond the fence AND the image-based lighting, so reflections and
            ambient match the real environment. A touch of blur keeps it reading
            as distant scenery rather than a flat photo. */}
        {/* Garden uses the sky panorama; the wash bay swaps to a real auto-shop
            interior (both CC0 Poly Haven HDRIs) — that real 360° shop *is* the
            workshop backdrop, no box-room needed. */}
        <Environment
          key={inWorkshop ? "shop" : "sky"}
          files={inWorkshop ? "/hdris/autoshop_01_1k.hdr" : "/hdris/qwantani_noon_1k.hdr"}
          background
          backgroundBlurriness={inWorkshop ? 0.02 : 0.05}
          backgroundIntensity={inWorkshop ? 1.1 : 1.0}
          environmentIntensity={inWorkshop ? 1.0 : 0.7}
        />

        {children}

        {/* Lighter post stack: 2× MSAA (down from 4×) + a single gentle bloom.
            Cheapest path that still anti-aliases the many box edges. */}
        <EffectComposer multisampling={2}>
          <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.9} luminanceSmoothing={0.2} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.32} darkness={0.42} eskil={false} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
