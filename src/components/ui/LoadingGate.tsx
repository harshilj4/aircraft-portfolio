"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { personal } from "@/data/personal";

/**
 * Pre-flight checklist. Reflects REAL readiness — it clears the moment the 3D
 * scene has rendered its first frame, with only a short checklist beat, never
 * an invented multi-second boot sequence.
 */
const CHECKLIST = [
  ["AIRFRAME", "INIT"],
  ["ENVIRONMENT", "OK"],
  ["PROJECT DATABASE", "LOADED"],
  ["NAVIGATION", "ONLINE"],
] as const;

export default function LoadingGate() {
  const ready = useAppStore((s) => s.ready);
  const [minElapsed, setMinElapsed] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 250);
    const i = setInterval(() => setLine((l) => Math.min(l + 1, CHECKLIST.length)), 75);
    return () => {
      clearTimeout(t);
      clearInterval(i);
    };
  }, []);

  const done = ready && minElapsed;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-paper-100 px-6"
          aria-label="Loading"
        >
          <div className="w-full max-w-sm">
            <div className="mb-5">
              <div className="label">Pre-flight</div>
              <div className="display mt-0.5 text-3xl text-ink-900">{personal.name}</div>
              <div className="readout mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-ink-400">
                Interactive aerospace portfolio
              </div>
            </div>

            <div className="hazard" />

            <div className="readout mt-4 space-y-1.5 text-[0.7rem]">
              {CHECKLIST.slice(0, line).map(([k, v]) => (
                <motion.div
                  key={k}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-ink-600">{k}</span>
                  <span className="h-px flex-1 bg-paper-400" />
                  <span className="font-bold text-runway">{v}</span>
                </motion.div>
              ))}
              {!ready && line >= CHECKLIST.length && (
                <div className="flex items-center gap-2 text-ink-400">
                  <span>RENDERING FIRST FRAME</span>
                  <span className="h-px flex-1 bg-paper-400" />
                  <span className="text-caution">···</span>
                </div>
              )}
            </div>

            <div className="mt-5 h-2 border-[1.5px] border-ink-900 bg-paper-200">
              <motion.div
                className="h-full bg-signal"
                initial={{ width: "6%" }}
                animate={{ width: ready ? "100%" : "68%" }}
                transition={{ duration: ready ? 0.3 : 1.1 }}
              />
            </div>

            <Link href="/recruiter" className="btn btn--sm mt-6 w-full">
              Skip — open Recruiter Mode ▸
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
