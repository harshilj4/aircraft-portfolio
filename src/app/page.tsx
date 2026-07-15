"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { personal } from "@/data/personal";
import { links } from "@/data/links";

// The 3D experience is client-only and code-split — recruiters who go
// straight to /recruiter never download the Three.js bundle.
const Experience = dynamic(() => import("@/components/Experience"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-graphite-950">
      <div className="font-mono text-xs uppercase tracking-[0.3em] text-alu-400">
        Preparing aircraft…
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      {/* Screen-reader / no-JS accessible summary of the whole site */}
      <div className="sr-only">
        <h1>{personal.name} — {personal.headline}</h1>
        <p>{personal.aboutShort}</p>
        <p>
          This page hosts an interactive 3D aircraft portfolio.{" "}
          <Link href="/recruiter">Open Recruiter Mode for a conventional, fully accessible version of all content.</Link>
        </p>
        <ul>
          <li><a href={links.linkedin}>LinkedIn</a></li>
          <li><a href={links.github}>GitHub</a></li>
        </ul>
      </div>
      <noscript>
        <div style={{ padding: 24, fontFamily: "monospace" }}>
          This experience needs JavaScript. Visit <a href="/recruiter">/recruiter</a> for the
          fast, conventional version of this portfolio.
        </div>
      </noscript>

      {/* one experience everywhere — phones get the same 3D aircraft with an
          on-screen joystick and touch-look instead of WASD + mouse */}
      <Experience />
    </>
  );
}
