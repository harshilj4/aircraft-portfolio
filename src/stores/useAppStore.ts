"use client";

import { create } from "zustand";
import type { SectionId } from "@/data/sections";
import type { Tier } from "@/lib/device";

/** Global experience state (3D mode, panels, settings). */
export type Mode = "landing" | "boarding" | "interior";
export type TimeOfDay = "morning" | "evening" | "midnight";

interface AppState {
  ready: boolean; // 3D scene has produced its first frame
  scenePending: boolean;
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
  /** null until the device has been profiled on first client render */
  tier: Tier | null;
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;

  /** Exploration progress — gives the cabin walk a purpose beyond sightseeing */
  visitedZones: SectionId[];
  openedProjects: string[];
  /** Transient cabin-PA line, shown briefly on the flight strip */
  announcement: string | null;
  seatAt: { x: number; z: number } | null;

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
  setTier: (t: Tier) => void;
  announce: (msg: string | null) => void;
  setSeatAt: (seat: { x: number; z: number } | null) => void;
}

/** Dev/testing hook: the store is reachable from the console as __app. */
export const useAppStore = create<AppState>((set) => ({
  ready: false,
  scenePending: false,
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
  tier: null,
  timeOfDay: "evening",
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  visitedZones: [],
  openedProjects: [],
  announcement: null,
  seatAt: null,

  setReady: () => set({ ready: true, scenePending: false }),
  board: (section = "projects") =>
    set({ mode: "boarding", currentSection: section, mapOpen: false, scenePending: true }),
  // the zone you board into counts as visited — otherwise progress never
  // registers the first zone, since setCurrentSection only fires on a change
  enterInterior: () =>
    set((st) => ({
      mode: "interior",
      visitedZones: st.visitedZones.includes(st.currentSection)
        ? st.visitedZones
        : [...st.visitedZones, st.currentSection],
    })),
  exitToExterior: () =>
    set({ mode: "landing", openPanel: null, openProject: null, mapOpen: false, seatAt: null }),
  setCurrentSection: (s) =>
    set((st) => ({
      currentSection: s,
      visitedZones: st.visitedZones.includes(s) ? st.visitedZones : [...st.visitedZones, s],
    })),
  setPanel: (p) => set({ openPanel: p, openProject: null }),
  setProject: (id) =>
    set((st) => ({
      openProject: id,
      openedProjects:
        id && !st.openedProjects.includes(id)
          ? [...st.openedProjects, id]
          : st.openedProjects,
    })),
  requestJump: (s) => set({ jumpTo: s, mapOpen: false, openPanel: null, seatAt: null }),
  consumeJump: () => set({ jumpTo: null }),
  toggleMap: (v) => set((st) => ({ mapOpen: v ?? !st.mapOpen })),
  toggleHelp: (v) => set((st) => ({ helpOpen: v ?? !st.helpOpen })),
  toggleSettings: (v) => set((st) => ({ settingsOpen: v ?? !st.settingsOpen })),
  toggleSound: () => set((st) => ({ soundOn: !st.soundOn })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setTier: (t) => set({ tier: t }),
  announce: (msg) => set({ announcement: msg }),
  setSeatAt: (seat) => set({ seatAt: seat }),
}));

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as { __app: typeof useAppStore }).__app = useAppStore;
}
