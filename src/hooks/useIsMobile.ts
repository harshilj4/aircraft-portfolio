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
 * Touch devices never default to "high" — phone GPUs pay a much higher price
 * for the rain/cloud density and 2× DPR than laptops do.
 */
export function detectDefaultQuality(): "high" | "balanced" | "performance" {
  if (typeof window === "undefined") return "balanced";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) return cores >= 6 ? "balanced" : "performance";
  if (cores >= 8 && mem >= 8) return "high";
  if (cores <= 4 || mem <= 4) return "performance";
  return "balanced";
}
