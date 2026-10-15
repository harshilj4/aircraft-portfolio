"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import { personal } from "@/data/personal";

export default function LoadingGate() {
  const ready = useAppStore(s => s.ready);
  const { loaded, total } = useProgress();
  return <AnimatePresence>
    {!ready && <motion.div exit={{opacity:0,transition:{duration:.3}}}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-paper-100 px-6" aria-label="Loading">
      <div className="w-full max-w-sm">
        <div className="label">HJ / Engineering portfolio</div>
        <div className="display mt-3 text-3xl text-ink-900">{personal.name}</div>
        <div className="my-6 flight-rule" />
        <p role="status" className="text-sm text-ink-600">Preparing your flight{total > 0 ? ` · ${loaded} of ${total} assets` : "…"}</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-600">Explore the aircraft, or open the portfolio directly.</p>
        <Link href="/recruiter" className="btn mt-6">View portfolio <span aria-hidden>↗</span></Link>
      </div>
    </motion.div>}
  </AnimatePresence>;
}
