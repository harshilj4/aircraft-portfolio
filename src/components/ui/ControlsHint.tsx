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
      const t = setTimeout(() => setShow(false), 6500);
      return () => clearTimeout(t);
    }
  }, [mode, shown]);

  const items = isTouch
    ? [
        ["joystick", "walk"],
        ["drag", "look"],
        ["tap", "exhibits"],
        ["map", "to jump"],
      ]
    : [
        ["WASD", "walk"],
        ["drag", "look"],
        ["click", "exhibits"],
        ["map", "to jump"],
      ];

  return (
    <AnimatePresence>
      {show && mode === "interior" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed bottom-44 left-1/2 z-30 w-max max-w-[94vw] -translate-x-1/2 sm:bottom-20"
        >
          <div className="glass-panel flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg px-4 py-2.5 font-mono text-[0.7rem] text-alu-200 sm:px-5 sm:py-3 sm:text-xs">
            {items.map(([key, action], i) => (
              <span key={key} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden className="text-alu-500">|</span>}
                <span>
                  <b className="text-white">{key}</b> {action}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
