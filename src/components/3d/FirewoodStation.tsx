"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

// ==========================================
// PROCEDURAL TEXTURE GENERATION FUNCTIONS
// ==========================================

function createBarkTexture() {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  
  // Fill with dark brown base
  ctx.fillStyle = "#4a2f1b";
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw vertical bark textures
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 3 + Math.random() * 8;
    const h = 40 + Math.random() * 140;
    
    const val = Math.random();
    if (val < 0.4) {
      ctx.fillStyle = "#2c1a0e"; // deep dark bark
    } else if (val < 0.8) {
      ctx.fillStyle = "#54361f"; // mid bark
    } else {
      ctx.fillStyle = "#69462d"; // light lichen bark
    }
    
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x, y - 512, w, h); // wrap around vertically
  }
  
  // Add some horizontal cracks
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = "#1b0f07";
    ctx.fillRect(x, y, 12 + Math.random() * 18, 2.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

function createBarkBumpMap() {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  
  // Base is neutral gray (no bump)
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw random vertical lines with varying grayscale to represent height cracks
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const w = 4 + Math.random() * 6;
    const h = 50 + Math.random() * 150;
    
    const val = Math.random();
    if (val < 0.5) {
      ctx.fillStyle = "#2a2a2a"; // deep crevice (lower)
    } else {
      ctx.fillStyle = "#d5d5d5"; // bark plate (higher)
    }
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x, y - 512, w, h);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

function createWoodRingsTexture() {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  
  const cx = 256;
  const cy = 256;
  
  // Light wood grain base
  ctx.fillStyle = "#e6c397";
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw concentric rings with slight noise
  ctx.lineWidth = 1.6;
  for (let r = 10; r < 240; r += 5 + Math.random() * 4) {
    ctx.strokeStyle = `rgba(125, 78, 38, ${0.4 + Math.random() * 0.35})`;
    ctx.beginPath();
    for (let theta = 0; theta < Math.PI * 2; theta += 0.04) {
      const noise = Math.sin(theta * 7) * 3.5 + Math.cos(theta * 13) * 1.5;
      const radius = r + noise;
      const x = cx + Math.cos(theta) * radius;
      const y = cy + Math.sin(theta) * radius;
      if (theta === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
  
  // Draw cracks from center outward
  const numCracks = 4 + Math.floor(Math.random() * 3);
  ctx.strokeStyle = "#402611";
  ctx.lineWidth = 2.8;
  for (let i = 0; i < numCracks; i++) {
    const baseAngle = (i / numCracks) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    let x = cx;
    let y = cy;
    let r = 0;
    while (r < 235) {
      r += 8 + Math.random() * 12;
      const angle = baseAngle + Math.sin(r * 0.04) * 0.25;
      x = cx + Math.cos(angle) * r;
      y = cy + Math.sin(angle) * r;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Draw core (center heartwood)
  ctx.fillStyle = "rgba(110, 60, 28, 0.45)";
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createSteelTexture() {
  if (typeof window === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  
  ctx.fillStyle = "#8d929c";
  ctx.fillRect(0, 0, 256, 256);
  
  // Add fine horizontal scratch lines for brushed steel look
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    ctx.beginPath();
    const y = Math.random() * 256;
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  for (let i = 0; i < 110; i++) {
    ctx.beginPath();
    const y = Math.random() * 256;
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ==========================================
// AUDIO SYNTHESIS HELPERS
// ==========================================

let audioCtx: AudioContext | null = null;
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function playChopSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;

  // 1. Metal Click Transient (Axe hitting hard surface)
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = "sine";
  clickOsc.frequency.setValueAtTime(1400, now);
  clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);
  
  clickGain.gain.setValueAtTime(0.4, now);
  clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.025);
  
  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickOsc.start();
  clickOsc.stop(now + 0.03);

  // 2. Wood Thud (Resonant body vibration)
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = "triangle";
  thudOsc.frequency.setValueAtTime(160, now);
  thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.14);
  
  thudGain.gain.setValueAtTime(0.85, now);
  thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
  
  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);
  thudOsc.start();
  thudOsc.stop(now + 0.18);

  // 3. Crackle Noise (Splitting wood fibers)
  const bufferSize = ctx.sampleRate * 0.12; 
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 450;
  filter.Q.value = 2.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.45, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
  
  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  noiseNode.start();
  noiseNode.stop(now + 0.14);
}

function playLandSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const now = ctx.currentTime;

  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = "sine";
  thudOsc.frequency.setValueAtTime(90, now);
  thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
  
  thudGain.gain.setValueAtTime(0.45, now);
  thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);
  thudOsc.start();
  thudOsc.stop(now + 0.11);
}

// Pile configurations
const PILE: { p: [number, number, number]; r: [number, number, number]; c: string }[] = [
  { p: [0.8, 0.08, 0.12], r: [0, 0.3, Math.PI / 2], c: "#9a6b3f" },
  { p: [0.96, 0.08, -0.06], r: [0, -0.2, Math.PI / 2], c: "#8a5e36" },
  { p: [0.7, 0.08, -0.2], r: [0, 0.1, Math.PI / 2], c: "#90613a" },
  { p: [1.06, 0.08, 0.16], r: [0, -0.5, Math.PI / 2], c: "#a4744a" },
  { p: [0.85, 0.21, 0.02], r: [0, 0.6, Math.PI / 2], c: "#a4744a" },
  { p: [1.0, 0.21, -0.12], r: [0, 0.2, Math.PI / 2], c: "#90613a" },
  { p: [0.78, 0.21, -0.18], r: [0, -0.3, Math.PI / 2], c: "#86592f" },
  { p: [0.92, 0.33, -0.04], r: [0, 0.4, Math.PI / 2], c: "#9a6b3f" },
];

const MAX_PIECES = 16;

interface PiecePhysics {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  opacity: number;
  age: number;
  isLeft: boolean;
}

export default function FirewoodStation() {
  const addProgress = useGameStore((s) => s.addProgress);
  const interactingId = useGameStore((s) => s.interactingId);
  const isInteracting = interactingId === "firewood";

  const axeRef = useRef<THREE.Group>(null);
  const stumpGeoRef = useRef<THREE.CylinderGeometry>(null);
  
  // Standing log refs
  const logGroupRef = useRef<THREE.Group>(null);
  const newLogYRef = useRef(0.75);
  const newLogVRef = useRef(0);
  const squishRef = useRef(0);
  const logRotationYRef = useRef(0);

  // Pools
  const pileRefs = useRef<THREE.Mesh[]>([]);
  const chipRefs = useRef<THREE.Mesh[]>([]);
  const pieceRefs = useRef<(THREE.Group | null)[]>([]);
  const pieceBarkMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pieceInnerMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pieceTopMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pieceBottomMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Physics state for split pieces
  const piecesPhysics = useRef<PiecePhysics[]>(
    Array.from({ length: MAX_PIECES }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      angularVelocity: new THREE.Vector3(),
      opacity: 0,
      age: 0,
      isLeft: false,
    }))
  );

  // Animation states for the axe
  const swingStateRef = useRef<"idle" | "swing" | "bounce" | "return">("idle");
  const swingTimeRef = useRef(0);
  const lastImpactTimeRef = useRef(0);

  // Create procedural textures
  const textures = useMemo(() => {
    return {
      bark: createBarkTexture(),
      barkBump: createBarkBumpMap(),
      woodRings: createWoodRingsTexture(),
      steel: createSteelTexture(),
    };
  }, []);

  // Deform stump geometry slightly to make it organic
  useEffect(() => {
    if (stumpGeoRef.current) {
      const geo = stumpGeoRef.current;
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Only deform side vertices
        if (Math.abs(v.y) < 0.245) {
          const angle = Math.atan2(v.z, v.x);
          const wave = Math.sin(angle * 6) * 0.025 + Math.cos(angle * 4) * 0.015 + Math.sin(v.y * 12) * 0.008;
          const scale = 1 + wave;
          v.x *= scale;
          v.z *= scale;
          pos.setXYZ(i, v.x, v.y, v.z);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
  }, [textures]);

  // Click / Spacebar trigger handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTrigger = (e: MouseEvent | KeyboardEvent) => {
      const activeId = useGameStore.getState().interactingId;
      if (activeId !== "firewood") return;

      const isClick = e.type === "mousedown";
      const isSpace = e.type === "keydown" && (e as KeyboardEvent).code === "Space";

      if ((isClick || isSpace) && swingStateRef.current === "idle") {
        if (isSpace) e.preventDefault(); // Prevent page scrolling
        swingStateRef.current = "swing";
        swingTimeRef.current = 0;
      }
    };

    window.addEventListener("mousedown", handleTrigger);
    window.addEventListener("keydown", handleTrigger);
    return () => {
      window.removeEventListener("mousedown", handleTrigger);
      window.removeEventListener("keydown", handleTrigger);
    };
  }, []);

  const triggerImpact = () => {
    // 1. Sound
    playChopSound();

    // 2. Camera shake via custom event
    window.dispatchEvent(
      new CustomEvent("camera-shake", {
        detail: { intensity: 0.16, duration: 180 },
      })
    );

    // 3. Mark impact time for chips burst
    lastImpactTimeRef.current = performance.now() / 1000;

    // 4. Add progress (16% per hit -> 6 hits to complete)
    addProgress("firewood", 16);

    // 5. Spawn two split pieces from the pool
    let spawnedCount = 0;
    for (let i = 0; i < MAX_PIECES && spawnedCount < 2; i++) {
      if (!piecesPhysics.current[i].active) {
        const isLeft = spawnedCount === 0;
        const speedX = isLeft ? -1.4 - Math.random() * 0.8 : 1.4 + Math.random() * 0.8;
        const speedY = 1.8 + Math.random() * 1.2;
        const speedZ = (Math.random() - 0.5) * 0.6;
        
        const spinZ = isLeft ? 5.0 + Math.random() * 5.0 : -5.0 - Math.random() * 5.0;
        const spinX = (Math.random() - 0.5) * 3.0;
        const spinY = (Math.random() - 0.5) * 3.0;

        piecesPhysics.current[i] = {
          active: true,
          position: new THREE.Vector3(0, 0.75, 0),
          velocity: new THREE.Vector3(speedX, speedY, speedZ),
          rotation: new THREE.Euler(0, logRotationYRef.current, 0),
          angularVelocity: new THREE.Vector3(spinX, spinY, spinZ),
          opacity: 1.0,
          age: 0,
          isLeft: isLeft,
        };
        spawnedCount++;
      }
    }

    // 6. Spawn new log from above
    newLogYRef.current = 2.5;
    newLogVRef.current = 0.0;
    logRotationYRef.current = Math.random() * Math.PI * 2;
  };

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const { progress } = useGameStore.getState();
    const fire = progress.firewood ?? 0;

    // ==========================================
    // AXE SWING STATE MACHINE
    // ==========================================
    if (axeRef.current) {
      if (isInteracting) {
        if (swingStateRef.current !== "idle") {
          swingTimeRef.current += delta;
          
          let rotX = 0.8; // default idle position (pointing up-forward)
          
          if (swingStateRef.current === "swing") {
            const duration = 0.12; // snappy downswing
            const nProgress = Math.min(1.0, swingTimeRef.current / duration);
            rotX = THREE.MathUtils.lerp(0.8, -0.42, nProgress * nProgress); // Ease-in
            
            if (nProgress >= 1.0) {
              triggerImpact();
              swingStateRef.current = "bounce";
              swingTimeRef.current = 0;
            }
          } else if (swingStateRef.current === "bounce") {
            const duration = 0.10; // bounce back up slightly
            const nProgress = Math.min(1.0, swingTimeRef.current / duration);
            rotX = THREE.MathUtils.lerp(-0.42, -0.22, Math.sin(nProgress * Math.PI / 2));
            
            if (nProgress >= 1.0) {
              swingStateRef.current = "return";
              swingTimeRef.current = 0;
            }
          } else if (swingStateRef.current === "return") {
            const duration = 0.40; // return to idle slowly
            const nProgress = Math.min(1.0, swingTimeRef.current / duration);
            rotX = THREE.MathUtils.lerp(-0.22, 0.8, nProgress);
            
            if (nProgress >= 1.0) {
              swingStateRef.current = "idle";
              swingTimeRef.current = 0;
            }
          }
          
          axeRef.current.rotation.x = rotX;
        } else {
          // Keep axe steady at idle position when not swinging
          axeRef.current.rotation.x = THREE.MathUtils.lerp(axeRef.current.rotation.x, 0.8, 0.08);
        }
      } else {
        // Reset swing state if interaction ends
        swingStateRef.current = "idle";
        swingTimeRef.current = 0;
        axeRef.current.rotation.x = 0.8;
      }
    }

    // ==========================================
    // FALLING LOG PHYSICS & SQUASH
    // ==========================================
    if (newLogYRef.current > 0.75) {
      newLogVRef.current -= 13.0 * delta; // Gravity
      newLogYRef.current += newLogVRef.current * delta;

      if (newLogYRef.current <= 0.75) {
        newLogYRef.current = 0.75;
        if (Math.abs(newLogVRef.current) > 1.2) {
          newLogVRef.current = -newLogVRef.current * 0.22; // slight bounce
          squishRef.current = Math.min(0.2, 0.12 * Math.abs(newLogVRef.current) / 3);
          playLandSound();
        } else {
          newLogVRef.current = 0;
        }
      }
    }

    // Recover squish shape
    if (squishRef.current > 0) {
      squishRef.current -= delta * 2.2;
      if (squishRef.current < 0) squishRef.current = 0;
    }

    // Update standing log mesh transform
    if (logGroupRef.current) {
      // Rotate log slowly when walking around to display bark details
      if (!isInteracting) {
        logRotationYRef.current += delta * 0.15;
      }
      logGroupRef.current.position.set(0, newLogYRef.current, 0);
      logGroupRef.current.rotation.y = logRotationYRef.current;
      logGroupRef.current.scale.set(
        1.0 + squishRef.current * 0.5,
        1.0 - squishRef.current,
        1.0 + squishRef.current * 0.5
      );
      // Hide standing log when progress reaches 100
      logGroupRef.current.visible = fire < 100;
    }

    // ==========================================
    // SPLIT PIECES PHYSICS POOL
    // ==========================================
    for (let i = 0; i < MAX_PIECES; i++) {
      const p = piecesPhysics.current[i];
      if (!p || !p.active) continue;

      p.age += delta;
      
      // Gravity
      p.velocity.y -= 9.8 * delta;
      
      // Update position
      p.position.addScaledVector(p.velocity, delta);
      
      // Update rotation
      p.rotation.x += p.angularVelocity.x * delta;
      p.rotation.y += p.angularVelocity.y * delta;
      p.rotation.z += p.angularVelocity.z * delta;

      // Floor bounce (y = 0 is ground)
      const floorY = 0.08;
      if (p.position.y < floorY) {
        p.position.y = floorY;
        p.velocity.y = -p.velocity.y * 0.35; // bounce energy loss
        p.velocity.x *= 0.65;
        p.velocity.z *= 0.65;
        p.angularVelocity.multiplyScalar(0.5);

        if (Math.abs(p.velocity.y) < 0.22) {
          p.velocity.y = 0;
        }
      }

      // Fade out after 1.6 seconds
      if (p.age > 1.6) {
        p.opacity = Math.max(0, 1.0 - (p.age - 1.6) / 0.5);
      }

      const mesh = pieceRefs.current[i];
      if (mesh) {
        if (p.opacity <= 0) {
          p.active = false;
          mesh.visible = false;
        } else {
          mesh.visible = true;
          mesh.position.copy(p.position);
          mesh.rotation.copy(p.rotation);
          if (p.isLeft) {
            mesh.rotation.y += Math.PI; // rotate left piece by 180 deg to mirror it
          }

          // Update material opacities
          if (pieceBarkMatRefs.current[i]) pieceBarkMatRefs.current[i]!.opacity = p.opacity;
          if (pieceInnerMatRefs.current[i]) pieceInnerMatRefs.current[i]!.opacity = p.opacity;
          if (pieceTopMatRefs.current[i]) pieceTopMatRefs.current[i]!.opacity = p.opacity;
          if (pieceBottomMatRefs.current[i]) pieceBottomMatRefs.current[i]!.opacity = p.opacity;
        }
      }
    }

    // ==========================================
    // FLYING WOOD CHIPS PARTICLES
    // ==========================================
    const timeSinceImpact = t - lastImpactTimeRef.current;
    const isBursting = timeSinceImpact < 0.55;

    chipRefs.current.forEach((m, i) => {
      if (!m) return;
      if (!isBursting) {
        m.scale.setScalar(0);
        return;
      }

      // Golden ratio angles for nice distributed spray direction
      const angle = i * 2.399;
      const speedHoriz = 1.6 + Math.sin(i * 19) * 0.5;
      const speedVert = 2.4 + Math.cos(i * 14) * 0.8;
      
      const px = Math.cos(angle) * speedHoriz * timeSinceImpact;
      const pz = Math.sin(angle) * speedHoriz * timeSinceImpact;
      // Projectile formula: y = startY (top of log = 1.0) + v*t - 0.5*g*t^2
      const py = 1.0 + speedVert * timeSinceImpact - 0.5 * 9.8 * timeSinceImpact * timeSinceImpact;

      m.position.set(px, py, pz);
      m.rotation.set(t * 12 + i, t * 10 + i * 2, 0);
      
      // Scale down over lifetime
      const scale = (1.0 - timeSinceImpact / 0.55) * 0.7;
      m.scale.setScalar(scale);
    });

    // ==========================================
    // SPLIT PILE HEIGHT GROWTH
    // ==========================================
    pileRefs.current.forEach((m, i) => {
      if (m) m.visible = fire > ((i + 1) / PILE.length) * 100 - 6;
    });
  });

  return (
    <group position={[8.0, 0, 4.0]}>
      {/* ---------------- CHOPPING BLOCK (TREE STUMP) ---------------- */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry ref={stumpGeoRef} args={[0.35, 0.38, 0.5, 32, 5]} />
        <meshStandardMaterial
          map={textures.bark}
          bumpMap={textures.barkBump}
          bumpScale={0.06}
          roughness={0.9}
        />
      </mesh>
      {/* Stump top end-grain */}
      <mesh position={[0, 0.501, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial
          map={textures.woodRings}
          roughness={0.75}
        />
      </mesh>

      {/* ---------------- STANDING LOG ---------------- */}
      <group ref={logGroupRef} position={[0, 0.75, 0]}>
        {/* Open cylinder bark */}
        <mesh castShadow>
          <cylinderGeometry args={[0.13, 0.14, 0.5, 24, 4, true]} />
          <meshStandardMaterial
            map={textures.bark}
            bumpMap={textures.barkBump}
            bumpScale={0.045}
            roughness={0.88}
          />
        </mesh>
        {/* Log top end-grain */}
        <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <circleGeometry args={[0.13, 24]} />
          <meshStandardMaterial
            map={textures.woodRings}
            roughness={0.7}
          />
        </mesh>
        {/* Log bottom end-grain */}
        <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.14, 24]} />
          <meshStandardMaterial
            map={textures.woodRings}
            roughness={0.7}
          />
        </mesh>
      </group>

      {/* ---------------- POOLED SPLIT PIECES ---------------- */}
      {Array.from({ length: MAX_PIECES }).map((_, idx) => (
        <group key={`split-piece-${idx}`} ref={(el) => { pieceRefs.current[idx] = el; }} visible={false}>
          {/* Half-cylinder bark */}
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.14, 0.5, 12, 2, true, 0, Math.PI]} />
            <meshStandardMaterial
              ref={(el) => { pieceBarkMatRefs.current[idx] = el; }}
              map={textures.bark}
              bumpMap={textures.barkBump}
              bumpScale={0.04}
              roughness={0.88}
              transparent
            />
          </mesh>
          {/* Flat inner split surface */}
          <mesh castShadow receiveShadow>
            <planeGeometry args={[0.26, 0.5]} />
            <meshStandardMaterial
              ref={(el) => { pieceInnerMatRefs.current[idx] = el; }}
              map={textures.woodRings}
              roughness={0.75}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Top Half Cap */}
          <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <circleGeometry args={[0.13, 12, 0, Math.PI]} />
            <meshStandardMaterial
              ref={(el) => { pieceTopMatRefs.current[idx] = el; }}
              map={textures.woodRings}
              roughness={0.7}
              transparent
            />
          </mesh>
          {/* Bottom Half Cap */}
          <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <circleGeometry args={[0.14, 12, 0, Math.PI]} />
            <meshStandardMaterial
              ref={(el) => { pieceBottomMatRefs.current[idx] = el; }}
              map={textures.woodRings}
              roughness={0.7}
              transparent
            />
          </mesh>
        </group>
      ))}

      {/* ---------------- SPLIT FIREWOOD PILE ---------------- */}
      {PILE.map((log, i) => (
        <mesh
          key={`pile-${i}`}
          ref={(el) => { if (el) pileRefs.current[i] = el; }}
          position={log.p}
          rotation={log.r}
          visible={false}
          castShadow
        >
          <cylinderGeometry args={[0.075, 0.075, 0.42, 10, 1, true]} />
          <meshStandardMaterial
            map={textures.bark}
            roughness={0.9}
            color={log.c}
          />
        </mesh>
      ))}

      {/* ---------------- THE AXE (FIRST-PERSON VIEW ATTACHED TO SCREEN/HANDS) ---------------- */}
      <group ref={axeRef} position={[0, 1.4, 0.75]} rotation={[0.8, 0, 0]} visible={isInteracting}>
        {/* Handle */}
        <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.62, 12]} />
          <meshStandardMaterial color="#734924" roughness={0.8} />
        </mesh>
        {/* Axe Head */}
        <group position={[0, 0, -0.6]}>
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.17, 0.1]} />
            <meshStandardMaterial
              map={textures.steel}
              roughness={0.25}
              metalness={0.92}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* Blade Edge */}
          <mesh position={[0, -0.115, 0]} rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.048, 0.12, 4]} />
            <meshStandardMaterial
              map={textures.steel}
              roughness={0.16}
              metalness={0.95}
              envMapIntensity={1.8}
            />
          </mesh>
        </group>
      </group>

      {/* ---------------- FLYING WOOD CHIPS PARTICLES ---------------- */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={`chip-${i}`} ref={(el) => { if (el) chipRefs.current[i] = el; }} castShadow>
          <boxGeometry args={[0.04, 0.02, 0.012]} />
          <meshStandardMaterial color="#e5c195" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
