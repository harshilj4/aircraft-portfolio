"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { personal } from "@/data/personal";
import { sections } from "@/data/sections";
import { ResumeAction } from "@/components/content/SectionContents";

/**
 * Landing = a boarding pass lying over the dawn.
 *
 * Deliberately asymmetric and left-anchored rather than the centred-stack
 * hero every 3D site defaults to: the aircraft owns the frame, the document
 * sits in the corner the way a pass sits on a tray table.
 */
export default function LandingOverlay() {
  const mode = useAppStore((s) => s.mode);
  const board = useAppStore((s) => s.board);

  return (
    <AnimatePresence>
      {mode === "landing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.7, delay: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          className="pointer-events-none fixed inset-0 z-20"
        >
          {/* ── boarding pass ── */}
          <motion.div
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.6, delay: 0.35 } }}
            className="pointer-events-auto absolute bottom-0 left-0 w-full sm:bottom-8 sm:left-8 sm:w-[min(30rem,46vw)]"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="paper boarding-card">
              {/* stub header */}
              <div className="flex items-stretch border-b border-paper-300">
                <div className="flex items-center gap-2 px-5 py-3">
                  <span className="block h-1 w-1 rounded-full bg-signal" aria-hidden />
                  <span className="readout text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-600">
                    Engineering portfolio
                  </span>
                </div>
                <div className="readout ml-auto flex items-center px-3 text-[0.6rem] uppercase tracking-[0.18em] text-ink-400">
                  HJ&nbsp;001
                </div>
              </div>

              <div className="px-5 pb-5 pt-4 sm:p-6">
                <h1 className="display text-[2rem] leading-[1.02] text-ink-900 sm:text-[2.9rem]">
                  {personal.name.split(" ")[0]}
                  <br className="hidden sm:block" /><span className="sm:hidden"> </span>
                  {personal.name.split(" ").slice(1).join(" ")}
                </h1>

                {/* flight-strip data row */}
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 sm:mt-4">
                  {[
                    ["Field", "Mechanical Eng."],
                    ["Heading", "Aerospace"],
                    ["Based", "Brampton ON"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="label text-[0.48rem] tracking-[0.12em]">{k}</div>
                      <div className="mt-0.5 text-[0.72rem] font-medium text-ink-900">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 hidden text-[0.82rem] leading-snug text-ink-600 sm:block">
                  {personal.supportingLine}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                  <button type="button" onClick={() => board("projects")} className="btn btn--signal flex-1 sm:flex-none">
                    Explore the cabin <span aria-hidden>↗</span>
                  </button>
                  <Link href="/recruiter" className="btn btn--navy flex-1 sm:flex-none">
                    View portfolio
                  </Link>
                  <div className="hidden sm:block">
                    <ResumeAction />
                  </div>
                </div>
              </div>

              <div className="flight-rule" />
            </div>
          </motion.div>

          {/* ── cabin manifest, desktop only ── */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.6, delay: 0.55 } }}
            className="pointer-events-auto absolute bottom-8 right-8 hidden lg:block"
          >
            <div className="slate w-60">
              <div className="border-b border-paper-400/25 px-3 py-2">
                <span className="readout text-[0.58rem] uppercase tracking-[0.2em] text-paper-300">
                  Inside the cabin
                </span>
              </div>
              <ul>
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => board(s.id)}
                      className="group flex w-full items-center gap-3 border-b border-paper-400/12 px-3 py-2 text-left transition-colors hover:bg-signal"
                    >
                      <span className="readout text-[0.62rem] font-bold text-signal group-hover:text-white">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">
                        <span className="block text-[0.8rem] font-semibold text-paper-100">
                          {s.name}
                        </span>
                        <span className="readout block text-[0.55rem] uppercase tracking-[0.14em] text-paper-400 group-hover:text-paper-200">
                          {s.zoneName}
                        </span>
                      </span>
                      <span aria-hidden className="text-paper-400 group-hover:text-white">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="readout mt-2 text-right text-[0.55rem] uppercase tracking-[0.16em] text-ink-900/70">
              or click the aircraft to board
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
