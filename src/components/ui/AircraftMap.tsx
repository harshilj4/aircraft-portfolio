"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { sections } from "@/data/sections";

/** The drawing shows location; full-size HTML buttons carry readable labels. */
export default function AircraftMap() {
  const mapOpen = useAppStore(s => s.mapOpen);
  const toggleMap = useAppStore(s => s.toggleMap);
  const mode = useAppStore(s => s.mode);
  const currentSection = useAppStore(s => s.currentSection);
  const requestJump = useAppStore(s => s.requestJump);
  const board = useAppStore(s => s.board);
  const go = (id: (typeof sections)[number]["id"]) => {
    if (mode === "interior") requestJump(id);
    else board(id);
  };
  const sx = (i: number) => 108 + i * (612 / (sections.length - 1));
  return <AnimatePresence>
    {mapOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/45 p-3 sm:p-4"
      onClick={() => toggleMap(false)} role="dialog" aria-modal="true" aria-label="Cabin map">
      <motion.div initial={{y:14,opacity:0}} animate={{y:0,opacity:1}} exit={{y:14,opacity:0}}
        transition={{duration:.2}} className="paper max-h-[92dvh] w-full max-w-3xl overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b-[1.5px] border-ink-900 px-4 py-3">
          <span className="index-num text-sm">▦</span>
          <div><div className="label">Navigation</div><h2 className="display text-xl text-ink-900">Cabin Plan</h2></div>
          <button type="button" className="btn btn--sm ml-auto" aria-label="Close cabin map" onClick={() => toggleMap(false)}>
            ✕<span className="hidden sm:inline">&nbsp;Close</span>
          </button>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <svg viewBox="0 0 820 200" className="mb-3 hidden w-full sm:block" aria-hidden="true">
            <g fill="var(--color-paper-300)" stroke="var(--color-ink-600)" strokeWidth="1.5">
              <path d="M330 100 L250 14 L300 14 L420 100 Z"/>
              <path d="M330 100 L250 186 L300 186 L420 100 Z"/>
              <path d="M740 100 L700 46 L730 46 L785 100 L730 154 L700 154 Z"/>
              <path d="M60 100 Q65 66 120 62 L720 62 Q800 74 810 100 Q800 126 720 138 L120 138 Q65 134 60 100 Z" fill="var(--color-paper-100)" strokeWidth="2"/>
            </g>
            <text x="46" y="104" fill="var(--color-ink-600)" fontSize="11" fontFamily="monospace" textAnchor="end">FWD</text>
            {sections.map((s,i) => <g key={s.id} onClick={() => go(s.id)} style={{cursor:"pointer"}}>
              <rect x={sx(i)-50} y={62} width={100} height={76} fill="transparent"/>
              <circle cx={sx(i)} cy={100} r={20} fill={currentSection===s.id?"var(--color-navy)":"var(--color-paper-200)"} stroke="var(--color-ink-600)" strokeWidth="1.5"/>
              <text x={sx(i)} y={105} fill={currentSection===s.id?"#fff":"var(--color-ink-900)"} fontSize="14" fontWeight="700" fontFamily="monospace" textAnchor="middle">{String(i+1).padStart(2,"0")}</text>
            </g>)}
          </svg>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {sections.map((s,i) => <button key={s.id} type="button" onClick={() => go(s.id)}
              aria-label={`Go to ${s.zoneName} — ${s.name}`} aria-current={currentSection===s.id?"location":undefined}
              className={`flex min-h-[82px] items-start gap-2.5 rounded-lg border p-3 text-left transition-colors hover:bg-paper-300/60 ${currentSection===s.id?"border-ink-600 bg-paper-200":"border-paper-400 bg-paper-50/50"}`}>
              <span className="readout mt-0.5 text-xs font-bold text-ink-600">{String(i+1).padStart(2,"0")}</span>
              <span className="min-w-0">
                <span className="block text-[.65rem] font-semibold uppercase leading-snug tracking-[.06em] text-ink-600">{s.zoneName}</span>
                <span className="mt-1 block text-[.95rem] font-semibold leading-snug text-ink-900">{s.name}</span>
              </span>
            </button>)}
          </div>
        </div>
        <div className="hazard"/>
        <p className="px-4 py-3 text-center text-xs leading-relaxed text-ink-600">
          {mode==="interior"?"Select a zone to move there instantly — walking is optional.":"Select a zone to board directly at that section."}
        </p>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
