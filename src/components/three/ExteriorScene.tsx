"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, GradientTexture } from "@react-three/drei";
import Aircraft from "./Aircraft";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Night-storm exterior: purple/blue/black sky, dense drifting cloud layers and
 * live lightning (jagged bolts + global flashes). Everything procedural.
 */

/** Touch devices trade particle density for native-resolution rendering. */
const IS_COARSE =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

const BOARD_X: Record<string, number> = {
  cockpit: -25.5,
  projects: -13,
  research: -5,
  briefing: 2,
  systems: 9,
  comms: 16,
};

function useCloudTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.4, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

interface Puff {
  pos: THREE.Vector3;
  scale: number;
  opacity: number;
  speed: number;
  color: string;
}

/** Storm cloud palette — indigo, slate-purple, near-black. */
const CLOUD_COLORS = ["#5a5382", "#494273", "#3a3560", "#2c2848", "#221e3a"];

function StormClouds() {
  const texture = useCloudTexture();
  const quality = useAppStore((s) => s.quality);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const groupRef = useRef<THREE.Group>(null!);

  const puffs = useMemo<Puff[]>(() => {
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const base = quality === "high" ? 60 : quality === "balanced" ? 40 : 18;
    // cloud sprites are pure overdraw — the thing phone GPUs choke on
    const n = Math.round(base * (IS_COARSE ? 0.55 : 1));
    const list: Puff[] = [];
    // heavy storm deck below
    for (let i = 0; i < n; i++) {
      list.push({
        pos: new THREE.Vector3(rng(-190, 190), rng(-34, -12), rng(-110, 110)),
        scale: rng(50, 130),
        opacity: rng(0.5, 0.85),
        speed: rng(8, 15),
        color: pick(CLOUD_COLORS),
      });
    }
    // brooding upper layer pressing down
    for (let i = 0; i < n * 0.6; i++) {
      list.push({
        pos: new THREE.Vector3(rng(-220, 220), rng(24, 55), rng(-160, 160)),
        scale: rng(70, 150),
        opacity: rng(0.4, 0.7),
        speed: rng(10, 18),
        color: pick(CLOUD_COLORS.slice(2)),
      });
    }
    // mid-level scud racing past at flight level
    for (let i = 0; i < n * 0.5; i++) {
      list.push({
        pos: new THREE.Vector3(rng(-240, 240), rng(-8, 14), rng(45, 200) * (Math.random() > 0.5 ? 1 : -1)),
        scale: rng(22, 60),
        opacity: rng(0.25, 0.5),
        speed: rng(16, 28),
        color: pick(CLOUD_COLORS.slice(0, 3)),
      });
    }
    return list;
  }, [quality]);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    const g = groupRef.current;
    for (let i = 0; i < g.children.length; i++) {
      const sp = g.children[i];
      sp.position.x += puffs[i].speed * dt;
      if (sp.position.x > 260) sp.position.x = -260;
    }
  });

  return (
    <group ref={groupRef}>
      {puffs.map((p, i) => (
        <sprite key={i} position={p.pos} scale={[p.scale, p.scale * 0.55, 1]}>
          <spriteMaterial map={texture} color={p.color} transparent opacity={p.opacity} depthWrite={false} />
        </sprite>
      ))}
    </group>
  );
}

/** Driving rain — instanced streak lines swept down and aft by the slipstream. */
function Rain() {
  const quality = useAppStore((s) => s.quality);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const count = Math.round((quality === "high" ? 750 : 450) * (IS_COARSE ? 0.6 : 1));
  const geomRef = useRef<THREE.BufferGeometry>(null!);

  const data = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 220;
      const y = (Math.random() - 0.5) * 110 + 10;
      const z = (Math.random() - 0.5) * 220;
      pos.set([x, y, z, x + 0.9, y - 2.1, z], i * 6);
      speed[i] = 45 + Math.random() * 30;
    }
    return { pos, speed };
  }, [count]);

  useFrame((_, dt) => {
    if (reducedMotion || !geomRef.current) return;
    const attr = geomRef.current.attributes.position as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      const s = data.speed[i];
      const dy = s * dt;
      const dx = s * 0.45 * dt;
      a[o] += dx; a[o + 1] -= dy;
      a[o + 3] += dx; a[o + 4] -= dy;
      if (a[o + 1] < -55) {
        const x = (Math.random() - 0.5) * 220;
        const z = (Math.random() - 0.5) * 220;
        const y = 55 + Math.random() * 15;
        a[o] = x; a[o + 1] = y; a[o + 2] = z;
        a[o + 3] = x + 0.9; a[o + 4] = y - 2.1; a[o + 5] = z;
      }
    }
    attr.needsUpdate = true;
  });

  if (quality === "performance") return null;
  return (
    <lineSegments key={count} frustumCulled={false}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#8890cc"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** Live lightning: random jagged bolts + a global flash light. */
function Lightning() {
  const quality = useAppStore((s) => s.quality);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const flashLight = useRef<THREE.DirectionalLight>(null!);
  const fillLight = useRef<THREE.AmbientLight>(null!);
  const state = useRef({ next: 1.5, until: 0 });

  const bolt = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(16 * 3), 3));
    const mat = new THREE.LineBasicMaterial({ color: "#e6e1ff", transparent: true, opacity: 0 });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    return line;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const s = state.current;

    if (t > s.next) {
      // trigger a strike
      s.until = t + 0.4;
      s.next = t + (reducedMotion ? 12 : 2.2 + Math.random() * 5.5);
      const bx = (Math.random() - 0.5) * 380;
      const bz = -60 - Math.random() * 200 * (Math.random() > 0.35 ? 1 : -1);
      flashLight.current.position.set(bx, 60, bz);
      if (quality !== "performance" && !reducedMotion) {
        // build a jagged bolt from the upper deck downward
        const pos = bolt.geometry.getAttribute("position") as THREE.BufferAttribute;
        let px = bx, py = 45 + Math.random() * 25, pz = bz;
        for (let i = 0; i < 16; i++) {
          pos.setXYZ(i, px, py, pz);
          px += (Math.random() - 0.5) * 14;
          pz += (Math.random() - 0.5) * 8;
          py -= 6 + Math.random() * 6;
        }
        pos.needsUpdate = true;
        bolt.visible = true;
      }
    }

    if (t < s.until) {
      const k = (s.until - t) / 0.4;
      // stuttering flicker like a real strike
      const flicker = Math.sin(t * 90) > -0.2 ? 1 : 0.15;
      flashLight.current.intensity = 5.5 * k * flicker;
      fillLight.current.intensity = 1.1 * k * flicker;
      (bolt.material as THREE.LineBasicMaterial).opacity = Math.min(1, k * 1.6) * flicker;
    } else {
      flashLight.current.intensity = 0;
      fillLight.current.intensity = 0;
      bolt.visible = false;
    }
  });

  return (
    <>
      <directionalLight ref={flashLight} intensity={0} color="#d9d2ff" />
      <ambientLight ref={fillLight} intensity={0} color="#b9b0ff" />
      <primitive object={bolt} />
    </>
  );
}

function ExteriorRig() {
  const { camera, pointer } = useThree();
  const mode = useAppStore((s) => s.mode);
  const currentSection = useAppStore((s) => s.currentSection);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const boardStart = useRef(0);
  const fromPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (mode === "boarding") {
      boardStart.current = performance.now();
      fromPos.current.copy(camera.position);
    }
  }, [mode, camera]);

  useFrame(({ clock }) => {
    if (mode === "boarding") {
      const t = Math.min((performance.now() - boardStart.current) / 1500, 1);
      const e = t * t * (3 - 2 * t);
      const bx = BOARD_X[currentSection] ?? -13;
      const target = new THREE.Vector3(bx, 0.6, 3.6);
      camera.position.lerpVectors(fromPos.current, target, e);
      camera.lookAt(bx, 0.55, 0);
      return;
    }
    // portrait screens get a wider lens + longer orbit so the whole aircraft
    // fits the narrow frame instead of a wall of fuselage
    const cam = camera as THREE.PerspectiveCamera;
    const portrait = cam.aspect < 1.05;
    const fovTarget = portrait ? 66 : 50;
    if (Math.abs(cam.fov - fovTarget) > 0.1) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, fovTarget, 0.08);
      cam.updateProjectionMatrix();
    }
    const zoomOut = portrait ? 1.5 : 1;
    const t = reducedMotion ? 0 : clock.elapsedTime;
    const angle = 0.32 + Math.sin(t * 0.05) * 0.35;
    const radius = (52 + Math.sin(t * 0.033) * 5) * zoomOut;
    const px = Math.sin(angle) * radius - 4 + pointer.x * 3;
    const pz = Math.cos(angle) * radius;
    const py = (8 + Math.sin(t * 0.041) * 3) * zoomOut + pointer.y * 2;
    camera.position.lerp(new THREE.Vector3(px, py, pz), 0.025);
    // portrait: aim lower so the aircraft rides above the hero text overlay
    camera.lookAt(-2, portrait ? -16 : -4.5, 0);
  });
  return null;
}

export default function ExteriorScene() {
  const setReady = useAppStore((s) => s.setReady);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady());
    return () => cancelAnimationFrame(id);
  }, [setReady]);

  return (
    <>
      <fog attach="fog" args={["#161130", 100, 400]} />
      {/* storm sky dome — black zenith through violet horizon */}
      <mesh>
        <sphereGeometry args={[850, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide} fog={false}>
          <GradientTexture
            stops={[0, 0.45, 0.62, 0.78, 1]}
            colors={["#05030c", "#120c28", "#2a2054", "#453473", "#241c44"]}
            size={512}
          />
        </meshBasicMaterial>
      </mesh>
      {/* cold moonlight + violet ambience */}
      <hemisphereLight args={["#5a5490", "#191430", 0.8]} />
      <directionalLight position={[60, 80, 40]} intensity={0.9} color="#9fa2e8" />
      <directionalLight position={[-70, 15, -60]} intensity={0.35} color="#6a5fae" />
      {/* dim procedural reflections keep the hull metallic in the dark */}
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={0.9} rotation-x={Math.PI / 2} position={[0, 40, 0]} scale={[100, 100, 1]} color="#4a4380" />
        <Lightformer intensity={0.7} position={[60, 20, 40]} scale={[40, 40, 1]} color="#8f86d6" />
        <Lightformer intensity={0.25} rotation-x={-Math.PI / 2} position={[0, -40, 0]} scale={[100, 100, 1]} color="#16112c" />
      </Environment>
      {/* black sea far below */}
      <mesh position={[0, -70, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[900, 40]} />
        <meshBasicMaterial color="#0a0817" />
      </mesh>
      <StormClouds />
      <Rain />
      <Lightning />
      <Aircraft />
      <ExteriorRig />
    </>
  );
}
