/**
 * AIRCRAFT SECTIONS — maps portfolio sections to physical aircraft zones.
 * `x` is the position along the cabin (nose = -23, tail = +20).
 */

export type SectionId =
  | "cockpit"
  | "projects"
  | "research"
  | "briefing"
  | "systems"
  | "comms";

export interface Section {
  id: SectionId;
  name: string;
  zoneName: string;
  tagline: string;
  x: number; // position along fuselage in the 3D cabin
}

export const sections: Section[] = [
  {
    id: "cockpit",
    name: "About Me",
    zoneName: "Cockpit",
    tagline: "About me and career direction",
    x: -21,
  },
  {
    id: "projects",
    name: "Projects",
    zoneName: "Main Cabin",
    tagline: "Engineering project exhibition",
    x: -8,
  },
  {
    id: "research",
    name: "Research",
    zoneName: "Research Laboratory",
    tagline: "Laser-induced graphene research",
    x: 3,
  },
  {
    id: "briefing",
    name: "Experience",
    zoneName: "Briefing Room",
    tagline: "Experience, education and resume",
    x: 9.5,
  },
  {
    id: "systems",
    name: "Skills",
    zoneName: "Systems Bay",
    tagline: "Skills and technical tools",
    x: 15,
  },
  {
    id: "comms",
    name: "Contact",
    zoneName: "Communications",
    tagline: "Contact, LinkedIn and GitHub",
    x: 19.5,
  },
];

export const getSection = (id: SectionId) => sections.find((s) => s.id === id)!;
