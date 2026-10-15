/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEVICE & PERFORMANCE PROFILE — the single source of truth for how heavy the
 * scene is allowed to be.
 * ─────────────────────────────────────────────────────────────────────────────
 * Hard-won rule behind these numbers: phone GPUs are fill-rate bound, not
 * triangle bound. What kills them is (a) resolution, (b) large overlapping
 * transparent surfaces, and (c) per-fragment dynamic lighting. Triangles are
 * nearly free by comparison. So on mobile we keep the geometry and spend the
 * budget by cutting DPR, overdraw and light count — never by making the scene
 * look emptier.
 */

export type Tier = "low" | "mid" | "high";

export interface PerfProfile {
  tier: Tier;
  touch: boolean;
  /** [min, max] renderer pixel ratio */
  dpr: [number, number];
  antialias: boolean;
  /** parallax cloud banks around the aircraft */
  cloudBanks: number;
  /** horizon cloud-sea layers */
  seaLayers: number;
  /** true = allow the extra rim/fill light in the cabin */
  richLighting: boolean;
  /** dust motes in the cabin */
  motes: number;
  /** contrail ribbons behind the wings */
  contrails: boolean;
}

function detectTier(touch: boolean): Tier {
  if (typeof window === "undefined") return "mid";
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  if (touch) {
    // Safari clamps hardwareConcurrency and never reports deviceMemory, so a
    // phone that looks weak here usually is not — start mid and let the live
    // FPS monitor demote if the frame time actually says so.
    return mem <= 2 ? "low" : "mid";
  }
  if (cores >= 8 && mem >= 8) return "high";
  if (cores <= 4 || mem <= 4) return "low";
  return "mid";
}

export function getProfile(forceTier?: Tier): PerfProfile {
  const touch =
    typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 640px)").matches);
  const tier = forceTier ?? detectTier(touch);
  const deviceDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  if (tier === "low") {
    return {
      tier, touch,
      dpr: [0.75, Math.min(touch ? 1.5 : 1.25, deviceDpr)],
      antialias: false,
      cloudBanks: 4,
      seaLayers: 2,
      richLighting: false,
      motes: 0,
      contrails: false,
    };
  }
  if (tier === "mid") {
    return {
      tier, touch,
      // Start at 1.5x on phones; measured frame times control recovery to 2x.
      dpr: [0.85, Math.min(touch ? 2 : 1.75, deviceDpr)],
      antialias: true,
      cloudBanks: 9,
      seaLayers: 3,
      richLighting: !touch,
      motes: 0,
      contrails: !touch,
    };
  }
  return {
    tier, touch,
    dpr: [1, Math.min(2, deviceDpr)],
    antialias: true,
    cloudBanks: 16,
    seaLayers: 4,
    richLighting: !touch,
    motes: touch ? 0 : 45,
    contrails: !touch,
  };
}

/** Step down one tier — used by the live frame-rate monitor. */
export function demote(t: Tier): Tier | null {
  return t === "high" ? "mid" : t === "mid" ? "low" : null;
}
