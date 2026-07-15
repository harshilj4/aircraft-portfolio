/**
 * PROJECTS — single source of truth for every project exhibit.
 *
 * HOW TO ADD A NEW PROJECT:
 *   1. Copy any object below and give it a unique `id`.
 *   2. Fill in only the fields you have — empty/omitted fields are never shown.
 *   3. To add images: drop files into  public/projects/<project-id>/  and list
 *      them in `images` as { src: "/projects/<id>/photo1.jpg", alt: "..." }.
 *   4. To add a YouTube video: paste the video ID (the part after youtu.be/).
 *
 * Order in this array = display order in Recruiter Mode and the cabin.
 */

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface Project {
  id: string;
  title: string;
  informalName?: string;
  category: string[];
  status: "In development" | "Completed" | "Concept";
  summary: string;
  description: string[];
  goal?: string;
  functions?: string[];
  hardware?: string[];
  software?: string[];
  mechanicalWork?: string[];
  challenges?: string[];
  outcome?: string;
  skills: string[];
  futureImprovements?: string[];
  youtubeId?: string;
  images?: ProjectImage[];
  featured: boolean;
  accent: string; // exhibit accent colour in the 3D cabin
  zone: "projects" | "research" | "comms";
}

export const projects: Project[] = [
  {
    id: "pan-tilt-tracker",
    title: "Computer-Vision Pan-Tilt Tracking Platform",
    informalName: "Laser Tracking Turret Prototype",
    category: ["Mechatronics", "Computer vision", "Mechanical design", "Prototyping"],
    status: "In development",
    summary:
      "A computer-vision-controlled pan-and-tilt platform designed to detect and follow a coloured target using a webcam, Python image processing, an Arduino and two servo motors.",
    description: [
      "This project explores how computer vision, mechanical design, electronics and programming can be combined into a functional target-tracking system.",
      "A laptop webcam captures live video and identifies a coloured target, initially tested using a green object. Python processes the camera feed, determines the target's position relative to the centre of the frame and sends movement commands to an Arduino.",
      "The Arduino controls two servo motors arranged in a pan-and-tilt configuration — one for horizontal rotation, one for vertical movement. The long-term design includes a custom 3D-printed structure that supports the servos, allows controlled motion and provides space for wiring and a low-power visual pointing module.",
      "The project has involved software testing, servo control, component measurements, power planning, mechanical design and iterative CAD development.",
    ],
    goal: "Create a responsive physical platform that automatically follows a moving coloured target in two axes.",
    functions: [
      "Capture live webcam video",
      "Detect a selected target colour",
      "Calculate the target position and tracking error",
      "Send commands from Python to an Arduino over serial",
      "Control two servo motors for pan and tilt movement",
      "Keep the target near the centre of the camera frame",
    ],
    hardware: [
      "Laptop webcam",
      "Arduino-compatible controller",
      "Two servo motors",
      "Breadboard and jumper wires",
      "External power supply",
      "3D-printed mechanical components",
      "Low-power visual pointing module (to be integrated)",
    ],
    software: [
      "Python",
      "OpenCV computer vision",
      "Arduino IDE",
      "Serial communication",
      "SolidWorks / Fusion 360 for mechanical design",
    ],
    mechanicalWork: [
      "Servo mounting geometry",
      "Pan base and tilt support design",
      "Wiring clearance and mechanical clearances",
      "Fillets and structural reinforcement",
      "Component measurement using digital calipers",
      "Fastener planning and 3D-printable part design",
    ],
    challenges: [
      "Keeping the movement stable",
      "Correctly centring the servos",
      "Supplying sufficient external power without back-powering the laptop",
      "Designing mounts around real component dimensions",
      "Reducing tracking delay, overshoot and oscillation",
      "Integrating horizontal and vertical movement",
    ],
    skills: [
      "Mechanical design",
      "CAD modelling",
      "Python",
      "Arduino",
      "Computer vision",
      "Servo control",
      "Serial communication",
      "Electronics",
      "Physical prototyping",
      "3D printing",
      "Iterative design",
    ],
    futureImprovements: [
      "Complete the 3D-printed pan-and-tilt assembly",
      "Integrate the visual pointing module",
      "Improve tracking stability and tune servo response",
      "Reduce latency and improve detection under changing lighting",
      "Add cable management, movement limits and enclosure design",
      "Create an exploded assembly drawing and final demonstration video",
    ],
    youtubeId: "wk9M-Nd7YqA",
    // ADD IMAGES: drop build photos in public/projects/pan-tilt-tracker/ and list them here.
    images: [],
    featured: true,
    accent: "#58e07f",
    zone: "projects",
  },
  {
    id: "rc-airplane",
    title: "Scratch-Built RC Airplane",
    category: ["Aerospace", "Mechanical design", "Prototyping"],
    status: "Completed",
    summary:
      "A lightweight remote-controlled aircraft designed, assembled and successfully flown using a custom foam structure and commercially available electronic components.",
    description: [
      "This project involved building an RC aircraft from the ground up using a lightweight foam airframe and a basic electric propulsion system.",
      "The aircraft included a motor, propeller, electronic speed controller, battery, receiver and control components. The project required balancing weight, arranging the electronics, assembling the structure and testing the aircraft until it could successfully fly.",
      "It provided practical experience with aircraft construction, centre-of-gravity considerations, propulsion, component placement, lightweight structures and iterative testing.",
    ],
    hardware: [
      "Foam airframe",
      "Electric motor and propeller",
      "Electronic speed controller",
      "Battery",
      "Radio receiver",
      "Control electronics",
    ],
    outcome: "The aircraft was successfully flown.",
    skills: [
      "Aircraft construction",
      "Lightweight structures",
      "Component placement",
      "Basic aerodynamics",
      "Electric propulsion",
      "Centre-of-gravity considerations",
      "Assembly and testing",
      "Troubleshooting",
    ],
    // ADD VIDEO: paste flight-video YouTube ID here when available.
    images: [],
    featured: true,
    accent: "#6fb7ff",
    zone: "projects",
  },
  {
    id: "lig-research",
    title: "Laser-Induced Graphene Sensor Research",
    category: ["Materials", "Sensors", "Experimental research", "Laser fabrication"],
    status: "In development",
    summary:
      "University research involving laser-induced graphene sensors, with a particular focus on humidity-sensing applications, fabrication methods, sensor performance, experimental planning and technical literature.",
    description: [
      "As a Research Assistant at York University's Lassonde School of Engineering, I study laser-induced graphene (LIG) for sensor applications, with a current focus on humidity sensing.",
      "The work explores how laser processing can convert carbon-containing materials into conductive graphene-like structures. These structures respond to environmental changes such as humidity through measurable electrical changes in resistance or capacitance.",
      "My responsibilities include reviewing research papers, summarizing fabrication methods, comparing reported sensor performance, learning about laser-processing parameters and contributing to experimental planning and design-of-experiments discussions.",
    ],
    functions: [
      "Literature review of LIG humidity-sensor research",
      "Comparison of sensor materials and fabrication methods",
      "Study of performance metrics: sensitivity, response time, recovery time, operating range, stability",
      "Experimental planning around laser power, speed, fill method, line spacing, focus height, passes and substrate material",
      "Technical presentations and summaries",
    ],
    hardware: [
      "Laser fabrication systems (Snapmaker laser system, Hyrel CO₂ laser system)",
      "Electrical measurement equipment",
    ],
    software: ["Spreadsheet analysis", "Technical literature databases"],
    skills: [
      "Engineering research",
      "Materials research",
      "Sensor technology",
      "Literature review",
      "Experimental planning",
      "Design of experiments",
      "Data comparison",
      "Technical communication",
      "Laser-processing fundamentals",
    ],
    images: [],
    featured: true,
    accent: "#c084fc",
    zone: "research",
  },
  {
    id: "plant-watering",
    title: "Automatic Plant Watering System",
    category: ["Embedded systems", "Sensors", "Automation", "Prototyping"],
    status: "Completed",
    summary:
      "An Arduino-based system designed to monitor soil moisture and automatically activate a water pump when a plant requires water.",
    description: [
      "The Automatic Plant Watering System was created to reduce the need for manual watering by monitoring soil conditions and responding when moisture levels became too low.",
      "A soil-moisture sensor collected readings from the plant's soil. An Arduino processed the sensor data and controlled a pump that supplied water when the programmed threshold was reached.",
      "The project combined sensor data, programming, basic electronics and physical prototyping.",
    ],
    hardware: [
      "Arduino",
      "Soil-moisture sensor",
      "Water pump and tubing",
      "Power source",
      "Breadboard / circuit connections",
    ],
    software: ["Arduino IDE", "Arduino programming"],
    skills: [
      "Sensor integration",
      "Embedded programming",
      "Automated control",
      "Circuit wiring",
      "Threshold-based decision making",
      "Prototyping and testing",
    ],
    futureImprovements: [
      "Calibrated soil-moisture readings",
      "Adjustable watering thresholds",
      "Water-level detection and data logging",
      "Improved enclosure and pump protection",
      "Multiple-plant support",
    ],
    youtubeId: "Ik2zGVtEsoc",
    images: [],
    featured: false,
    accent: "#4ade80",
    zone: "projects",
  },
  {
    id: "noise-monitor",
    title: "Noise Monitoring System",
    category: ["Sensors", "Data collection", "Environmental monitoring"],
    status: "In development",
    summary:
      "A system designed to collect sound-level data using a microphone and Arduino-based hardware, with the long-term goal of displaying or analysing the readings through a software interface.",
    description: [
      "The Noise Monitoring System was developed as a sensor-based engineering project focused on measuring and recording environmental sound.",
      "A microphone sensor was connected to an Arduino to collect sound-related data. The project included plans for data logging and a possible application or interface for presenting the readings.",
      "It demonstrates the connection between physical sensors, embedded hardware and software-based data analysis. Readings are relative sound levels — the system is not calibrated for certified decibel measurement.",
    ],
    hardware: ["Arduino", "Microphone / sound sensor", "Breadboard and wiring", "Computer interface"],
    skills: [
      "Sensor integration",
      "Arduino programming",
      "Data collection",
      "Signal interpretation",
      "Hardware troubleshooting",
      "Software planning",
    ],
    youtubeId: "03TQ7miFJfc",
    images: [],
    featured: false,
    accent: "#fbbf24",
    zone: "projects",
  },
  {
    id: "portfolio-website",
    title: "Interactive Aerospace Portfolio Website",
    category: ["Web development", "Creative engineering communication", "3D interaction"],
    status: "In development",
    summary:
      "An interactive portfolio designed as an explorable aircraft environment that presents engineering projects, experience, research and skills through a cinematic aerospace interface.",
    description: [
      "This portfolio itself is a creative engineering and web-design project. The website is designed around a fictional aircraft flying through a dynamic sky environment — visitors explore different aircraft areas to learn about my projects, research, experience and technical skills.",
      "The project combines storytelling, interface design, 3D graphics, responsive web development, performance optimization and professional communication.",
    ],
    software: [
      "Next.js",
      "React",
      "TypeScript",
      "Three.js",
      "React Three Fiber",
      "Tailwind CSS",
      "Framer Motion",
      "Zustand",
    ],
    skills: [
      "Creative direction",
      "Web development",
      "3D interaction",
      "User experience",
      "Responsive design",
      "Performance optimization",
      "Engineering communication",
      "Personal branding",
    ],
    images: [],
    featured: false,
    accent: "#38bdf8",
    zone: "projects",
  },
  {
    id: "coral-vision",
    title: "Coral Vision",
    category: ["Team design project", "UNHack"],
    status: "Completed",
    summary:
      "A team project developed during UNHack focused on a concept intended to help address coral disease.",
    description: [
      "Coral Vision was developed during UNHack as a team-based design project focused on the problem of coral disease. The project required rapid ideation, teamwork, problem definition, concept development and presentation.",
    ],
    // ACHIEVEMENT (gated): "Placed second at UNHack" — shown only when
    // siteConfig.confirmed.coralVisionPlacement is set to true in config.ts.
    skills: [
      "Teamwork",
      "Rapid problem solving",
      "Concept development",
      "Presentation",
      "Design thinking",
      "Sustainability awareness",
    ],
    images: [],
    featured: false,
    accent: "#2dd4bf",
    zone: "projects",
  },
];

/**
 * SERVO MEASUREMENTS (pan-tilt project) — recorded manually during development.
 * NOT displayed on the site until siteConfig.confirmed.servoMeasurements = true.
 * mountingHoleSpacing: ~54.5 mm, bodyLength: ~40.5 mm, bodyWidth: ~19.9 mm,
 * bodyHeight: ~39 mm, maxHeight: ~44.6 mm, totalLength: ~54.1 mm,
 * mountingHoleDiameter: ~4.7 mm, outputFeatureDiameter: ~5.7 mm
 */

export const featuredProjects = projects.filter((p) => p.featured);
export const getProject = (id: string) => projects.find((p) => p.id === id);
