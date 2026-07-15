"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import { detectDefaultQuality, useIsTouch } from "@/hooks/useIsMobile";
import ExteriorScene from "./three/ExteriorScene";
import CabinScene from "./three/CabinScene";
import Hud from "./ui/Hud";
import SectionPanel from "./ui/SectionPanel";
import AircraftMap from "./ui/AircraftMap";
import LandingOverlay from "./ui/LandingOverlay";
import LoadingGate from "./ui/LoadingGate";
import ControlsHint from "./ui/ControlsHint";
import TouchControls from "./ui/TouchControls";

/**
 * The 3D experience — desktop and mobile alike: exterior flight scene ⇄
 * interior cabin, joined by a cinematic boarding transition (camera flies to
 * the window, fade through, cabin lights up). No page reloads. Touch devices
 * get an on-screen joystick + drag-look instead of WASD + mouse.
 */
export default function Experience() {
  const mode = useAppStore((s) => s.mode);
  const quality = useAppStore((s) => s.quality);
  const isTouch = useIsTouch();
  const setQuality = useAppStore((s) => s.setQuality);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const enterInterior = useAppStore((s) => s.enterInterior);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [fade, setFade] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // sustained-low-FPS safety net: step the quality down at most one notch per
  // level so weaker phones settle instead of stuttering through the storm
  const autoDrops = useRef(0);
  const stepQualityDown = () => {
    if (autoDrops.current >= 2) return;
    const q = useAppStore.getState().quality;
    const next = q === "high" ? "balanced" : q === "balanced" ? "performance" : null;
    if (next) {
      autoDrops.current += 1;
      setQuality(next);
    }
  };

  // one-time environment detection
  useEffect(() => {
    setQuality(detectDefaultQuality());
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // boarding transition choreography
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (mode === "boarding") {
      const flightTime = reducedMotion ? 100 : 1000;
      timers.current.push(
        setTimeout(() => setFade(1), flightTime),
        setTimeout(() => enterInterior(), flightTime + 550)
      );
    }
    // fade back in once the destination scene is mounted (the mode change
    // re-runs this effect and clears any timers from the previous phase)
    if (mode === "interior") {
      timers.current.push(setTimeout(() => setFade(0), 300));
    }
    if (mode === "landing") setFade(0);
    return () => timers.current.forEach(clearTimeout);
  }, [mode, enterInterior, reducedMotion]);

  // Phones pack ~3 device pixels per CSS pixel — rendering below ~2× there
  // looks smeared, so touch devices get near-native resolution and the scene
  // is thinned elsewhere (cloud/rain counts) instead. Desktop keeps the
  // original quality→resolution ladder.
  const deviceDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const dpr: [number, number] = isTouch
    ? quality === "performance"
      ? [1, Math.min(1.8, deviceDpr)]
      : [1, Math.min(2.5, deviceDpr)]
    : quality === "high"
      ? [1, 2]
      : quality === "balanced"
        ? [1, 1.5]
        : [0.8, 1];
  // MSAA is nearly free on mobile tile GPUs and jaggies are what read as
  // "bad graphics" — keep it on for touch at every quality level
  const antialias = isTouch || quality !== "performance";

  return (
    <div className="fixed inset-0">
      {/* key={quality} rebuilds the renderer so quality changes apply instantly
          (resolution, antialiasing, cloud/rain density, light counts) */}
      <Canvas
        key={`${quality}-${isTouch ? "t" : "d"}`}
        dpr={dpr}
        camera={{ position: [26, 8, 46], fov: 50, near: 0.1, far: 1500 }}
        gl={{ antialias, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor iterations={10} threshold={0.7} onDecline={stepQualityDown}>
          <Suspense fallback={null}>
            {mode === "interior" ? <CabinScene /> : <ExteriorScene />}
          </Suspense>
        </PerformanceMonitor>
      </Canvas>

      {/* boarding fade */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] bg-black transition-opacity duration-500"
        style={{ opacity: fade }}
      />

      <LoadingGate />
      <LandingOverlay />
      <ControlsHint />
      <TouchControls />
      <Hud />
      <SectionPanel />
      <AircraftMap />
    </div>
  );
}
