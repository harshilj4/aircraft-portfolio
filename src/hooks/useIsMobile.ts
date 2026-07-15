"use client";

import { useEffect, useState } from "react";

/**
 * Detects touch-first devices (phones/tablets). The full 3D experience runs
 * everywhere — this only decides whether to show touch controls (joystick,
 * tap hints) instead of keyboard/mouse instructions.
 * Returns `false` on the first render to avoid hydration mismatches.
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const check = () => setIsTouch(mq.matches);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  return isTouch;
}

/**
 * Rough GPU/device capability check used to pick a default quality level.
 * Touch devices always start at "balanced": they render at near-native DPR
 * with thinned particle counts, and the in-canvas FPS monitor steps weak
 * phones down automatically — that beats guessing from core counts, which
 * Safari deliberately misreports.
 */
export function detectDefaultQuality(): "high" | "balanced" | "performance" {
  if (typeof window === "undefined") return "balanced";
  if (window.matchMedia("(pointer: coarse)").matches) return "balanced";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  if (cores >= 8 && mem >= 8) return "high";
  if (cores <= 4 || mem <= 4) return "performance";
  return "balanced";
}
