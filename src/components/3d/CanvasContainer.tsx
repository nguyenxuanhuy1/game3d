"use client";

import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import DayCycle from "./DayCycle";

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
      <div className="w-full h-full flex items-center justify-center bg-[#1c1410] text-amber-100/70">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-900/40 border-t-amber-400 rounded-full animate-spin"></div>
          <p className="text-sm tracking-widest uppercase font-light text-amber-100/80">
            Waking up the world...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 overflow-hidden bg-[#160f17]">
      <Canvas
        flat
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 60, near: 0.1, far: 220, position: [0, 1.65, 10] }}
      >
        {/* Sky colour, fog and sun/ambient all driven by the time-of-day cycle */}
        <DayCycle />

        {/* Self-contained warm studio IBL so metal / wet / glossy surfaces reflect
            believable golden light without any external HDR download. */}
        <Environment resolution={256} frames={1} background={false}>
          <Lightformer form="rect" intensity={2.2} color="#ffb066" position={[6, 7, 6]} scale={[10, 10, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#8aa0d8" position={[-8, 4, -5]} scale={[7, 7, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={0.7} color="#c98a5a" rotation={[Math.PI / 2, 0, 0]} position={[0, -3, 0]} scale={[14, 14, 1]} />
          <Lightformer form="ring" intensity={1.1} color="#ffe0b0" position={[0, 9, 0]} scale={[6, 6, 1]} target={[0, 0, 0]} />
        </Environment>

        {children}

        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.68} luminanceSmoothing={0.25} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.55} eskil={false} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
