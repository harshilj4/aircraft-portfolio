"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";
import { getSection, sections } from "@/data/sections";
import {
  AboutContent,
  ProjectsContent,
  ResearchContent,
  BriefingContent,
  SkillsContent,
  ContactContent,
} from "@/components/content/SectionContents";

/**
 * Content opens as a page from the aircraft's technical manual: numbered
 * section, hazard rule, ink-on-paper body. Full-bleed on phones, a document
 * pinned to the right on desktop.
 */
export default function SectionPanel() {
  const openPanel = useAppStore((s) => s.openPanel);
  const openProject = useAppStore((s) => s.openProject);
  const setPanel = useAppStore((s) => s.setPanel);
  const setProject = useAppStore((s) => s.setProject);

  const section = openPanel ? getSection(openPanel) : null;
  const idx = openPanel ? sections.findIndex((s) => s.id === openPanel) + 1 : 0;

  return (
    <AnimatePresence>
      {openPanel && section && (
        <motion.aside
          key={openPanel}
          initial={{ x: "102%" }}
          animate={{ x: 0 }}
          exit={{ x: "102%" }}
          transition={{ type: "tween", duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="paper fixed inset-0 z-40 flex flex-col sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[min(34rem,92vw)]"
          role="dialog"
          aria-label={`${section.zoneName} — ${section.name}`}
        >
          {/* manual-page header */}
          <header className="shrink-0">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-5" style={{paddingTop:"max(.75rem, env(safe-area-inset-top))"}}>
              <span className="index-num text-2xl leading-none">
                {String(idx).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="label truncate">{section.zoneName}</div>
                <h2 className="display truncate text-2xl text-ink-900">{section.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPanel(null)}
                className="btn btn--sm shrink-0"
                aria-label="Close panel"
              >
                ✕<span className="hidden sm:inline">&nbsp;Close</span>
              </button>
            </div>
            <div className="hazard" />
          </header>

          <div
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-5"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
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
