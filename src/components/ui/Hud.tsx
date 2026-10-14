"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";
import { getSection, sections } from "@/data/sections";
import { personal } from "@/data/personal";
import { siteConfig } from "@/data/config";
import type { Tier } from "@/lib/device";
import { startAmbience, stopAmbience, uiClick } from "@/lib/audio";
import { ResumeAction } from "@/components/content/SectionContents";

/**
 * HUD built as an air-traffic-control flight strip rather than four floating
 * corner clusters. One anchored bar owns the controls, so nothing can collide
 * with anything else — which is what kept breaking on narrow screens.
 */
export default function Hud() {
  const mode = useAppStore((s) => s.mode);
  const currentSection = useAppStore((s) => s.currentSection);
  const toggleMap = useAppStore((s) => s.toggleMap);
  const toggleHelp = useAppStore((s) => s.toggleHelp);
  const toggleSettings = useAppStore((s) => s.toggleSettings);
  const helpOpen = useAppStore((s) => s.helpOpen);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const soundOn = useAppStore((s) => s.soundOn);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const exitToExterior = useAppStore((s) => s.exitToExterior);
  const setPanel = useAppStore((s) => s.setPanel);
  const tier = useAppStore((s) => s.tier);
  const setTier = useAppStore((s) => s.setTier);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const isTouch = useIsTouch();

  const visitedZones = useAppStore((s) => s.visitedZones);
  const openedProjects = useAppStore((s) => s.openedProjects);
  const announcement = useAppStore((s) => s.announcement);
  const announce = useAppStore((s) => s.announce);
  const seatAt = useAppStore((s) => s.seatAt);
  const setSeatAt = useAppStore((s) => s.setSeatAt);

  const section = getSection(currentSection);
  const idx = sections.findIndex((s) => s.id === currentSection);
  const explored = visitedZones.length;
  const progress = (explored / sections.length) * 100;
  const allSeen = explored >= sections.length;

  // Cabin PA: greet each newly-reached zone once, then clear itself.
  const lastZone = useRef<string | null>(null);
  useEffect(() => {
    if (mode !== "interior") return;
    if (lastZone.current === currentSection) return;
    lastZone.current = currentSection;
    announce(`Now entering ${section.zoneName} — ${section.tagline}`);
    const t = setTimeout(() => announce(null), 4200);
    return () => clearTimeout(t);
  }, [currentSection, mode, section.zoneName, section.tagline, announce]);

  useEffect(() => {
    if (soundOn) startAmbience(mode === "interior");
    else stopAmbience();
  }, [soundOn, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useAppStore.getState();
      if (st.openPanel) st.setPanel(null);
      else if (st.mapOpen) st.toggleMap(false);
      else if (st.helpOpen) st.toggleHelp(false);
      else if (st.settingsOpen) st.toggleSettings(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ══ top bar: identity + primary nav ══ */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex items-start justify-between gap-2 px-3 sm:px-4"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="pointer-events-auto slate flex items-center gap-2 px-2.5 py-1.5">
          <span className="beacon block h-1.5 w-1.5 shrink-0 rounded-full bg-signal" aria-hidden />
          <span className="readout truncate text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-paper-100">
            <span className="hidden sm:inline">{personal.name} · </span>HJ&nbsp;001
          </span>
        </div>

        <div className="pointer-events-auto flex shrink-0 gap-1.5 sm:gap-2">
          {mode === "interior" && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => { uiClick(soundOn); exitToExterior(); }}
              aria-label="Return to exterior view"
            >
              ⤴<span className="hidden sm:inline">&nbsp;Exterior</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => { uiClick(soundOn); toggleMap(); }}
            aria-label="Open cabin map"
          >
            ▦<span className="hidden sm:inline">&nbsp;Map</span>
          </button>
          <Link href="/recruiter" className="btn btn--sm btn--signal">
            ★&nbsp;Recruiter
          </Link>
        </div>
      </div>

      {/* ══ cabin PA announcement ══ */}
      <AnimatePresence>
        {mode === "interior" && announcement && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28 }}
            className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3"
            style={{ bottom: "calc(max(0.75rem, env(safe-area-inset-bottom)) + 4.2rem)" }}
          >
            <div className="slate flex max-w-[92vw] items-center gap-2 px-3 py-1.5">
              <span aria-hidden className="text-signal">✦</span>
              <span className="readout truncate text-[0.62rem] uppercase tracking-[0.14em] text-paper-100">
                {announcement}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ bottom flight strip (cabin only) ══ */}
      {mode === "interior" && (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 px-3 sm:px-4"
          style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className={`pointer-events-auto paper mx-auto flex max-w-3xl items-stretch overflow-hidden ${
              isTouch ? "ml-auto mr-0 w-fit sm:mx-auto" : ""
            }`}
          >
            {/* zone readout */}
            <button type="button" onClick={()=>setPanel(currentSection)} aria-label={`Read ${section.name}`} className="flex min-w-0 items-center gap-2.5 px-3 py-2 text-left hover:bg-paper-200">
              <span className="index-num text-base leading-none">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.82rem] font-bold leading-tight text-ink-900">
                  {section.zoneName}
                </span>
                <span className="label block truncate text-[0.5rem]">{section.name}</span>
              </span>
            </button>

            {/* exploration progress — desktop */}
            <div className="hidden flex-1 flex-col justify-center border-l-[1.5px] border-ink-900 px-3 md:flex">
              <div className="flex items-baseline justify-between">
                <span className="label text-[0.5rem]">
                  {allSeen ? "Cabin fully explored" : "Cabin explored"}
                </span>
                <span className="readout text-[0.58rem] font-bold text-ink-900">
                  {explored}/{sections.length} zones
                  {openedProjects.length > 0 && ` · ${openedProjects.length} exhibits`}
                </span>
              </div>
              <div className="relative mt-1 h-1.5 w-full bg-paper-300">
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    allSeen ? "bg-runway" : "bg-signal"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* utilities */}
            <div className="flex items-center gap-1 border-l-[1.5px] border-ink-900 px-2">
              {seatAt && <button type="button" className="btn btn--sm" onClick={() => setSeatAt(null)}>Stand</button>}
              {!isTouch && (
                <button type="button" className="btn btn--sm" onClick={() => setPanel("comms")}>
                  ✉<span className="hidden lg:inline">&nbsp;Contact</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn--sm"
                onClick={toggleSound}
                aria-pressed={soundOn}
                aria-label={soundOn ? "Mute ambient sound" : "Enable ambient sound"}
              >
                {soundOn ? "♪" : "♪̸"}
              </button>
              <button type="button" className="btn btn--sm" onClick={() => toggleSettings()} aria-label="Settings">
                ⚙
              </button>
              <button type="button" className="btn btn--sm" onClick={() => toggleHelp()} aria-label="Help and controls">
                ?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ exterior utilities ══
          Stacked against the right edge on phones (the boarding pass owns the
          bottom of the screen there) and tucked bottom-right on desktop. */}
      {/* phones: stacked under the flight-number chip, clear of the diagonal
          airframe and the boarding pass. desktop: tucked bottom-right. */}
      {mode !== "interior" && (
        <div className="pointer-events-auto fixed left-3 top-20 z-30 flex flex-col gap-1.5 sm:bottom-4 sm:left-auto sm:right-3 sm:top-auto sm:flex-row">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute ambient sound" : "Enable ambient sound"}
          >
            {soundOn ? "♪" : "♪̸"}
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => toggleSettings()} aria-label="Settings">
            ⚙
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => toggleHelp()} aria-label="Help and controls">
            ?
          </button>
        </div>
      )}

      {/* ══ help ══ */}
      <AnimatePresence>
        {helpOpen && (
          <Sheet title="Controls" index="—" onClose={() => toggleHelp(false)}>
            <div className="space-y-5 text-[0.88rem] text-ink-600">
              <p className="text-xs leading-relaxed">Aircraft: Ryan Miller and FlightGear CRJ700 contributors, CC BY 4.0; converted exterior with simulator components removed. Interior chair, walnut and skies: Poly Haven, CC0. <a href="https://github.com/FGMEMBERS-NONGPL/CRJ700-family" target="_blank" rel="noreferrer" className="underline text-signal">Aircraft source and credits</a></p>
              <Block label="Exterior">
                <li>Hit <b className="text-ink-900">Board</b> on the pass, or click the aircraft.</li>
                <li>Use the <b className="text-ink-900">cabin manifest</b> or <b className="text-ink-900">Map</b> to enter at a chosen zone.</li>
              </Block>
              <Block label="Inside the cabin">
                {isTouch ? (
                  <>
                    <li><b className="text-ink-900">Left stick</b> — walk</li>
                    <li><b className="text-ink-900">Jump</b> — hop in the aisle</li>
                    <li><b className="text-ink-900">Tap a seat</b> — sit; tap Stand up to leave</li>
                    <li><b className="text-ink-900">Drag elsewhere</b> — look around</li>
                    <li><b className="text-ink-900">Tap an exhibit</b> — open it</li>
                    <li><b className="text-ink-900">Map</b> — jump between zones</li>
                  </>
                ) : (
                  <>
                    <li><b className="text-ink-900">W A S D</b> / arrows — walk</li>
                    <li><b className="text-ink-900">Space</b> — jump</li>
                    <li><b className="text-ink-900">Click a seat</b> — sit; press E to stand</li>
                    <li><b className="text-ink-900">Click + drag</b> — look around</li>
                    <li><b className="text-ink-900">Click an exhibit</b> — open it</li>
                    <li><b className="text-ink-900">Map</b> — jump between zones</li>
                    <li><b className="text-ink-900">Esc</b> — close panels</li>
                  </>
                )}
              </Block>
              <p className="border-t-[1.5px] border-ink-900 pt-3 text-[0.8rem]">
                Prefer a plain page?{" "}
                <Link className="font-semibold text-signal underline" href="/recruiter">
                  Recruiter Mode
                </Link>{" "}
                has everything in one fast scroll.
              </p>
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      {/* ══ settings ══ */}
      <AnimatePresence>
        {settingsOpen && (
          <Sheet title="Settings" index="—" onClose={() => toggleSettings(false)}>
            <div className="space-y-5">
              <div>
                <div className="label mb-2">Detail level</div>
                <div className="flex gap-1.5">
                  {(["high", "mid", "low"] as Tier[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTier(t)}
                      className={`btn btn--sm flex-1 ${tier === t ? "btn--signal" : ""}`}
                      aria-pressed={tier === t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[0.75rem] leading-snug text-ink-400">
                  Set automatically from your device, and lowered on its own if the
                  frame rate drops. Pick <b>low</b> to force the lightest scene.
                </p>
              </div>
              <div>
                <div className="label mb-2">Motion</div>
                <button
                  type="button"
                  className={`btn btn--sm ${reducedMotion ? "btn--signal" : ""}`}
                  onClick={() => setReducedMotion(!reducedMotion)}
                  aria-pressed={reducedMotion}
                >
                  {reducedMotion ? "Reduced motion: on" : "Reduced motion: off"}
                </button>
              </div>
              <div>
                <div className="label mb-2">Sound</div>
                <button
                  type="button"
                  className={`btn btn--sm ${soundOn ? "btn--signal" : ""}`}
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                >
                  {soundOn ? "Ambient: on" : "Ambient: off"}
                </button>
                {siteConfig.soundEnabled && (
                  <p className="mt-2 text-[0.75rem] text-ink-400">
                    All audio is procedural and always optional.
                  </p>
                )}
              </div>
              <div className="border-t-[1.5px] border-ink-900 pt-4">
                <ResumeAction />
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <ul className="space-y-1 [&>li]:flex [&>li]:gap-2">{children}</ul>
    </div>
  );
}

export function Sheet({
  title,
  index,
  onClose,
  children,
}: {
  title: string;
  index: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 14, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="paper w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b-[1.5px] border-ink-900 px-4 py-3">
          <span className="index-num text-sm">{index}</span>
          <h2 className="display text-xl text-ink-900">{title}</h2>
          <button type="button" className="btn btn--sm ml-auto" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

