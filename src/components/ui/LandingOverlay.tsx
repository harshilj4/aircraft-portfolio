"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { personal } from "@/data/personal";
import { ResumeAction } from "@/components/content/SectionContents";

/** Minimal cinematic intro over the exterior scene. The aircraft stays the star. */
export default function LandingOverlay() {
  const mode = useAppStore((s) => s.mode);
  const board = useAppStore((s) => s.board);

  return (
    <AnimatePresence>
      {mode === "landing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1, delay: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center pb-[max(3.5rem,env(safe-area-inset-bottom))] text-center"
        >
          <h1 className="text-2xl font-bold tracking-[0.14em] text-white sm:text-5xl sm:tracking-[0.18em]">
            {personal.name.toUpperCase()}
          </h1>
          <p className="mt-2 px-5 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-sky-accent sm:text-sm sm:tracking-[0.3em]">
            {personal.headlineTiny} · Aerospace-Focused Designer & Builder
          </p>
          <p className="mt-3 hidden max-w-xl px-6 text-sm text-alu-300 sm:block">
            {personal.supportingLine}
          </p>
          <div className="pointer-events-auto mt-5 flex flex-wrap items-center justify-center gap-2.5 px-4 sm:mt-6 sm:gap-3">
            <button
              type="button"
              onClick={() => board("projects")}
              className="hud-btn hud-btn--primary px-6 py-3 text-sm"
            >
              ✈ Board the Aircraft
            </button>
            <Link href="/recruiter" className="hud-btn hud-btn--amber px-6 py-3 text-sm">
              ★ Recruiter Mode
            </Link>
            <ResumeAction />
          </div>
          {/* desktop-only tip — on phones it crowded the utility buttons */}
          <p className="mt-4 hidden font-mono text-[0.65rem] uppercase tracking-[0.25em] text-alu-500 sm:block">
            or click / tap a glowing window to board at that section
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
