"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { getSection } from "@/data/sections";
import {
  AboutContent,
  ProjectsContent,
  ResearchContent,
  BriefingContent,
  SkillsContent,
  ContactContent,
} from "@/components/content/SectionContents";

/** Sliding glass panel that shows the content of the active aircraft section. */
export default function SectionPanel() {
  const openPanel = useAppStore((s) => s.openPanel);
  const openProject = useAppStore((s) => s.openProject);
  const setPanel = useAppStore((s) => s.setPanel);
  const setProject = useAppStore((s) => s.setProject);

  const section = openPanel ? getSection(openPanel) : null;

  return (
    <AnimatePresence>
      {openPanel && section && (
        <motion.aside
          key={openPanel}
          initial={{ x: "105%" }}
          animate={{ x: 0 }}
          exit={{ x: "105%" }}
          transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel fixed inset-2 z-40 flex w-auto flex-col overflow-hidden rounded-xl sm:inset-auto sm:right-3 sm:top-3 sm:bottom-3 sm:w-[min(560px,94vw)]"
          role="dialog"
          aria-label={`${section.zoneName} — ${section.name}`}
        >
          <header className="flex items-center gap-3 border-b border-alu-500/15 px-5 py-4">
            <div>
              <div className="tech-label">{section.zoneName}</div>
              <h2 className="text-lg font-bold text-white">{section.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="hud-btn ml-auto"
              aria-label="Close panel"
            >
              ✕ Close
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {openPanel === "cockpit" && <AboutContent />}
            {openPanel === "projects" && (
              <ProjectsContent openProject={openProject} setProject={setProject} />
            )}
            {openPanel === "research" && <ResearchContent />}
            {openPanel === "briefing" && <BriefingContent />}
            {openPanel === "systems" && <SkillsContent />}
            {openPanel === "comms" && <ContactContent />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
