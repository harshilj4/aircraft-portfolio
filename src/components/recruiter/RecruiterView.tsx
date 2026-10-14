"use client";

import { useState } from "react";
import Link from "next/link";
import { personal } from "@/data/personal";
import { links, getMailto, getEmail } from "@/data/links";
import { projects } from "@/data/projects";
import ProjectDetail from "@/components/content/ProjectDetail";
import {
  SkillsContent,
  BriefingContent,
  ResumeAction,
  ProjectCard,
} from "@/components/content/SectionContents";

/**
 * Recruiter Mode layout — content order per the portfolio spec:
 * 1 name/headline · 2 resume · 3 short about · 4 featured projects ·
 * 5 research · 6 skills · 7 work experience · 8 education · 9 contact.
 * (Research, work experience and education render inside BriefingContent
 * and the research project detail below.)
 */
export default function RecruiterView() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = projects.find((p) => p.id === openId);

  return (
    <div className="min-h-screen bg-paper-100">
      {/* boarding-pass style header */}
      <header className="border-b border-ink-900 bg-gradient-to-b from-paper-200 to-paper-100">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="label mb-1">Recruiter Mode · Engineering Portfolio</div>
            <h1 className="display text-3xl text-ink-900 sm:text-3xl">
              {personal.name}
            </h1>
            <p className="mt-1 text-sm text-signal">{personal.headline}</p>
            <p className="mt-1 text-xs text-ink-400">
              {personal.university} · {personal.school} · {personal.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ResumeAction large />
            <Link href="/" className="btn">
              ✈ 3D Experience
            </Link>
          </div>
        </div>
        {/* quick links strip */}
        <div className="mx-auto flex max-w-4xl flex-wrap gap-x-6 gap-y-1 px-5 pb-4 font-mono text-xs">
          <a className="text-ink-600 hover:text-signal" href={getMailto()}>
            ✉ {getEmail()}
          </a>
          <a className="text-ink-600 hover:text-signal" href={links.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
          <a className="text-ink-600 hover:text-signal" href={links.github} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-12 px-5 py-10">
        {/* about */}
        <section aria-labelledby="about-h">
          <h2 id="about-h" className="label mb-3">About</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-800">{personal.aboutShort}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-400">{personal.careerGoal}</p>
        </section>

        {/* featured projects */}
        <section aria-labelledby="projects-h">
          <h2 id="projects-h" className="label mb-4">Featured Projects & Research</h2>
          {open ? (
            <div className="rounded-xl border border-paper-400/20 bg-paper-200 p-5">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="mb-4 font-mono text-xs uppercase tracking-widest text-signal hover:text-signal-deep"
              >
                ← All projects
              </button>
              <ProjectDetail project={open} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={() => setOpenId(p.id)} />
              ))}
            </div>
          )}
        </section>

        {/* skills */}
        <section aria-labelledby="skills-h">
          <h2 id="skills-h" className="label mb-4">Technical Skills</h2>
          <SkillsContent />
        </section>

        {/* experience / education / resume */}
        <section aria-labelledby="exp-h">
          <h2 id="exp-h" className="label mb-4">Experience & Education</h2>
          <BriefingContent />
        </section>

        {/* contact */}
        <section aria-labelledby="contact-h" className="rounded-xl border border-signal/30 bg-paper-200/50 p-6">
          <h2 id="contact-h" className="label mb-2">Contact</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-800">
            {personal.contactMessages.recruiter}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={getMailto("Engineering opportunity — via portfolio")} className="btn btn--signal">
              ✉ Email me
            </a>
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
              LinkedIn ↗
            </a>
            <a href={links.github} target="_blank" rel="noopener noreferrer" className="btn">
              GitHub ↗
            </a>
            <ResumeAction />
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-400/10 py-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.25em] text-paper-400">
        {personal.name} · {personal.headlineTiny} · Built as an explorable aircraft —{" "}
        <Link href="/" className="text-signal hover:underline">
          board the 3D experience ✈
        </Link>
      </footer>
    </div>
  );
}
