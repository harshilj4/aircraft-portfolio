"use client";

import type { Project } from "@/data/projects";
import LiteYouTube from "./LiteYouTube";

function Field({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="tech-label mb-2">{label}</h4>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-alu-200">
            <span className="mt-0.5 text-sky-accent" aria-hidden>▸</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Full project exhibit content. Empty fields are never rendered. */
export default function ProjectDetail({ project }: { project: Project }) {
  return (
    <article className="space-y-6">
      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest"
            style={{ background: `${project.accent}22`, color: project.accent, border: `1px solid ${project.accent}55` }}
          >
            {project.status}
          </span>
          {project.category.map((c) => (
            <span key={c} className="rounded border border-alu-500/30 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-alu-400">
              {c}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-bold text-white">{project.title}</h3>
        {project.informalName && (
          <p className="mt-1 text-xs text-alu-400">
            Informal project label: “{project.informalName}”
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-alu-300">{project.summary}</p>
      </header>

      {project.youtubeId && <LiteYouTube id={project.youtubeId} title={project.title} />}

      {project.images && project.images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {project.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.src} src={img.src} alt={img.alt} className="w-full rounded-lg border border-alu-500/20" loading="lazy" />
          ))}
        </div>
      )}

      <div className="space-y-3 text-sm leading-relaxed text-alu-200">
        {project.description.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {project.goal && (
        <div className="rounded-lg border border-sky-dim/40 bg-navy-900/60 p-4">
          <h4 className="tech-label mb-1">Mission objective</h4>
          <p className="text-sm text-alu-100">{project.goal}</p>
        </div>
      )}

      <div className="space-y-5">
        <Field label="System functions" items={project.functions} />
        <Field label="Hardware" items={project.hardware} />
        <Field label="Software & tools" items={project.software} />
        <Field label="Mechanical design work" items={project.mechanicalWork} />
        <Field label="Engineering challenges" items={project.challenges} />
        {project.outcome && (
          <div>
            <h4 className="tech-label mb-1">Outcome</h4>
            <p className="text-sm text-alu-200">{project.outcome}</p>
          </div>
        )}
        <Field label="Skills demonstrated" items={project.skills} />
        <Field label="Planned improvements" items={project.futureImprovements} />
      </div>
    </article>
  );
}
