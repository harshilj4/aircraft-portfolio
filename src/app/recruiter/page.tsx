import type { Metadata } from "next";
import RecruiterView from "@/components/recruiter/RecruiterView";
import { personal } from "@/data/personal";

export const metadata: Metadata = {
  title: `${personal.name} — Recruiter Mode`,
  description: `Fast overview of ${personal.name}: featured engineering projects, research, skills, experience, education and contact links.`,
};

/**
 * RECRUITER MODE — a fast, conventional page with the same aircraft identity.
 * No 3D, no forced walking, no cinematic transitions.
 */
export default function RecruiterPage() {
  return <RecruiterView />;
}
