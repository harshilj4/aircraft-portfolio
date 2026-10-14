"use client";
import { useEffect, useState } from "react";
import { useAppStore, type TimeOfDay } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";

const TIMES: { id: TimeOfDay; icon: string; label: string }[] = [
  { id: "morning", icon: "☀", label: "Morning" },
  { id: "evening", icon: "◒", label: "Sunset" },
  { id: "midnight", icon: "☾", label: "Midnight" },
];

export default function FlightConditions() {
  const time = useAppStore(s => s.timeOfDay);
  const setTime = useAppStore(s => s.setTimeOfDay);
  const mode = useAppStore(s => s.mode);
  const mobile = useIsTouch();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(sessionStorage.getItem("hj-mobile-note") === "dismissed");
  }, []);
  return <>
    <div role="group" aria-label="Time of day" className="pointer-events-auto fixed left-1/2 top-[4.1rem] z-30 flex -translate-x-1/2 gap-0.5 rounded-full border border-white/20 bg-[#101921]/90 p-1 shadow-lg backdrop-blur-sm sm:top-3">
      {TIMES.map(t => <button key={t.id} type="button" aria-label={`${t.label} lighting`} aria-pressed={time === t.id}
        onClick={() => setTime(t.id)} className={`flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[.66rem] font-medium transition-colors ${time === t.id ? "bg-[#d8bb8b] text-[#171b20]" : "text-white/75 hover:bg-white/10"}`}>
        <span aria-hidden className="text-base">{t.icon}</span>{t.label}
      </button>)}
    </div>
    {mobile && !dismissed && mode === "landing" && <div className="fixed inset-x-3 top-[7.3rem] z-40 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-white/15 bg-[#111c26]/95 p-3 text-[#f5eee2] shadow-xl" role="note">
      <p className="text-xs leading-relaxed">Explore with touch here. For the full keyboard and mouse experience, try a computer.</p>
      <button type="button" className="-mr-1 -mt-1 min-h-10 min-w-10 text-lg" aria-label="Dismiss mobile tip" onClick={() => { setDismissed(true); sessionStorage.setItem("hj-mobile-note", "dismissed"); }}>×</button>
    </div>}
  </>;
}
