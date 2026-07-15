"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { personal } from "@/data/personal";

/**
 * Aerospace pre-flight loading screen. Reflects REAL readiness: it clears as
 * soon as the 3D scene has rendered its first frame (plus a very short
 * checklist beat) — no artificial multi-second boot sequence.
 */
const CHECKLIST = [
  "AIRCRAFT SYSTEMS ................ INIT",
  "FLIGHT ENVIRONMENT .............. OK",
  "PROJECT DATABASE ................ LOADED",
  "NAVIGATION ...................... ONLINE",
];

export default function LoadingGate() {
  const ready = useAppStore((s) => s.ready);
  const [minElapsed, setMinElapsed] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 900);
    const i = setInterval(() => setLine((l) => Math.min(l + 1, CHECKLIST.length)), 220);
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
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-graphite-950"
          aria-label="Loading"
        >
          <div className="mb-8 text-center">
            <div className="font-mono text-xs uppercase tracking-[0.4em] text-alu-400">
              {personal.name}
            </div>
            <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-alu-500">
              Interactive aerospace portfolio
            </div>
          </div>
          <div className="w-72 font-mono text-[0.7rem] leading-7 text-sky-accent/90">
            {CHECKLIST.slice(0, line).map((c) => (
              <div key={c}>{c}</div>
            ))}
            {!ready && line >= CHECKLIST.length && <div className="text-alu-400">RENDERING FIRST FRAME…</div>}
          </div>
          <div className="mt-8 h-0.5 w-72 overflow-hidden rounded bg-graphite-700">
            <motion.div
              className="h-full bg-sky-accent"
              initial={{ width: "5%" }}
              animate={{ width: ready ? "100%" : "70%" }}
              transition={{ duration: ready ? 0.3 : 1.2 }}
            />
          </div>
          <Link
            href="/recruiter"
            className="mt-10 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-amber-av underline-offset-4 hover:underline"
          >
            Skip — open Recruiter Mode ▸
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
