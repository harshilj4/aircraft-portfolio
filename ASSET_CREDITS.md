# Asset Credits & Licences

This project intentionally uses **no downloaded third-party media assets**.
Everything visual and audible is generated procedurally in code, so there are no
attribution or licensing obligations for the environment.

| Asset | Source | Licence |
|---|---|---|
| Aircraft exterior (fuselage, wings, engines, tail, livery) | Procedural geometry — `src/components/three/Aircraft.tsx` | Original code |
| Sky & atmosphere | `Sky` shader from `@react-three/drei` (MIT) | MIT |
| Clouds | Canvas-generated radial-gradient sprites — `ExteriorScene.tsx` | Original code |
| Reflection environment | Procedural `Lightformer` env map (drei, MIT) — no HDRI files | MIT |
| Cabin interior, exhibits, cockpit, lab, consoles | Procedural geometry — `CabinScene.tsx` | Original code |
| Ambient audio & UI clicks | Web Audio API synthesis — `src/lib/audio.ts` | Original code |
| UI icons | Hand-written inline SVG paths | Original code |
| Fonts | System font stack (Segoe UI / Consolas etc.) — nothing bundled | n/a |
| YouTube thumbnails | Served by YouTube (`i.ytimg.com`) for videos owned by Harshil Jadawala, via the standard embed pattern | YouTube ToS |
| Project videos | Harshil Jadawala's own YouTube uploads, embedded via `youtube-nocookie.com` | Owner's content |

**Livery note:** the aircraft is a *fictional* design inspired by large four-engine
airliners. It carries no airline or manufacturer branding and does not present
itself as an official Boeing product.

**If you add assets later** (photos, CAD renders, models, sounds), record them here:
`| asset | where it came from | licence |` — and keep originals in `public/`.
