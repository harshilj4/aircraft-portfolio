"use client";

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import { getProfile, demote, type Tier, type PerfProfile } from "@/lib/device";
import { useIsTouch } from "@/hooks/useIsMobile";
import ExteriorScene from "./three/ExteriorScene";
const CabinScene = lazy(() => import("./three/CabinScene"));
import Hud from "./ui/Hud";
import SectionPanel from "./ui/SectionPanel";
import AircraftMap from "./ui/AircraftMap";
import LandingOverlay from "./ui/LandingOverlay";
import LoadingGate from "./ui/LoadingGate";
import ControlsHint from "./ui/ControlsHint";
import TouchControls from "./ui/TouchControls";
import FlightConditions from "./ui/FlightConditions";

/**
 * The 3D experience — one build for every device. Exterior dawn cruise ⇄
 * walkable cabin, joined by a boarding fly-in.
 *
 * Quality is expressed as a device tier (see lib/device.ts) rather than a
 * user-facing "graphics" switch: the tier picks resolution, cloud density and
 * light count together, and the live frame-rate monitor steps it down if the
 * device cannot hold the frame. Users can still override it in Settings.
 */
/** Dev-only: surfaces renderer counters so scene cost can be measured, not guessed. */
function RenderStats() {
  const { gl } = useThree();
  const sample = useRef({ enabled: false, time: 0, frames: 0, times: [] as number[] });
  useEffect(() => { sample.current.enabled = process.env.NODE_ENV === "development" || new URLSearchParams(window.location.search).has("perf"); }, []);
  useFrame((_, dt) => {
    const s = sample.current;
    if (!s.enabled || dt > 0.25) return;
    s.time += dt; s.frames++; s.times.push(dt * 1000);
    if (s.time < 3) return;
    const i = gl.info;
    s.times.sort((a, b) => a - b);
    gl.domElement.dataset.flightPerf = JSON.stringify({
      mode: useAppStore.getState().mode,
      fps: Math.round(s.frames / s.time),
      p95ms: Math.round(s.times[Math.floor(s.times.length * 0.95)] * 10) / 10,
      calls: i.render.calls,
      triangles: i.render.triangles,
      geometries: i.memory.geometries,
      textures: i.memory.textures,
      dpr: gl.getPixelRatio(),
    });
    s.time = 0; s.frames = 0; s.times.length = 0;
  });
  return null;
}

/** Keep a single WebGL context across quality changes; cap mobile fill rate.
 * Demand rendering also sleeps completely in a hidden browser tab. */
function RenderBudget({ profile }: { profile: PerfProfile }) {
  const { size, setDpr, invalidate } = useThree();
  const mode = useAppStore(s => s.mode);
  const reading = useAppStore(s => Boolean(s.openPanel || s.mapOpen || s.helpOpen || s.settingsOpen));
  const quality = useRef({ dpr: 1.5, ceiling: 2, elapsed: 0, frames: 0, slow: 0, stable: 0, grace: 4 });
  useEffect(() => {
    const pixels = profile.touch ? 1_800_000 : 4_500_000;
    const ceiling = Math.max(0.65, Math.min(profile.dpr[1], Math.sqrt(pixels / Math.max(1, size.width * size.height))));
    const dpr = profile.touch ? Math.min(1.5, ceiling) : ceiling;
    quality.current = { dpr, ceiling, elapsed: 0, frames: 0, slow: 0, stable: 0, grace: 4 };
    setDpr(dpr);
  }, [profile.touch, profile.dpr[1], size.width, size.height, setDpr]);
  useEffect(() => {
    Object.assign(quality.current, { elapsed: 0, frames: 0, slow: 0, stable: 0, grace: 3 });
  }, [mode, reading]);
  useFrame((_, dt) => {
    if (!profile.touch || reading || document.hidden || mode === "boarding" || useAppStore.getState().scenePending) return;
    const q = quality.current;
    if (dt > .25) { q.grace = 2; return; }
    if (q.grace > 0) { q.grace -= dt; return; }
    q.elapsed += dt; q.frames++; if (dt > .023) q.slow++;
    if (q.elapsed < 2) return;
    const missed = q.slow / q.frames;
    let next = q.dpr;
    if (missed > .12) { next = Math.max(.75, q.dpr - .15); q.stable = 0; }
    else if (missed < .025 && ++q.stable >= 3) { next = Math.min(q.ceiling, q.dpr + .1); q.stable = 0; }
    else if (missed >= .025) q.stable = 0;
    q.elapsed = 0; q.frames = 0; q.slow = 0;
    if (Math.abs(next - q.dpr) > .01) { q.dpr = next; setDpr(next); q.grace = 1; }
  });
  useEffect(() => {
    let id = 0, last = 0;
    // A reading panel needs little background motion; spare GPU time for scrolling.
    const interval = reading ? 1000 / 30 : profile.touch ? 1000 / 60 : 0;
    const frame = (now: number) => {
      if (document.hidden) { last = 0; id = requestAnimationFrame(frame); return; }
      const elapsed = now - last;
      if (!interval || elapsed >= interval - 0.75) {
        last = interval && elapsed >= interval ? now - (elapsed % interval) : now;
        invalidate();
      }
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [profile.touch, reading, invalidate]);
  return null;
}

export default function Experience() {
  const mode = useAppStore((s) => s.mode);
  const tierOverride = useAppStore((s) => s.tier);
  const setTier = useAppStore((s) => s.setTier);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const enterInterior = useAppStore((s) => s.enterInterior);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const scenePending = useAppStore(s => s.scenePending);
  const mobile = useIsTouch();
  const [fade, setFade] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const autoDrops = useRef(0);

  const profile = useMemo(() => getProfile(tierOverride ?? undefined), [tierOverride, mobile]);

  useEffect(() => {
    if (!useAppStore.getState().tier) setTier(getProfile().tier);
    const conditions = ["morning", "evening", "midnight"] as const;
    useAppStore.getState().setTimeOfDay(conditions[Math.floor(Math.random() * conditions.length)]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sustained-low-FPS safety net: at most two automatic steps down. */
  const onDecline = () => {
    const state = useAppStore.getState();
    if (profile.touch || state.openPanel || state.mapOpen || state.helpOpen || state.settingsOpen) return;
    if (autoDrops.current >= 2) return;
    const next = demote(useAppStore.getState().tier ?? "mid");
    if (next) {
      autoDrops.current += 1;
      setTier(next as Tier);
    }
  };

  // boarding choreography
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (mode === "boarding") {
      const flight = reducedMotion ? 100 : 1150;
      timers.current.push(
        setTimeout(() => setFade(1), flight),
        setTimeout(() => enterInterior(), flight + 520)
      );
    }
    if (mode === "interior" && !scenePending) timers.current.push(setTimeout(() => setFade(0), 120));
    if (mode === "landing") setFade(0);
    return () => timers.current.forEach(clearTimeout);
  }, [mode, enterInterior, reducedMotion, scenePending]);

  return (
    <div className="flight-experience fixed inset-0 bg-[#050a12]" data-time-of-day={timeOfDay}>
      <Canvas
        frameloop="demand"
        dpr={profile.dpr}
        /* `flat` = NoToneMapping. R3F defaults to ACES filmic, which crushes a
           deliberately-authored bright palette into grey mud — every colour in
           this scene is picked to be shown as written. */
        flat
        camera={{ position: [40, 16, 92], fov: 46, near: 0.1, far: 2600 }}
        gl={{
          antialias: profile.antialias,
          powerPreference: "high-performance",
          // the sky dome covers every pixel, so the colour clear is wasted work
          alpha: false,
          stencil: false,
          depth: true,
        }}
      >
        <RenderBudget profile={profile} />
        <PerformanceMonitor iterations={7} threshold={0.75} bounds={() => profile.touch ? [42, 58] : [48, 85]} onDecline={onDecline}>
          <Suspense fallback={null}>
            {mode === "interior" ? (
              <CabinScene profile={profile} />
            ) : (
              <ExteriorScene profile={profile} />
            )}
          </Suspense>
          <RenderStats />
        </PerformanceMonitor>
      </Canvas>

      {/* boarding fade */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] bg-[#101720] transition-opacity duration-500"
        style={{ opacity: fade }}
      />
      {mode === "interior" && scenePending && <div className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center text-sm tracking-widest text-[#e7d4b5]" role="status">Preparing your cabin…</div>}

      <LoadingGate />
      <LandingOverlay />
      <ControlsHint />
      <TouchControls />
      <Hud />
      <FlightConditions />
      <SectionPanel />
      <AircraftMap />
    </div>
  );
}


