"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { sections } from "@/data/sections";

/**
 * Interactive aircraft floor plan — jump directly between zones so nobody is
 * forced to walk the whole cabin.
 */
export default function AircraftMap() {
  const mapOpen = useAppStore((s) => s.mapOpen);
  const toggleMap = useAppStore((s) => s.toggleMap);
  const mode = useAppStore((s) => s.mode);
  const currentSection = useAppStore((s) => s.currentSection);
  const requestJump = useAppStore((s) => s.requestJump);
  const board = useAppStore((s) => s.board);

  const go = (id: (typeof sections)[number]["id"]) => {
    if (mode === "interior") requestJump(id);
    else board(id);
  };

  // schematic map: stations are evenly spaced so labels never collide
  const sx = (i: number) => 105 + i * ((730 - 105) / (sections.length - 1));

  return (
    <AnimatePresence>
      {mapOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => toggleMap(false)}
          role="dialog"
          aria-label="Aircraft map"
        >
          <motion.div
            initial={{ scale: 0.94, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 10 }}
            className="glass-panel w-full max-w-3xl rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center">
              <div>
                <div className="tech-label">Navigation</div>
                <h2 className="text-lg font-bold text-white">Aircraft Map</h2>
              </div>
              <button type="button" className="hud-btn ml-auto" onClick={() => toggleMap(false)}>
                ✕ Close
              </button>
            </div>

            <svg viewBox="0 0 820 190" className="w-full" role="img" aria-label="Top view of the aircraft with clickable zones">
              {/* wings */}
              <path d="M 330 95 L 250 8 L 300 8 L 420 95 Z" fill="#1a2333" stroke="#2c3a52" />
              <path d="M 330 95 L 250 182 L 300 182 L 420 95 Z" fill="#1a2333" stroke="#2c3a52" />
              {/* tailplane */}
              <path d="M 740 95 L 700 40 L 730 40 L 785 95 L 730 150 L 700 150 Z" fill="#1a2333" stroke="#2c3a52" />
              {/* fuselage */}
              <path
                d="M 60 95 Q 65 62 120 58 L 720 58 Q 800 70 810 95 Q 800 120 720 132 L 120 132 Q 65 128 60 95 Z"
                fill="#141b28"
                stroke="#39496a"
                strokeWidth="2"
              />
              {/* nose marker */}
              <text x="46" y="99" fill="#5f6b7d" fontSize="10" fontFamily="monospace" textAnchor="end">
                FWD
              </text>
              {sections.map((s, i) => {
                const active = currentSection === s.id;
                // stagger zone labels on two rows so long names never collide
                const zoneY = i % 2 === 0 ? 42 : 24;
                return (
                  <g
                    key={s.id}
                    onClick={() => go(s.id)}
                    style={{ cursor: "pointer" }}
                    role="button"
                    aria-label={`Go to ${s.zoneName} — ${s.name}`}
                  >
                    {/* full-column invisible hit area — keeps stations easy to
                        tap when the map is scaled down to phone width */}
                    <rect x={sx(i) - 55} y={8} width={110} height={174} fill="transparent" />
                    <line x1={sx(i)} y1={zoneY + 6} x2={sx(i)} y2={80} stroke="#3d3a6a" strokeDasharray="2 3" />
                    <circle
                      cx={sx(i)}
                      cy={95}
                      r={15}
                      fill={active ? "rgba(157,140,255,0.35)" : "rgba(157,140,255,0.08)"}
                      stroke={active ? "#9d8cff" : "#4a4380"}
                      strokeWidth="1.5"
                    />
                    <circle cx={sx(i)} cy={95} r={4} fill={active ? "#9d8cff" : "#5d578f"} />
                    <text x={sx(i)} y={zoneY} fill="#c3c9d6" fontSize="11" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                      {s.zoneName.toUpperCase()}
                    </text>
                    <text x={sx(i)} y={95 + 38} fill="#9d8cff" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {s.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <p className="mt-3 text-center text-xs text-alu-500">
              {mode === "interior"
                ? "Select a zone to move there instantly — walking is optional."
                : "Select a zone to board the aircraft directly at that section."}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
