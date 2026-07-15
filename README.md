# Harshil Jadawala — Interactive Aerospace Portfolio ✈

A personal engineering portfolio built as an **explorable aircraft**. Visitors see a
wide-body aircraft flying through the sky, board it through glowing section windows,
and walk a futuristic exhibition cabin where every zone presents part of the portfolio —
projects, research, experience, skills and contact. A fast **Recruiter Mode** page
(`/recruiter`) carries the same content conventionally.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Three.js** via **React Three Fiber** + **Drei** — the aircraft, sky, clouds and cabin
  are 100% procedural (no downloaded 3D models or textures → no licensing issues)
- **Tailwind CSS 4**, **Framer Motion**, **Zustand**
- Procedural Web-Audio ambience (no sound files), lite YouTube embeds

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
```

## Deploy (Vercel — recommended)

1. Push this folder to a GitHub repository.
2. Import the repo at [vercel.com/new](https://vercel.com/new) — zero config needed.
3. Every push redeploys automatically.

Netlify also works (build command `npm run build`). GitHub Pages is not recommended
for this app (it needs a Node server or Vercel/Netlify's Next.js adapters).

## Where to edit YOUR content (no code archaeology needed)

| What | File |
|---|---|
| Name, bio, headlines, philosophy, goals | `src/data/personal.ts` |
| LinkedIn / GitHub / YouTube / email | `src/data/links.ts` |
| **Projects** (add/edit/reorder, videos, images) | `src/data/projects.ts` |
| Work & research experience, education | `src/data/experience.ts` |
| Skills | `src/data/skills.ts` |
| Aircraft sections / zone names | `src/data/sections.ts` |
| **Resume, unconfirmed-claim gates, quality default** | `src/data/config.ts` |

### Enable your resume
1. Put your PDF at `public/resume/Harshil_Jadawala_Resume.pdf`
2. In `src/data/config.ts` set `resume.available = true`

### Add project photos
1. Drop images into `public/projects/<project-id>/`
2. List them in that project's `images` array in `src/data/projects.ts`
   (with meaningful `alt` text). They appear automatically in the exhibit.

### Add a YouTube video
Paste the video ID (the part after `youtu.be/`) into the project's `youtubeId`.
Videos load as click-to-play lite embeds with a "Watch on YouTube" link.

### Confirm gated claims
`src/data/config.ts → confirmed` — Coral Vision's UNHack placement, Orientation
Leader role, certifications and turret servo measurements are **hidden until you
flip their flags**, so nothing unverified ships by accident.

## Experience map

- **/** — the full 3D experience on every device: storm exterior → board via
  glowing windows → walkable cabin. Desktop uses WASD + drag-look; touch
  devices get an on-screen joystick + drag-look, with quality auto-tuned
  (and auto-degraded under sustained low FPS) for phone GPUs.
- **/recruiter** — fast conventional page: resume, about, projects, research,
  skills, experience, education, contact. Linked from every screen, the loading
  screen, and the 404-free HUD.

## Accessibility & performance

- Recruiter Mode is a complete non-3D alternative; the landing page includes an
  sr-only summary and `<noscript>` path.
- Reduced-motion honoured (system preference + in-app toggle), Escape closes
  panels, focus states visible, audio starts muted and is always optional.
- Quality settings (High / Balanced / Performance) with automatic device
  detection; the 3D bundle is code-split so `/recruiter` never loads Three.js.
- Loading screen reflects real readiness (first rendered frame) — no fake boot.

See `ASSET_CREDITS.md` for the asset/licensing record.
