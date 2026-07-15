"use client";

import { create } from "zustand";
import type { SectionId } from "@/data/sections";
import type { Quality } from "@/data/config";

/** Global experience state (3D mode, panels, settings). */
export type Mode = "landing" | "boarding" | "interior";

interface AppState {
  ready: boolean; // 3D scene has produced its first frame
  mode: Mode;
  /** Section the user is boarding into / nearest to inside the cabin */
  currentSection: SectionId;
  /** DOM content panel currently open (null = none) */
  openPanel: SectionId | null;
  /** Project detail open inside a panel */
  openProject: string | null;
  /** Map-jump request consumed by the interior camera controller */
  jumpTo: SectionId | null;
  mapOpen: boolean;
  helpOpen: boolean;
  settingsOpen: boolean;
  soundOn: boolean;
  reducedMotion: boolean;
  quality: Quality;

  setReady: () => void;
  board: (section?: SectionId) => void;
  enterInterior: () => void;
  exitToExterior: () => void;
  setCurrentSection: (s: SectionId) => void;
  setPanel: (p: SectionId | null) => void;
  setProject: (id: string | null) => void;
  requestJump: (s: SectionId) => void;
  consumeJump: () => void;
  toggleMap: (v?: boolean) => void;
  toggleHelp: (v?: boolean) => void;
  toggleSettings: (v?: boolean) => void;
  toggleSound: () => void;
  setReducedMotion: (v: boolean) => void;
  setQuality: (q: Quality) => void;
}

/** Dev/testing hook: the store is reachable from the console as __app. */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  mode: "landing",
  currentSection: "cockpit",
  openPanel: null,
  openProject: null,
  jumpTo: null,
  mapOpen: false,
  helpOpen: false,
  settingsOpen: false,
  soundOn: false, // audio always starts muted (autoplay + accessibility rules)
  reducedMotion: false,
  quality: "balanced",

  setReady: () => set({ ready: true }),
  board: (section = "projects") =>
    set({ mode: "boarding", currentSection: section, mapOpen: false }),
  enterInterior: () => set({ mode: "interior" }),
  exitToExterior: () =>
    set({ mode: "landing", openPanel: null, openProject: null, mapOpen: false }),
  setCurrentSection: (s) => set({ currentSection: s }),
  setPanel: (p) => set({ openPanel: p, openProject: null }),
  setProject: (id) => set({ openProject: id }),
  requestJump: (s) => set({ jumpTo: s, mapOpen: false, openPanel: null }),
  consumeJump: () => set({ jumpTo: null }),
  toggleMap: (v) => set((st) => ({ mapOpen: v ?? !st.mapOpen })),
  toggleHelp: (v) => set((st) => ({ helpOpen: v ?? !st.helpOpen })),
  toggleSettings: (v) => set((st) => ({ settingsOpen: v ?? !st.settingsOpen })),
  toggleSound: () => set((st) => ({ soundOn: !st.soundOn })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setQuality: (q) => set({ quality: q }),
}));

if (typeof window !== "undefined") {
  (window as unknown as { __app: typeof useAppStore }).__app = useAppStore;
}
