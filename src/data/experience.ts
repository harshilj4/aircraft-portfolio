/**
 * EXPERIENCE, EDUCATION, LEADERSHIP — single source of truth.
 * ADD A NEW EXPERIENCE: copy an object in `workExperience` and edit it.
 * Dates are intentionally omitted until confirmed (per content rules).
 */

export interface ExperienceEntry {
  title: string;
  organization: string;
  location?: string;
  focus?: string;
  responsibilities: string[];
  emphasis: "primary" | "brief";
}

export const researchExperience: ExperienceEntry[] = [
  {
    title: "Research Assistant",
    organization: "York University — Lassonde School of Engineering",
    location: "Toronto, Ontario",
    focus: "Laser-induced graphene sensors, with a focus on humidity sensing.",
    responsibilities: [
      "Review academic research related to LIG sensors",
      "Summarize materials and fabrication methods",
      "Compare sensor-performance metrics and readout methods",
      "Assist with experimental planning and design-of-experiments discussions",
      "Learn laser-fabrication principles",
      "Prepare technical summaries and presentations",
    ],
    emphasis: "primary",
  },
];

export const workExperience: ExperienceEntry[] = [
  {
    title: "Concessions Attendant",
    organization: "City of Brampton — Gore Meadows Community Centre",
    location: "Brampton, Ontario",
    responsibilities: [
      "Serve customers in a recreation-facility environment",
      "Process orders and payments",
      "Maintain cleanliness and food-safety standards",
      "Work effectively during busy periods",
    ],
    emphasis: "primary",
  },
  {
    title: "Information Technology Intern",
    organization: "PLASP Child Care Services — Head Office",
    responsibilities: [
      "Reprogrammed and configured tablets, supported device updates",
      "Completed data entry, organization and analysis",
      "Supported technology-related administrative tasks in a professional head-office environment",
    ],
    emphasis: "primary",
  },
  {
    title: "Food and Beverage Team Member",
    organization: "Canada's Wonderland",
    responsibilities: [
      "Served guests in a high-volume environment as part of a team",
      "Prepared and handled food following health and safety procedures",
    ],
    emphasis: "brief",
  },
  {
    title: "Restaurant Crew Member",
    organization: "BarBurrito",
    responsibilities: [
      "Prepared customer orders and provided customer service",
      "Handled food safely and worked efficiently during busy periods",
    ],
    emphasis: "brief",
  },
];

/**
 * VOLUNTEERING & COMMUNITY — supporting roles, kept intentionally compact.
 * Accuracy notes: the hospital role involved no medical advice, patient
 * records or clinical duties; the classroom role was not formal teaching,
 * tutoring employment or independent supervision.
 */
export const volunteerExperience: ExperienceEntry[] = [
  {
    title: "Front Desk Volunteer",
    organization: "William Osler Health System — Etobicoke General Hospital",
    location: "Etobicoke, Ontario",
    focus:
      "First point of contact for patients, visitors and families — wayfinding, general questions and a welcoming front-desk presence.",
    responsibilities: [
      "Welcomed patients, visitors and family members and provided directions to departments, clinics and waiting areas",
      "Answered general questions within the limits of the volunteer role, with patience and empathy",
      "Communicated with hospital staff when further support was required",
      "Respected hospital privacy and confidentiality expectations",
    ],
    emphasis: "brief",
  },
  {
    title: "Grade 1 Classroom Volunteer",
    organization: "Former elementary school",
    location: "Brampton, Ontario",
    focus:
      "Returned to my former Grade 1 teacher's classroom to support young students with activities, organization and individual learning tasks.",
    responsibilities: [
      "Supported students during lessons — helping them understand instructions, complete work and stay engaged",
      "Provided individual assistance and encouragement when students needed extra support",
      "Helped the teacher organize classroom materials and prepare activities",
    ],
    emphasis: "brief",
  },
];

export const education = [
  {
    institution: "York University",
    school: "Lassonde School of Engineering",
    credential: "Bachelor of Engineering in Mechanical Engineering",
    location: "Toronto, Ontario, Canada",
    details: [
      "Engineering design",
      "Solid mechanics",
      "Physics and calculus",
      "Programming",
      "Engineering economics",
      "Project management",
      "Computer-aided design",
      "Technical communication",
      "Experimental research",
    ],
  },
  {
    institution: "Turner Fenton Secondary School",
    school: "International Baccalaureate studies",
    credential: "Secondary education",
    location: "Brampton, Ontario, Canada",
    details: ["Higher-level Mathematics, English and Chemistry", "Physics, French and Global Politics"],
  },
];

/**
 * LEADERSHIP — Orientation Week Leader (York University) is gated behind
 * siteConfig.confirmed.orientationLeader. Confirm the role was officially
 * accepted/completed before enabling.
 */
export const leadership: ExperienceEntry[] = [
  {
    title: "Orientation Week Leader",
    organization: "York University",
    responsibilities: [
      "Welcome new students and support orientation activities",
      "Answer student questions and communicate university resources",
      "Work with an orientation team to encourage participation",
    ],
    emphasis: "primary",
  },
];

/**
 * CERTIFICATIONS — all gated behind siteConfig.confirmed.certifications.
 * Confirm each was successfully completed (and its exact title) before enabling.
 */
export const certifications = [
  "Standard First Aid and CPR-C",
  "Food Handler Certification",
  "WHMIS training",
  "Laboratory safety training",
  "Laser safety orientation",
];
