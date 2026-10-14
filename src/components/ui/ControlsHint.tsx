"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";

/** One-time movement hint shown when the visitor first enters the cabin. */
export default function ControlsHint() {
  const mode = useAppStore((s) => s.mode);
  const isTouch = useIsTouch();
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (mode === "interior" && !shown) {
      setShow(true);
      setShown(true);
      const t = setTimeout(() => setShow(false), 6000);
      return () => clearTimeout(t);
    }
  }, [mode, shown]);

  const items: [string, string][] = isTouch
    ? [["stick", "walk"], ["drag", "look"], ["tap", "exhibits"]]
    : [["WASD", "walk"], ["drag", "look"], ["click", "exhibits"], ["map", "jump"]];

  return (
    <AnimatePresence>
      {show && mode === "interior" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed left-1/2 top-[22%] z-30 -translate-x-1/2"
        >
          <div className="slate flex items-stretch divide-x divide-paper-400/25">
            {items.map(([key, action]) => (
              <span key={key} className="px-3 py-2 text-center">
                <span className="readout block text-[0.68rem] font-bold text-signal">{key}</span>
                <span className="readout block text-[0.55rem] uppercase tracking-[0.14em] text-paper-300">
                  {action}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
