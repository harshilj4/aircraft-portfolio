/**
 * SKILLS — grouped, no percentage bars (per content rules).
 * Each group renders as an instrument panel in the Systems Bay.
 */

export interface SkillGroup {
  id: string;
  label: string;
  icon: "cad" | "code" | "circuit" | "lab" | "tools" | "people";
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "cad",
    label: "CAD & Mechanical Design",
    icon: "cad",
    skills: [
      "SolidWorks",
      "Fusion 360",
      "AutoCAD",
      "Part & assembly modelling",
      "Engineering drawings & dimensioning",
      "Basic GD&T",
      "Design for 3D printing",
      "Mechanical component design",
      "Design iteration",
      "Measurement with digital calipers",
    ],
  },
  {
    id: "programming",
    label: "Programming",
    icon: "code",
    skills: ["Python", "Java", "MATLAB", "Arduino programming", "Arduino IDE"],
  },
  {
    id: "electronics",
    label: "Electronics & Prototyping",
    icon: "circuit",
    skills: [
      "Arduino",
      "Servo motors",
      "Sensors",
      "Breadboards & circuit wiring",
      "Power distribution",
      "Computer-vision integration",
      "Rapid prototyping",
      "3D printing",
      "Component testing",
      "Hardware troubleshooting",
    ],
  },
  {
    id: "research",
    label: "Research & Data",
    icon: "lab",
    skills: [
      "Literature reviews",
      "Technical paper analysis",
      "Experimental planning",
      "Design of experiments",
      "Sensor research",
      "Data collection & interpretation",
      "Spreadsheet analysis",
      "Microsoft Excel",
      "Technical presentations",
      "Technical documentation",
    ],
  },
  {
    id: "tools",
    label: "Engineering Tools",
    icon: "tools",
    skills: [
      "SolidWorks",
      "Fusion 360",
      "AutoCAD",
      "MATLAB",
      "Python",
      "Java",
      "Arduino IDE",
      "Microsoft Excel",
      "IntelliJ IDEA",
    ],
  },
  {
    id: "professional",
    label: "Professional Skills",
    icon: "people",
    skills: [
      "Engineering communication",
      "Team collaboration",
      "Problem solving",
      "Technical writing",
      "Presentation skills",
      "Adaptability",
      "Time management",
      "Leadership",
    ],
  },
];
