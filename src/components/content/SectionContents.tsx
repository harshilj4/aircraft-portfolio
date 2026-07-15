"use client";

/**
 * Content bodies for each aircraft section — shared by the 3D side panel,
 * the mobile guided tour, and (with different layout) Recruiter Mode.
 */

import { personal } from "@/data/personal";
import { links, getEmail, getMailto } from "@/data/links";
import { projects, type Project } from "@/data/projects";
import { skillGroups } from "@/data/skills";
import {
  researchExperience,
  workExperience,
  volunteerExperience,
  education,
  leadership,
  certifications,
} from "@/data/experience";
import { siteConfig } from "@/data/config";
import ProjectDetail from "./ProjectDetail";

/* ────────────── shared bits ────────────── */

export function ResumeAction({ large = false }: { large?: boolean }) {
  if (siteConfig.resume.available) {
    return (
      <a
        href={siteConfig.resume.url}
        download
        className={`hud-btn hud-btn--amber ${large ? "px-6 py-3 text-sm" : ""}`}
      >
        ⬇ {siteConfig.resume.label}
      </a>
    );
  }
  // Resume PDF not uploaded yet — offer a contact CTA instead of a dead button.
  return (
    <a href={getMailto("Resume request — via portfolio")} className={`hud-btn ${large ? "px-6 py-3 text-sm" : ""}`}>
      ✉ Request Resume by Email
    </a>
  );
}

/* ────────────── Cockpit / About ────────────── */

export function AboutContent() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-sky-accent/90 font-mono">{personal.welcome}</p>
      <div className="space-y-3 text-sm leading-relaxed text-alu-200">
        {personal.aboutFull.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["Program", personal.program],
          ["Institution", `${personal.university} — ${personal.school}`],
          ["Location", personal.location],
          ["Primary destination", personal.interests.primary],
          ["Secondary interest", personal.interests.secondary],
          ["Current mission", personal.mission],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-3">
            <div className="tech-label mb-1">{k}</div>
            <div className="text-sm text-alu-100">{v}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="tech-label mb-2">Engineering philosophy</h4>
        <p className="mb-3 text-sm leading-relaxed text-alu-200">{personal.philosophy.main}</p>
        <ul className="space-y-1.5">
          {personal.philosophy.principles.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-alu-300">
              <span className="text-amber-av" aria-hidden>▸</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="tech-label mb-2">Areas of interest</h4>
        <div className="flex flex-wrap gap-2">
          {personal.interests.areas.map((a) => (
            <span key={a} className="rounded border border-sky-dim/40 bg-navy-900/60 px-2.5 py-1 text-xs text-alu-200">
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────── Projects ────────────── */

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4 text-left transition hover:border-sky-accent/60 hover:bg-graphite-700/70"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: project.accent }} aria-hidden />
        <span className="tech-label">{project.category[0]}</span>
        <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-widest text-alu-500">{project.status}</span>
      </div>
      <div className="font-semibold text-alu-100 group-hover:text-white">{project.title}</div>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-alu-400">{project.summary}</p>
      <div className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-sky-accent opacity-0 transition group-hover:opacity-100">
        Open exhibit ▸
      </div>
    </button>
  );
}

export function ProjectsContent({
  openProject,
  setProject,
}: {
  openProject: string | null;
  setProject: (id: string | null) => void;
}) {
  const active = projects.find((p) => p.id === openProject);
  if (active) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setProject(null)}
          className="mb-4 font-mono text-xs uppercase tracking-widest text-sky-accent hover:text-white"
        >
          ← All exhibits
        </button>
        <ProjectDetail project={active} />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-alu-300">
        Each exhibit documents a real build — problem, process, hardware, testing and lessons learned.
      </p>
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onOpen={() => setProject(p.id)} />
      ))}
    </div>
  );
}

/* ────────────── Research ────────────── */

export function ResearchContent() {
  const lig = projects.find((p) => p.id === "lig-research")!;
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#c084fc]/30 bg-[#c084fc]/5 p-4">
        <div className="tech-label mb-1" style={{ color: "#c084fc" }}>
          Research Assistant — York University, Lassonde School of Engineering
        </div>
        <p className="text-sm text-alu-200">
          Laser-induced graphene (LIG) sensors, with a focus on humidity sensing.
        </p>
      </div>
      <ProjectDetail project={lig} />
      <div>
        <h4 className="tech-label mb-2">Experimental variables considered</h4>
        <div className="flex flex-wrap gap-2">
          {["Laser power", "Laser speed", "Fill method (line / dot)", "Line spacing", "Focus height", "Number of passes", "Substrate material"].map((v) => (
            <span key={v} className="rounded border border-[#c084fc]/30 bg-graphite-800/70 px-2.5 py-1 text-xs text-alu-200">
              {v}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs leading-relaxed text-alu-500">
        Performance values (sensitivity, response/recovery time, operating range) are studied from
        published literature and are not presented here as results of my own experiments.
      </p>
    </div>
  );
}

/* ────────────── Briefing: experience / education / resume ────────────── */

export function BriefingContent() {
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-3">
        <ResumeAction large />
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="hud-btn">
          LinkedIn ↗
        </a>
      </div>

      <div>
        <h4 className="tech-label mb-3">Research experience</h4>
        {researchExperience.map((e) => (
          <div key={e.title} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
            <div className="font-semibold text-white">{e.title}</div>
            <div className="text-sm text-sky-accent">{e.organization}</div>
            {e.focus && <p className="mt-1 text-sm text-alu-300">{e.focus}</p>}
            <ul className="mt-2 space-y-1">
              {e.responsibilities.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-alu-300">
                  <span className="text-sky-accent" aria-hidden>▸</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h4 className="tech-label mb-3">Work experience</h4>
        <div className="space-y-3">
          {workExperience.map((e) => (
            <div key={e.title + e.organization} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
              <div className="font-semibold text-alu-100">{e.title}</div>
              <div className="text-sm text-alu-400">{e.organization}</div>
              {e.emphasis === "primary" ? (
                <ul className="mt-2 space-y-1">
                  {e.responsibilities.map((r) => (
                    <li key={r} className="flex gap-2 text-sm text-alu-300">
                      <span className="text-alu-500" aria-hidden>▸</span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-alu-400">{e.responsibilities[0]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="tech-label mb-3">Volunteering & community</h4>
        <div className="space-y-3">
          {volunteerExperience.map((e) => (
            <div key={e.title} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
              <div className="font-semibold text-alu-100">{e.title}</div>
              <div className="text-sm text-alu-400">
                {e.organization}
                {e.location ? ` · ${e.location}` : ""}
              </div>
              {e.focus && <p className="mt-1 text-sm text-alu-300">{e.focus}</p>}
              <ul className="mt-2 space-y-1">
                {e.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-alu-300">
                    <span className="text-alu-500" aria-hidden>▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="tech-label mb-3">Education</h4>
        <div className="space-y-3">
          {education.map((ed) => (
            <div key={ed.institution} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
              <div className="font-semibold text-white">{ed.institution}</div>
              <div className="text-sm text-sky-accent">{ed.credential}</div>
              <div className="text-xs text-alu-400">
                {ed.school} · {ed.location}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ed.details.map((d) => (
                  <span key={d} className="rounded bg-graphite-600/60 px-2 py-0.5 text-xs text-alu-300">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {siteConfig.confirmed.orientationLeader && (
        <div>
          <h4 className="tech-label mb-3">Leadership</h4>
          {leadership.map((e) => (
            <div key={e.title} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
              <div className="font-semibold text-alu-100">{e.title}</div>
              <div className="text-sm text-alu-400">{e.organization}</div>
              <ul className="mt-2 space-y-1">
                {e.responsibilities.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-alu-300">
                    <span className="text-alu-500" aria-hidden>▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {siteConfig.confirmed.certifications && (
        <div>
          <h4 className="tech-label mb-3">Certifications & training</h4>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <span key={c} className="rounded border border-alu-500/30 bg-graphite-800/70 px-2.5 py-1 text-xs text-alu-200">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────── Systems bay: skills ────────────── */

const ICONS: Record<string, string> = {
  cad: "M4 20 12 4l8 16H4Zm8-12.5L7.3 18h9.4L12 7.5Z",
  code: "M8.7 17.3 3.4 12l5.3-5.3 1.4 1.4L6.2 12l3.9 3.9-1.4 1.4Zm6.6 0-1.4-1.4 3.9-3.9-3.9-3.9 1.4-1.4L20.6 12l-5.3 5.3Z",
  circuit: "M7 7h4v2H9v6h2v2H7V7Zm10 10h-4v-2h2V9h-2V7h4v10Z",
  lab: "M9 3h6v2h-1v5.3l4.5 7.8A2 2 0 0 1 16.8 21H7.2a2 2 0 0 1-1.7-2.9L10 10.3V5H9V3Z",
  tools: "M21 6.5a4.5 4.5 0 0 1-6 4.2L7.7 18a2 2 0 1 1-2.8-2.8l7.3-7.3A4.5 4.5 0 0 1 17.5 2l-2 2 2.5 2.5 2-2c.3.6.5 1.3.5 2Z",
  people: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v2h16v-2c0-3.3-4.7-5-8-5Z",
};

export function SkillsContent() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-alu-300">
        Skills grouped by system — the tools and methods used across my projects and research.
      </p>
      {skillGroups.map((g) => (
        <div key={g.id} className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-sky-accent)" aria-hidden>
              <path d={ICONS[g.icon]} />
            </svg>
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-alu-100">{g.label}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {g.skills.map((s) => (
              <span key={s} className="rounded border border-alu-500/25 bg-graphite-900/70 px-2.5 py-1 text-xs text-alu-200">
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────── Comms: contact ────────────── */

export function ContactContent() {
  const items = [
    { label: "LinkedIn", value: "in/harshil-jadawala", href: links.linkedin },
    { label: "GitHub", value: "harshilj4", href: links.github },
    ...(links.youtubeChannel
      ? [{ label: "YouTube", value: "Project videos", href: links.youtubeChannel }]
      : []),
  ];
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-alu-200">{personal.contactMessages.main}</p>
      <div className="space-y-2">
        <a
          href={getMailto("Engineering opportunity — via portfolio")}
          className="flex items-center justify-between rounded-lg border border-[#58e07f]/35 bg-[#58e07f]/5 p-4 transition hover:border-[#58e07f]"
        >
          <div>
            <div className="tech-label mb-0.5" style={{ color: "#58e07f" }}>Email — primary channel</div>
            <EmailReveal />
          </div>
          <span aria-hidden className="text-[#58e07f]">▸</span>
        </a>
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4 transition hover:border-sky-accent/60"
          >
            <div>
              <div className="tech-label mb-0.5">{it.label}</div>
              <div className="text-sm text-alu-100">{it.value}</div>
            </div>
            <span aria-hidden className="text-alu-500">↗</span>
          </a>
        ))}
      </div>
      <div className="rounded-lg border border-alu-500/20 bg-graphite-800/70 p-4">
        <div className="tech-label mb-2">Resume</div>
        <ResumeAction />
      </div>
      <p className="text-sm text-alu-400">{personal.contactMessages.short}</p>
    </div>
  );
}

/** Email rendered only client-side from obfuscated parts (anti-scrape). */
function EmailReveal() {
  return <div className="text-sm text-alu-100">{getEmail()}</div>;
}
