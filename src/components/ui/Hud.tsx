"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";
import { getSection } from "@/data/sections";
import { personal } from "@/data/personal";
import { siteConfig, type Quality } from "@/data/config";
import { startAmbience, stopAmbience, uiClick } from "@/lib/audio";
import { ResumeAction } from "@/components/content/SectionContents";

/** Minimal flight-deck HUD layered over the 3D scene. */
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
  const quality = useAppStore((s) => s.quality);
  const setQuality = useAppStore((s) => s.setQuality);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const isTouch = useIsTouch();

  const section = getSection(currentSection);

  // sound follows the toggle + current environment
  useEffect(() => {
    if (soundOn) startAmbience(mode === "interior");
    else stopAmbience();
  }, [soundOn, mode]);

  // Escape closes any open overlay
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
      {/* top-left: identity + current zone (hidden on phone-width landing —
          the hero title already carries the name and the space is needed by
          the Map/Recruiter buttons) */}
      <div className={`pointer-events-none fixed left-4 top-4 z-30 select-none ${mode !== "interior" ? "hidden md:block" : ""}`}>
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-alu-400">
          {personal.name}
        </div>
        {mode === "interior" && (
          <div className="mt-1 flex items-center gap-2">
            <span className="beacon inline-block h-1.5 w-1.5 rounded-full bg-amber-av" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-sky-accent">
              {section.zoneName}
              {/* the tagline needs more width than a phone has next to the buttons */}
              <span className="hidden md:inline"> — {section.tagline}</span>
            </span>
          </div>
        )}
      </div>

      {/* top-right: primary controls */}
      <div className="fixed right-4 top-4 z-30 flex flex-wrap justify-end gap-2">
        {mode === "interior" && (
          <button type="button" className="hud-btn" onClick={() => { uiClick(soundOn); exitToExterior(); }}>
            ⤴ Exterior
          </button>
        )}
        <button type="button" className="hud-btn" onClick={() => { uiClick(soundOn); toggleMap(); }}>
          ▦ Map
        </button>
        <Link href="/recruiter" className="hud-btn hud-btn--amber">
          ★ Recruiter Mode
        </Link>
      </div>

      {/* bottom-right: utility controls */}
      <div className="fixed bottom-4 right-4 z-30 flex gap-2" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          className="hud-btn"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute ambient sound" : "Enable ambient sound"}
        >
          {soundOn ? "♪ On" : "♪ Off"}
        </button>
        <button type="button" className="hud-btn" onClick={() => toggleSettings()} aria-label="Graphics and accessibility settings">
          ⚙
        </button>
        <button type="button" className="hud-btn" onClick={() => toggleHelp()} aria-label="Help and controls">
          ?
        </button>
      </div>

      {/* bottom-left: quick shortcuts (inside the cabin only — the landing
          overlay already provides these on the exterior view; on touch
          devices the joystick owns this corner, and Contact stays reachable
          via the map + comms zone) */}
      {mode === "interior" && !isTouch && (
        <div className="fixed bottom-4 left-4 z-30 flex gap-2">
          <button type="button" className="hud-btn" onClick={() => setPanel("comms")}>
            ✉ Contact
          </button>
          <ResumeAction />
        </div>
      )}

      {/* help modal */}
      <AnimatePresence>
        {helpOpen && (
          <Modal title="Controls & Help" onClose={() => toggleHelp(false)}>
            <div className="space-y-4 text-sm text-alu-200">
              <div>
                <div className="tech-label mb-2">Exterior</div>
                <ul className="space-y-1">
                  {isTouch ? (
                    <li>▸ Tap a glowing window (or “Board Aircraft”) to enter the cabin there.</li>
                  ) : (
                    <>
                      <li>▸ Hover the fuselage — glowing windows mark portfolio sections.</li>
                      <li>▸ Click a window (or “Board Aircraft”) to enter the cabin there.</li>
                    </>
                  )}
                </ul>
              </div>
              <div>
                <div className="tech-label mb-2">Inside the cabin</div>
                <ul className="space-y-1">
                  {isTouch ? (
                    <>
                      <li>▸ <b>Left joystick</b> — walk</li>
                      <li>▸ <b>Drag anywhere else</b> — look around</li>
                      <li>▸ <b>Tap an exhibit</b> — open its display</li>
                      <li>▸ <b>Map</b> — jump between zones instantly</li>
                    </>
                  ) : (
                    <>
                      <li>▸ <b>W A S D</b> or arrow keys — walk</li>
                      <li>▸ <b>Click + drag</b> — look around</li>
                      <li>▸ <b>Click an exhibit</b> — open its display</li>
                      <li>▸ <b>Map</b> — jump between zones instantly</li>
                      <li>▸ <b>Esc</b> — close panels</li>
                    </>
                  )}
                </ul>
              </div>
              <p className="text-alu-400">
                Prefer a conventional website? <Link className="text-amber-av underline" href="/recruiter">Recruiter Mode</Link> has
                everything on one fast page.
              </p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* settings modal */}
      <AnimatePresence>
        {settingsOpen && (
          <Modal title="Settings" onClose={() => toggleSettings(false)}>
            <div className="space-y-5">
              <div>
                <div className="tech-label mb-2">Graphics quality</div>
                <div className="flex gap-2">
                  {(["high", "balanced", "performance"] as Quality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`hud-btn ${quality === q ? "hud-btn--primary" : ""}`}
                      aria-pressed={quality === q}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="tech-label mb-2">Motion</div>
                <button
                  type="button"
                  className={`hud-btn ${reducedMotion ? "hud-btn--primary" : ""}`}
                  onClick={() => setReducedMotion(!reducedMotion)}
                  aria-pressed={reducedMotion}
                >
                  {reducedMotion ? "Reduced motion: on" : "Reduced motion: off"}
                </button>
              </div>
              <div>
                <div className="tech-label mb-2">Sound</div>
                <button type="button" className={`hud-btn ${soundOn ? "hud-btn--primary" : ""}`} onClick={toggleSound} aria-pressed={soundOn}>
                  {soundOn ? "Ambient sound: on" : "Ambient sound: off"}
                </button>
                {siteConfig.soundEnabled && (
                  <p className="mt-2 text-xs text-alu-500">All audio is subtle, procedural and always optional.</p>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.94, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 10 }}
        className="glass-panel w-full max-w-md rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" className="hud-btn ml-auto" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
