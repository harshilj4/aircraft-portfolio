"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useCursor, Sparkles } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import { sections, getSection } from "@/data/sections";
import { projects, type Project } from "@/data/projects";
import { skillGroups } from "@/data/skills";
import { useCanvasTexture, drawExhibitScreen, drawZoneSign } from "@/lib/canvasTexture";
import { touchMove } from "@/lib/touchControls";
import {
  drawPFD,
  drawND,
  drawEICAS,
  drawMFD,
  drawBriefing,
  drawSystemsPanel,
  drawComms,
  drawLabScreen,
} from "@/lib/cockpitDisplays";

/**
 * Interior — a storm-flying engineering exhibition cabin. Fuselage along X:
 * cockpit bulkhead -26, rear bulkhead +22. All screen text is drawn onto
 * canvas textures (embedded on the glass — nothing floats over the UI panels).
 */

const EYE_Y = 0.55;

/** Zone definitions: accent colour + boundary (arch/sign) position. */
const ZONES = [
  { id: "cockpit", accent: "#9d8cff", from: -26, to: -20.4, sign: -20.4 },
  { id: "projects", accent: "#6fb7ff", from: -20.4, to: 1.6, sign: -14.6 },
  { id: "research", accent: "#c084fc", from: 1.6, to: 7.6, sign: 1.6 },
  { id: "briefing", accent: "#ffb454", from: 7.6, to: 13.2, sign: 7.6 },
  { id: "systems", accent: "#38bdf8", from: 13.2, to: 17.8, sign: 13.2 },
  { id: "comms", accent: "#58e07f", from: 17.8, to: 22, sign: 17.8 },
] as const;

/** Shared interior lightning state — windows & windshield read this. */
const storm = { flash: 0 };

function StormDriver() {
  const s = useRef({ next: 2, until: 0 });
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t > s.current.next) {
      s.current.until = t + 0.35;
      s.current.next = t + 3 + Math.random() * 6;
    }
    if (t < s.current.until) {
      const k = (s.current.until - t) / 0.35;
      storm.flash = k * (Math.sin(t * 80) > -0.3 ? 1 : 0.2);
    } else {
      storm.flash = 0;
    }
  });
  return null;
}

/* ───────────────────────────── shell ───────────────────────────── */

const WIN_BASE = new THREE.Color("#252047");
const WIN_FLASH = new THREE.Color("#d8d2ff");

function CabinShell() {
  const quality = useAppStore((s) => s.quality);

  // woven aisle carpet — subtle diamond pattern repeated along the cabin
  const carpetTex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#171c36";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(157,140,255,0.12)";
      ctx.lineWidth = 2;
      for (let x = -h; x < w; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.strokeRect(1, 5, w - 2, h - 10);
    },
    256,
    64,
    []
  );
  carpetTex.wrapS = THREE.RepeatWrapping;
  carpetTex.repeat.set(20, 1);

  const guideRef = useRef<THREE.InstancedMesh>(null!);
  const guideCount = useMemo(() => {
    let n = 0;
    for (let x = -24; x <= 21; x += 1.2) n += 2;
    return n;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let x = -24; x <= 21; x += 1.2) {
      for (const side of [-1, 1]) {
        m.setPosition(x, -0.98, side * 0.85);
        guideRef.current.setMatrixAt(i++, m);
      }
    }
    guideRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  const winRef = useRef<THREE.InstancedMesh>(null!);
  const winMat = useRef<THREE.MeshBasicMaterial>(null!);
  const winCount = useMemo(() => {
    let n = 0;
    for (let x = -19; x <= 20; x += 1.6) n += 2;
    return n;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    let i = 0;
    for (let x = -19; x <= 20; x += 1.6) {
      for (const side of [-1, 1]) {
        d.position.set(x, 0.55, side * 2.68);
        d.rotation.set(0, side === 1 ? Math.PI : 0, 0);
        d.updateMatrix();
        winRef.current.setMatrixAt(i++, d.matrix);
      }
    }
    winRef.current.instanceMatrix.needsUpdate = true;
  }, []);
  // storm outside the windows: dark violet panes that flash with lightning
  useFrame(() => {
    winMat.current.color.lerpColors(WIN_BASE, WIN_FLASH, storm.flash);
  });

  return (
    <group>
      {/* fuselage tube */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[2.9, 2.9, 50, 28, 1, true]} />
        <meshStandardMaterial color="#272e40" side={THREE.BackSide} roughness={0.8} metalness={0.2} />
      </mesh>
      {/* bulkheads */}
      <mesh position={[-26, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[2.95, 32]} />
        <meshStandardMaterial color="#171426" roughness={0.8} />
      </mesh>
      <mesh position={[22, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[2.95, 32]} />
        <meshStandardMaterial color="#171426" roughness={0.8} />
      </mesh>
      {/* floor + aisle */}
      <mesh position={[-2, -1.05, 0]}>
        <boxGeometry args={[48, 0.12, 4.7]} />
        <meshStandardMaterial color="#131722" roughness={0.9} />
      </mesh>
      <mesh position={[-2, -1.0, 0]}>
        <boxGeometry args={[48, 0.05, 1.7]} />
        <meshStandardMaterial map={carpetTex} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* zone-coloured aisle edge strips */}
      {ZONES.map((z) => {
        const len = z.to - z.from;
        const cx = (z.from + z.to) / 2;
        return [-1, 1].map((side) => (
          <mesh key={z.id + side} position={[cx, -0.965, side * 0.88]}>
            <boxGeometry args={[len - 0.3, 0.03, 0.06]} />
            <meshStandardMaterial color={z.accent} emissive={z.accent} emissiveIntensity={1.4} />
          </mesh>
        ));
      })}
      {/* ceiling light strips */}
      {[-0.8, 0.8].map((z) => (
        <mesh key={z} position={[-2, 2.35, z]}>
          <boxGeometry args={[46, 0.06, 0.16]} />
          <meshStandardMaterial color="#cfd6ff" emissive="#cfd6ff" emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* floor guidance lights */}
      <instancedMesh ref={guideRef} args={[undefined, undefined, guideCount]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#9d8cff" emissive="#9d8cff" emissiveIntensity={2} />
      </instancedMesh>
      {/* storm windows */}
      <instancedMesh ref={winRef} args={[undefined, undefined, winCount]}>
        <planeGeometry args={[0.5, 0.72]} />
        <meshBasicMaterial ref={winMat} color="#252047" />
      </instancedMesh>
      {/* zone arches + hanging signs */}
      {ZONES.map((z) => {
        const sec = sections.find((s) => s.id === z.id)!;
        return (
          <group key={z.id}>
            <mesh position={[z.sign, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[2.78, 0.045, 8, 44]} />
              <meshStandardMaterial color="#12101f" emissive={z.accent} emissiveIntensity={0.9} />
            </mesh>
            {z.id !== "cockpit" && (
              <ZoneSign x={z.sign + 0.01} zone={sec.zoneName} tagline={sec.name} accent={z.accent} />
            )}
          </group>
        );
      })}
      {/* cabin lighting — zone-tinted */}
      <ambientLight intensity={1.05} color="#c9cfe8" />
      <hemisphereLight args={["#b0b8d8", "#39414e", 0.85]} />
      <pointLight position={[-23, 1.6, 0]} intensity={26} distance={11} color="#b7abff" />
      <pointLight position={[-16, 1.8, 0]} intensity={24} distance={11} color="#dfe6ff" />
      <pointLight position={[-8, 1.8, 0]} intensity={26} distance={12} color="#cfe0ff" />
      <pointLight position={[4, 1.8, 0]} intensity={26} distance={11} color="#e4d5ff" />
      {quality !== "performance" && (
        <>
          <pointLight position={[10.5, 1.8, 0]} intensity={24} distance={11} color="#ffe4c0" />
          <pointLight position={[15.5, 1.8, 0]} intensity={22} distance={10} color="#cfeaff" />
          <pointLight position={[19.5, 1.8, 0]} intensity={22} distance={10} color="#d2ffe0" />
        </>
      )}
    </group>
  );
}

function ZoneSign({ x, zone, tagline, accent }: { x: number; zone: string; tagline: string; accent: string }) {
  const tex = useCanvasTexture((ctx, w, h) => drawZoneSign(ctx, w, h, { zone, tagline, accent }), 512, 128, [zone]);
  return (
    <group position={[x, 1.78, 0]}>
      {[Math.PI / 2, -Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation={[0, ry, 0]} position={[i === 0 ? 0.011 : -0.011, 0, 0]}>
          <planeGeometry args={[1.7, 0.42]} />
          <meshBasicMaterial map={tex} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[0, 0.4, z]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
          <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────────── seating ─────────────────────────── */

function Seat({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, -0.55, z]}>
      <mesh>
        <boxGeometry args={[0.55, 0.14, 0.55]} />
        <meshStandardMaterial color="#232c44" roughness={0.9} />
      </mesh>
      <mesh position={[0.26, 0.44, 0]}>
        <boxGeometry args={[0.12, 0.9, 0.55]} />
        <meshStandardMaterial color="#283354" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.98, 0]}>
        <boxGeometry args={[0.12, 0.22, 0.34]} />
        <meshStandardMaterial color="#2f3a5e" roughness={0.9} />
      </mesh>
      {[-0.3, 0.3].map((az) => (
        <mesh key={az} position={[0.05, 0.22, az]}>
          <boxGeometry args={[0.45, 0.07, 0.07]} />
          <meshStandardMaterial color="#3a4568" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.5, 0.26, 0.5]} />
        <meshStandardMaterial color="#2a3346" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function SeatRow({ x }: { x: number }) {
  return <>{[-2.25, -1.6, 1.6, 2.25].map((z) => <Seat key={z} x={x} z={z} />)}</>;
}

/** Structural frame rings — the cabin reads as a real pressurized tube. */
function CeilingRibs() {
  const xs = [-23, -17.6, -11.8, -8.2, -4.6, -1.4, 3, 6, 9.4, 12.4, 15.6, 19, 21];
  return (
    <>
      {xs.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2.86, 0.035, 6, 36]} />
          <meshStandardMaterial color="#20263a" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </>
  );
}

/** Galley unit with stowed carts and a softly glowing brewer. */
function Galley() {
  return (
    <group position={[0.7, -0.99, -2.05]}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.9, 1.5, 0.7]} />
        <meshStandardMaterial color="#2a3144" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.53, 0]}>
        <boxGeometry args={[1.9, 0.06, 0.75]} />
        <meshStandardMaterial color="#8a93a0" metalness={0.85} roughness={0.25} />
      </mesh>
      {[-0.6, 0, 0.6].map((dx) => (
        <mesh key={dx} position={[dx, 0.4, 0.12]}>
          <boxGeometry args={[0.5, 0.8, 0.55]} />
          <meshStandardMaterial color="#3a4152" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0.55, 1.18, 0.18]}>
        <boxGeometry args={[0.3, 0.24, 0.3]} />
        <meshStandardMaterial color="#11141c" emissive="#ffb454" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function OverheadBins() {
  return (
    <>
      {([[-17.4, 5.6], [0.6, 3.2]] as const).map(([bx, len]) =>
        [-1, 1].map((side) => (
          <mesh key={`${bx}${side}`} position={[bx, 1.82, side * 2.12]} rotation={[side * -0.45, 0, 0]}>
            <boxGeometry args={[len, 0.4, 0.75]} />
            <meshStandardMaterial color="#333c52" roughness={0.7} metalness={0.3} />
          </mesh>
        ))
      )}
    </>
  );
}

/* ───────────────────────── project exhibits ───────────────────────── */

function TurretProp() {
  const head = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    head.current.rotation.y = Math.sin(clock.elapsedTime * 0.9) * 0.7;
    head.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.2;
  });
  return (
    <group position={[0, 0.62, 0]} scale={0.32}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.25, 16]} />
        <meshStandardMaterial color="#2a3346" metalness={0.7} roughness={0.35} />
      </mesh>
      <group ref={head} position={[0, 0.45, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.45]} />
          <meshStandardMaterial color="#39414e" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.42, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 10]} />
          <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.7, 0.05, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#0f2" emissive="#58e07f" emissiveIntensity={4} />
        </mesh>
      </group>
    </group>
  );
}

function PlaneProp() {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    g.current.rotation.y = clock.elapsedTime * 0.4;
    g.current.position.y = 0.95 + Math.sin(clock.elapsedTime * 1.1) * 0.05;
  });
  return (
    <group ref={g} position={[0, 0.95, 0]} scale={0.28}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, 1.6, 6, 10]} />
        <meshStandardMaterial color="#e8ecf0" roughness={0.6} />
      </mesh>
      <mesh position={[0.2, 0.05, 0]}>
        <boxGeometry args={[0.5, 0.04, 2.4]} />
        <meshStandardMaterial color="#9d8cff" roughness={0.6} />
      </mesh>
      <mesh position={[-0.85, 0.15, 0]}>
        <boxGeometry args={[0.25, 0.35, 0.05]} />
        <meshStandardMaterial color="#9d8cff" roughness={0.6} />
      </mesh>
      <mesh position={[-0.8, 0.05, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.9]} />
        <meshStandardMaterial color="#e8ecf0" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Exhibit({ project, x, side }: { project: Project; x: number; side: 1 | -1 }) {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  const setProject = useAppStore((s) => s.setProject);
  useCursor(hovered);

  const screenTex = useCanvasTexture(
    (ctx, w, h) =>
      drawExhibitScreen(ctx, w, h, {
        title: project.title,
        status: project.status,
        category: project.category[0],
        summary: project.summary,
        accent: project.accent,
      }),
    640,
    400,
    [project.id]
  );

  const open = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setPanel(project.zone === "research" ? "research" : "projects");
    setProject(project.id);
  };

  return (
    <group
      position={[x, -0.99, side * 1.95]}
      rotation={[0, side === -1 ? 0 : Math.PI, 0]}
      onClick={open}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.62, 20]} />
        <meshStandardMaterial color="#242c48" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 20]} />
        <meshStandardMaterial
          color={project.accent}
          emissive={project.accent}
          emissiveIntensity={hovered ? 1.8 : 0.6}
        />
      </mesh>
      {project.id === "pan-tilt-tracker" && <TurretProp />}
      {project.id === "rc-airplane" && <PlaneProp />}
      {/* display: text is baked into the screen texture */}
      <group position={[0, 1.55, -0.55]} rotation={[-0.12, 0, 0]} scale={hovered ? 1.04 : 1}>
        <mesh>
          <boxGeometry args={[1.56, 1.0, 0.05]} />
          <meshStandardMaterial color="#05070b" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[1.48, 0.925]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.52, 0.02]}>
          <boxGeometry args={[1.56, 0.05, 0.07]} />
          <meshStandardMaterial color={project.accent} emissive={project.accent} emissiveIntensity={hovered ? 2 : 0.9} />
        </mesh>
      </group>
      <mesh position={[0, 1.0, -0.55]}>
        <cylinderGeometry args={[0.04, 0.04, 0.55, 8]} />
        <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* museum-style ceiling spot + soft light cone over the exhibit */}
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.06, 12]} />
        <meshStandardMaterial color="#0d1018" emissive="#ffffff" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.55, 2.3, 20, 1, true]} />
        <meshBasicMaterial
          color={project.accent}
          transparent
          opacity={hovered ? 0.09 : 0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {hovered && <pointLight position={[0, 1.4, 0.6]} intensity={5} distance={3.2} color={project.accent} />}
    </group>
  );
}

/* ─────────────────────────── cockpit ─────────────────────────── */

function CockpitSeat({ z }: { z: number }) {
  return (
    <group position={[-22.15, -0.5, z]}>
      <mesh>
        <boxGeometry args={[0.62, 0.18, 0.62]} />
        <meshStandardMaterial color="#252e48" roughness={0.85} />
      </mesh>
      <mesh position={[0.3, 0.55, 0]}>
        <boxGeometry args={[0.15, 1.05, 0.6]} />
        <meshStandardMaterial color="#2b355a" roughness={0.85} />
      </mesh>
      <mesh position={[0.32, 1.16, 0]}>
        <boxGeometry args={[0.15, 0.24, 0.36]} />
        <meshStandardMaterial color="#333e68" roughness={0.85} />
      </mesh>
      {[-0.34, 0.34].map((az) => (
        <mesh key={az} position={[0.06, 0.28, az]}>
          <boxGeometry args={[0.5, 0.07, 0.08]} />
          <meshStandardMaterial color="#3a4568" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Yoke({ z }: { z: number }) {
  return (
    <group position={[-23.15, -0.35, z]}>
      <mesh rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.035, 0.045, 0.55, 8]} />
        <meshStandardMaterial color="#1a1f2c" roughness={0.6} />
      </mesh>
      <group position={[-0.07, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.06, 0.07, 0.3]} />
          <meshStandardMaterial color="#11141c" roughness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.09, s * 0.19]} rotation={[s * 0.5, 0, 0]}>
            <boxGeometry args={[0.055, 0.2, 0.07]} />
            <meshStandardMaterial color="#11141c" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function OverheadPanel() {
  const btns = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 54;
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 9; c++) {
        d.position.set(-24.55 + r * 0.16, 1.72 + r * 0.05, -0.64 + c * 0.16);
        d.rotation.set(0, 0, 0.3);
        d.updateMatrix();
        btns.current.setMatrixAt(i++, d.matrix);
      }
    }
    btns.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh position={[-24.2, 1.78, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.3, 0.08, 1.7]} />
        <meshStandardMaterial color="#1b2030" roughness={0.6} metalness={0.3} />
      </mesh>
      <instancedMesh ref={btns} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.07, 0.045, 0.07]} />
        <meshStandardMaterial color="#4a4f62" emissive="#8f96b8" emissiveIntensity={0.25} roughness={0.5} />
      </instancedMesh>
    </group>
  );
}

function Cockpit() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  useCursor(hovered);

  const pfd = useCanvasTexture(drawPFD, 320, 320, []);
  const nd = useCanvasTexture(drawND, 320, 320, []);
  const eicas = useCanvasTexture(drawEICAS, 320, 320, []);
  const mfd = useCanvasTexture(drawMFD, 640, 360, []);

  // windshield panes flash with the storm (one shared material, created once)
  const flashLight = useRef<THREE.PointLight>(null!);
  const GLASS_BASE = useMemo(() => new THREE.Color("#221c42"), []);
  const GLASS_FLASH = useMemo(() => new THREE.Color("#ded8ff"), []);
  const glassMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#151129" }),
    []
  );
  useFrame(() => {
    glassMaterial.color.lerpColors(GLASS_BASE, GLASS_FLASH, storm.flash);
    flashLight.current.intensity = storm.flash * 55;
  });

  const panes = useMemo(() => {
    const az = [-0.95, -0.55, -0.18, 0.18, 0.55, 0.95];
    return az.map((a) => ({
      a,
      pos: [-25.45 + (1 - Math.cos(a)) * 0.85, 1.02, Math.sin(a) * 1.95] as [number, number, number],
    }));
  }, []);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setPanel("cockpit");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* windshield: six panes + pillars, storm flashing outside */}
      {panes.map(({ a, pos }, i) => (
        <group key={i} position={pos} rotation={[0, Math.PI / 2 + a, 0]}>
          <mesh rotation={[0.32, 0, 0]}>
            <planeGeometry args={[0.78, 0.62]} />
            <primitive object={glassMaterial} attach="material" />
          </mesh>
          <mesh rotation={[0.32, 0, 0]} position={[0, 0, -0.015]}>
            <planeGeometry args={[0.9, 0.74]} />
            <meshStandardMaterial color="#191d28" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <pointLight ref={flashLight} position={[-25, 1, 0]} intensity={0} distance={8} color="#cfc8ff" />

      {/* glareshield */}
      <mesh position={[-24.55, 0.52, 0]}>
        <boxGeometry args={[0.95, 0.2, 3.5]} />
        <meshStandardMaterial color="#151923" roughness={0.6} />
      </mesh>
      {/* autopilot (MCP) strip with amber readouts */}
      <mesh position={[-24.1, 0.53, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.12, 2.6]} />
        <meshStandardMaterial color="#0b0e14" emissive="#ffb454" emissiveIntensity={0.35} />
      </mesh>

      {/* main instrument panel with four displays */}
      <group position={[-24.3, 0.02, 0]} rotation={[0, 0, -0.28]}>
        <mesh>
          <boxGeometry args={[0.6, 0.95, 3.5]} />
          <meshStandardMaterial color="#1a1e2b" roughness={0.55} metalness={0.3} />
        </mesh>
        {([
          [pfd, -1.3],
          [nd, -0.48],
          [eicas, 0.48],
        ] as const).map(([tex, z], i) => (
          <mesh key={i} position={[0.312, 0.12, z]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.68, 0.56]} />
            <meshBasicMaterial map={tex} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0.312, 0.12, 1.3]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.72, 0.42]} />
          <meshBasicMaterial map={mfd} toneMapped={false} />
        </mesh>
      </group>

      {/* centre pedestal + throttles */}
      <mesh position={[-23.35, -0.62, 0]}>
        <boxGeometry args={[1.15, 0.55, 0.72]} />
        <meshStandardMaterial color="#161a26" roughness={0.6} />
      </mesh>
      {[-0.14, 0.14].map((z) => (
        <group key={z} position={[-23.45, -0.28, z]} rotation={[0, 0, -0.35]}>
          <mesh>
            <boxGeometry args={[0.07, 0.34, 0.09]} />
            <meshStandardMaterial color="#252b3c" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color="#0d1018" roughness={0.4} />
          </mesh>
        </group>
      ))}
      <Yoke z={-0.85} />
      <Yoke z={0.85} />
      <CockpitSeat z={-0.85} />
      <CockpitSeat z={0.85} />
      <OverheadPanel />
      {/* cockpit door pillars */}
      {[-1.15, 1.15].map((z) => (
        <mesh key={z} position={[-20.4, 0.4, z]}>
          <boxGeometry args={[0.12, 2.9, 0.12]} />
          <meshStandardMaterial color="#1c2130" roughness={0.7} />
        </mesh>
      ))}
      {hovered && <pointLight position={[-23.5, 0.8, 0]} intensity={7} distance={4} color="#9d8cff" />}
    </group>
  );
}

/* ─────────────────────────── zones ─────────────────────────── */

function ResearchLab() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  const setProject = useAppStore((s) => s.setProject);
  useCursor(hovered);
  const dot = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.5;
    const row = Math.floor((t % 1) * 8);
    dot.current.position.set(((t * 4) % 1) * 1.1 - 0.55, 0.3 - row * 0.08, 0.035);
  });
  const labTex = useCanvasTexture(drawLabScreen, 512, 320, []);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setPanel("research");
        setProject("lig-research");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group position={[4, -0.99, -1.95]}>
        {/* main bench + samples + gantry */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.6, 1.0, 0.8]} />
          <meshStandardMaterial color="#1e2438" metalness={0.5} roughness={0.5} />
        </mesh>
        {[-0.9, -0.45, 0, 0.45, 0.9].map((dx, i) => (
          <mesh key={i} position={[dx, 1.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.28, 0.28]} />
            <meshStandardMaterial color={i % 2 ? "#0d0d0f" : "#191313"} roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0.1]}>
          <boxGeometry args={[2.2, 0.08, 0.08]} />
          <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.45, 1.28, 0.1]}>
          <boxGeometry args={[0.14, 0.28, 0.14]} />
          <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={hovered ? 2 : 0.7} />
        </mesh>
        {/* wall screen (embedded text) with raster dot */}
        <group position={[0, 1.85, -0.55]} rotation={[-0.1, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.66, 1.06, 0.05]} />
            <meshStandardMaterial color="#05070b" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[1.58, 0.98]} />
            <meshBasicMaterial map={labTex} toneMapped={false} />
          </mesh>
          <mesh ref={dot}>
            <circleGeometry args={[0.022, 8]} />
            <meshBasicMaterial color="#f2e8ff" />
          </mesh>
        </group>
        {/* shelf with sample jars */}
        <mesh position={[-1.6, 1.5, -0.4]}>
          <boxGeometry args={[0.7, 0.05, 0.35]} />
          <meshStandardMaterial color="#2a3144" roughness={0.6} />
        </mesh>
        {[-1.8, -1.6, -1.4].map((jx) => (
          <mesh key={jx} position={[jx, 1.62, -0.4]}>
            <cylinderGeometry args={[0.05, 0.05, 0.16, 10]} />
            <meshStandardMaterial color="#6d5a8e" transparent opacity={0.7} roughness={0.2} />
          </mesh>
        ))}
        {hovered && <pointLight position={[0, 1.6, 1]} intensity={6} distance={4} color="#c084fc" />}
      </group>
      {/* microscope station opposite */}
      <group position={[4.6, -0.99, 1.95]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.4, 0.9, 0.7]} />
          <meshStandardMaterial color="#1e2438" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.42, 10]} />
          <meshStandardMaterial color="#3a4152" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.93, 0.12]}>
          <boxGeometry args={[0.3, 0.06, 0.3]} />
          <meshStandardMaterial color="#2a3144" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function BriefingRoom() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  useCursor(hovered);
  const tex = useCanvasTexture(drawBriefing, 768, 432, []);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setPanel("briefing");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group position={[10.5, 0.35, -2.3]} rotation={[0, 0.15, 0]}>
        <mesh>
          <boxGeometry args={[3.5, 2.0, 0.08]} />
          <meshStandardMaterial color="#05070b" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.36, 1.89]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      {/* briefing table + chairs (kept clear of the aisle) */}
      <mesh position={[10.6, -0.62, 1.55]}>
        <cylinderGeometry args={[0.8, 0.55, 0.08, 24]} />
        <meshStandardMaterial color="#242c48" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[10.6, -0.85, 1.55]}>
        <cylinderGeometry args={[0.1, 0.16, 0.4, 12]} />
        <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
      </mesh>
      {[[9.7, 1.2], [11.5, 1.2], [9.9, 2.2], [11.3, 2.2]].map(([cx, cz], i) => (
        <Seat key={i} x={cx} z={cz} />
      ))}
      {hovered && <pointLight position={[10.5, 0.6, -1]} intensity={6} distance={4.5} color="#ffb454" />}
    </group>
  );
}

function SystemsBay() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  useCursor(hovered);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setPanel("systems");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {skillGroups.slice(0, 6).map((g, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = 14 + Math.floor(i / 2) * 1.65;
        return <SystemsPanel key={g.id} x={x} side={side} label={g.label} items={g.skills} glow={hovered} />;
      })}
    </group>
  );
}

function SystemsPanel({
  x, side, label, items, glow,
}: { x: number; side: number; label: string; items: string[]; glow: boolean }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => drawSystemsPanel(ctx, w, h, label.toUpperCase(), items),
    384,
    480,
    [label]
  );
  return (
    <group position={[x, 0.5, side * 2.5]} rotation={[0, side === -1 ? 0 : Math.PI, 0]}>
      <mesh>
        <boxGeometry args={[1.28, 1.58, 0.07]} />
        <meshStandardMaterial color="#0b0f16" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.18, 1.47]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.82, 0.02]}>
        <boxGeometry args={[1.28, 0.05, 0.08]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={glow ? 1.8 : 0.7} />
      </mesh>
    </group>
  );
}

function CommsTerminal() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  useCursor(hovered);
  const cursor = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    (cursor.current.material as THREE.MeshBasicMaterial).opacity =
      Math.sin(clock.elapsedTime * 6) > 0 ? 1 : 0;
  });
  const tex = useCanvasTexture(drawComms, 640, 400, []);
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        setPanel("comms");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group position={[20.9, 0.15, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[2.7, 1.75, 0.1]} />
          <meshStandardMaterial color="#05070b" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.56, 1.6]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <mesh ref={cursor} position={[0.62, -0.47, 0.07]}>
          <planeGeometry args={[0.09, 0.035]} />
          <meshBasicMaterial color="#58e07f" transparent />
        </mesh>
      </group>
      {/* operator desk + chair (off the walking line) */}
      <mesh position={[19.9, -0.7, 0]}>
        <boxGeometry args={[0.8, 0.08, 2.2]} />
        <meshStandardMaterial color="#242c48" metalness={0.5} roughness={0.5} />
      </mesh>
      <Seat x={19.2} z={-1.35} />
      {hovered && <pointLight position={[19.4, 0.5, 0]} intensity={6} distance={4} color="#58e07f" />}
    </group>
  );
}

/* ──────────────── interior finish: ceiling / walls / floor ──────────────── */

/** Dropped centre ceiling with recessed spots + indirect cove lighting. */
function CabinCeiling() {
  const spots = useRef<THREE.InstancedMesh>(null!);
  const xs = useMemo(() => {
    const list: number[] = [];
    for (let x = -22.5; x <= 20.5; x += 2.15) list.push(x);
    return list;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    xs.forEach((x, i) => {
      d.position.set(x, 2.49, 0);
      d.rotation.set(Math.PI / 2, 0, 0);
      d.updateMatrix();
      spots.current.setMatrixAt(i, d.matrix);
    });
    spots.current.instanceMatrix.needsUpdate = true;
  }, [xs]);
  return (
    <group>
      {/* dropped centre panel */}
      <mesh position={[-2, 2.52, 0]}>
        <boxGeometry args={[46, 0.05, 1.6]} />
        <meshStandardMaterial color="#242a42" roughness={0.85} />
      </mesh>
      {/* recessed downlights */}
      <instancedMesh ref={spots} args={[undefined, undefined, xs.length]}>
        <circleGeometry args={[0.09, 12]} />
        <meshStandardMaterial color="#0d1018" emissive="#fff2dc" emissiveIntensity={1.7} side={THREE.DoubleSide} />
      </instancedMesh>
      {/* indirect cove strips where walls meet the ceiling — lounge glow */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-2, 1.98, s * 2.08]}>
          <boxGeometry args={[46, 0.045, 0.05]} />
          <meshStandardMaterial color="#1b1832" emissive="#7a6ae0" emissiveIntensity={1.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Sidewall finish: lower wall panels, dado rails and inter-window trims. */
function SidewallPanels() {
  const trims = useRef<THREE.InstancedMesh>(null!);
  const count = useMemo(() => {
    let n = 0;
    for (let x = -19.8; x <= 20.6; x += 1.6) n += 2;
    return n;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    let i = 0;
    for (let x = -19.8; x <= 20.6; x += 1.6) {
      for (const side of [-1, 1]) {
        d.position.set(x, 0.42, side * 2.74);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        trims.current.setMatrixAt(i++, d.matrix);
      }
    }
    trims.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      {/* vertical trims between windows */}
      <instancedMesh ref={trims} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.07, 1.7, 0.05]} />
        <meshStandardMaterial color="#2e3552" roughness={0.75} />
      </instancedMesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* lower sidewall panel band */}
          <mesh position={[-2, -0.45, s * 2.71]}>
            <boxGeometry args={[46, 1.05, 0.05]} />
            <meshStandardMaterial color="#262c46" roughness={0.85} />
          </mesh>
          {/* brushed dado rail on top of the band */}
          <mesh position={[-2, 0.08, s * 2.73]}>
            <boxGeometry args={[46, 0.06, 0.05]} />
            <meshStandardMaterial color="#5a6480" metalness={0.6} roughness={0.35} />
          </mesh>
          {/* skirting glow along the floor line */}
          <mesh position={[-2, -0.93, s * 2.66]}>
            <boxGeometry args={[46, 0.035, 0.04]} />
            <meshStandardMaterial color="#141127" emissive="#4a3f8c" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Warm reading lights under the bins, one per passenger seat. */
function ReadingLights() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const seats = useMemo(() => {
    const list: [number, number][] = [];
    for (const x of [-19.5, -18.1, -16.7, -15.3]) {
      for (const z of [-2.25, -1.6, 1.6, 2.25]) list.push([x, z]);
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    seats.forEach(([x, z], i) => {
      d.position.set(x, 1.5, z);
      d.rotation.set(Math.PI / 2, 0, 0);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [seats]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, seats.length]}>
      <circleGeometry args={[0.045, 10]} />
      <meshStandardMaterial color="#0d1018" emissive="#ffd9a0" emissiveIntensity={2.2} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** Illuminated EXIT sign (double-faced, cabin-standard green). */
function ExitSign({ x }: { x: number }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#06120b";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#1f7a45";
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = "#58e07f";
      ctx.font = "700 58px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EXIT", w / 2, h / 2 + 2);
    },
    256,
    96,
    []
  );
  return (
    <group position={[x, 2.08, 0]}>
      {[Math.PI / 2, -Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation={[0, ry, 0]} position={[i === 0 ? 0.016 : -0.016, 0, 0]}>
          <planeGeometry args={[0.5, 0.19]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[0.03, 0.22, 0.54]} />
        <meshStandardMaterial color="#0a0f14" emissive="#58e07f" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** Gathered divider curtains beside a zone arch. */
function ArchCurtains({ x }: { x: number }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* curtain rail */}
          <mesh position={[x, 1.62, side * 2.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.95, 6]} />
            <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* gathered folds */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[x + (i % 2 === 0 ? 0.03 : -0.03), 0.42, side * (1.72 + i * 0.16)]}
            >
              <capsuleGeometry args={[0.065, 2.15, 4, 8]} />
              <meshStandardMaterial color="#332a5e" roughness={1} />
            </mesh>
          ))}
          {/* tie-back band */}
          <mesh position={[x, 0.1, side * 2.04]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.025, 6, 14]} />
            <meshStandardMaterial color="#9d8cff" emissive="#9d8cff" emissiveIntensity={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── sky lounge ───────────────────────── */

function LoungeChair({ x, z, ry }: { x: number; z: number; ry: number }) {
  return (
    <group position={[x, -0.55, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.26, 14]} />
        <meshStandardMaterial color="#1c2130" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.34, 0.3, 0.18, 14]} />
        <meshStandardMaterial color="#3a3468" roughness={0.95} />
      </mesh>
      <mesh position={[-0.26, 0.34, 0]} rotation={[0, 0, 0.22]}>
        <boxGeometry args={[0.12, 0.62, 0.58]} />
        <meshStandardMaterial color="#423b78" roughness={0.95} />
      </mesh>
      {[-0.3, 0.3].map((az) => (
        <mesh key={az} position={[0, 0.16, az]}>
          <boxGeometry args={[0.5, 0.07, 0.08]} />
          <meshStandardMaterial color="#2c2450" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function PottedPlant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, -0.99, z]} scale={scale}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.13, 0.1, 0.28, 10]} />
        <meshStandardMaterial color="#2b2438" roughness={0.9} />
      </mesh>
      {[
        [0, 0.48, 0, 0.2],
        [-0.09, 0.4, 0.07, 0.13],
        [0.09, 0.42, -0.06, 0.14],
      ].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]}>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial color={i === 0 ? "#2f6b4f" : "#3c7a58"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Sky Lounge — a proper lounge corner between the lab and the briefing room:
 * bench sofa with cushions, glowing coffee table, lounge chairs, floor lamp,
 * plants, and a small backlit bar opposite the galley.
 */
function SkyLounge() {
  const barSignTex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#0b0918";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#9d8cff";
      ctx.font = "600 34px 'Consolas', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("● SKY LOUNGE ●", w / 2, h / 2);
    },
    384,
    64,
    []
  );
  return (
    <group>
      {/* ─ lounge corner (port side, x≈6.3) ─ */}
      <mesh position={[6.3, -0.975, -1.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 28]} />
        <meshStandardMaterial color="#211c3e" roughness={1} />
      </mesh>
      {/* bench sofa against the wall */}
      <group position={[6.3, 0, -2.08]}>
        <mesh position={[0, -0.85, 0]}>
          <boxGeometry args={[2.1, 0.3, 0.55]} />
          <meshStandardMaterial color="#1c2130" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[2.2, 0.17, 0.62]} />
          <meshStandardMaterial color="#352f5e" roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.2, -0.26]} rotation={[-0.16, 0, 0]}>
          <boxGeometry args={[2.2, 0.72, 0.13]} />
          <meshStandardMaterial color="#3d3670" roughness={0.95} />
        </mesh>
        {/* throw pillows */}
        <mesh position={[-0.75, -0.44, -0.1]} rotation={[0.15, 0.3, 0.1]}>
          <boxGeometry args={[0.34, 0.3, 0.13]} />
          <meshStandardMaterial color="#ffb454" roughness={1} />
        </mesh>
        <mesh position={[0.78, -0.44, -0.12]} rotation={[0.12, -0.35, -0.08]}>
          <boxGeometry args={[0.34, 0.3, 0.13]} />
          <meshStandardMaterial color="#6fb7ff" roughness={1} />
        </mesh>
      </group>
      {/* glowing coffee table */}
      <group position={[6.3, 0, -1.42]}>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.05, 20]} />
          <meshStandardMaterial color="#10131d" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.63, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.018, 8, 26]} />
          <meshStandardMaterial color="#1b1832" emissive="#9d8cff" emissiveIntensity={1.3} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <cylinderGeometry args={[0.07, 0.13, 0.36, 10]} />
          <meshStandardMaterial color="#1c2130" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* lounge chairs opposite (starboard) */}
      <LoungeChair x={5.75} z={1.95} ry={-0.5} />
      <LoungeChair x={6.95} z={1.95} ry={0.55 + Math.PI} />
      {/* floor lamp between the chairs */}
      <group position={[6.35, 0, 2.35]}>
        <mesh position={[0, -0.97, 0]}>
          <cylinderGeometry args={[0.14, 0.16, 0.04, 12]} />
          <meshStandardMaterial color="#1c2130" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
          <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <coneGeometry args={[0.17, 0.22, 14, 1, true]} />
          <meshStandardMaterial color="#332a5e" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#fff2dc" emissive="#ffd9a0" emissiveIntensity={2.4} />
        </mesh>
        <pointLight position={[0, 0.6, 0]} intensity={4.5} distance={3.4} color="#ffd9a0" />
      </group>
      <PottedPlant x={7.35} z={-2.35} />
      <PottedPlant x={5.2} z={2.42} scale={0.85} />

      {/* ─ bar opposite the galley (x≈1.1, starboard) ─ */}
      <group position={[1.1, 0, 2.12]}>
        {/* counter */}
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[1.7, 0.95, 0.5]} />
          <meshStandardMaterial color="#242c48" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[1.78, 0.05, 0.58]} />
          <meshStandardMaterial color="#8a93a0" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* under-counter glow */}
        <mesh position={[0, -0.96, -0.27]}>
          <boxGeometry args={[1.66, 0.03, 0.03]} />
          <meshStandardMaterial color="#141127" emissive="#9d8cff" emissiveIntensity={1.6} />
        </mesh>
        {/* backlit bottle shelf on the wall */}
        <group position={[0, 0.82, 0.5]}>
          <mesh>
            <boxGeometry args={[1.5, 0.05, 0.24]} />
            <meshStandardMaterial color="#1c2130" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.04, 0.02]}>
            <boxGeometry args={[1.5, 0.02, 0.03]} />
            <meshStandardMaterial color="#141127" emissive="#9d8cff" emissiveIntensity={1.8} />
          </mesh>
          {([["#8f7ae0", -0.5], ["#ffb454", -0.17], ["#6fb7ff", 0.16], ["#58e07f", 0.5]] as const).map(([c, dx]) => (
            <mesh key={c} position={[dx, 0.15, 0]}>
              <cylinderGeometry args={[0.045, 0.05, 0.26, 10]} />
              <meshStandardMaterial color={c} transparent opacity={0.75} roughness={0.2} metalness={0.1} />
            </mesh>
          ))}
        </group>
        {/* lounge sign above the shelf */}
        <mesh position={[0, 1.35, 0.52]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.15, 0.19]} />
          <meshBasicMaterial map={barSignTex} toneMapped={false} />
        </mesh>
        {/* bar stools */}
        {[-0.45, 0.45].map((dx) => (
          <group key={dx} position={[dx, 0, -0.62]}>
            <mesh position={[0, -0.55, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.06, 12]} />
              <meshStandardMaterial color="#352f5e" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.78, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
              <meshStandardMaterial color="#39414e" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.97, 0]}>
              <cylinderGeometry args={[0.12, 0.14, 0.03, 12]} />
              <meshStandardMaterial color="#1c2130" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ─────────────────────── movement + camera ─────────────────────── */

function InteriorRig() {
  const { camera, gl } = useThree();
  const currentSection = useAppStore((s) => s.currentSection);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0); // face toward the nose (-x)
  const pitch = useRef(0);
  const pos = useRef(new THREE.Vector3(getSection(currentSection).x + 1.5, EYE_Y, 0));
  const vel = useRef(new THREE.Vector3());
  const jump = useRef<{ target: number; t: number } | null>(null);
  // id of the pointer that started on the canvas — keeps a second finger on
  // the joystick from steering the camera at the same time
  const lookPointer = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (lookPointer.current !== null) return;
      lookPointer.current = e.pointerId;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== lookPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      // thumbs travel far fewer px than a mouse — higher gain on touch
      const gain = e.pointerType === "touch" ? 0.0068 : 0.004;
      yaw.current += dx * gain;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * gain * 0.75, -0.7, 0.7);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === lookPointer.current) lookPointer.current = null;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const state = useAppStore.getState();

    if (state.jumpTo) {
      jump.current = { target: getSection(state.jumpTo).x, t: 0 };
      state.consumeJump();
    }
    if (jump.current) {
      jump.current.t = Math.min(jump.current.t + dt / 0.9, 1);
      const e = jump.current.t * jump.current.t * (3 - 2 * jump.current.t);
      pos.current.x = THREE.MathUtils.lerp(pos.current.x, jump.current.target, e);
      pos.current.z = THREE.MathUtils.lerp(pos.current.z, 0, e);
      if (jump.current.t >= 1) jump.current = null;
    } else if (!state.openPanel && !state.mapOpen && !state.helpOpen && !state.settingsOpen) {
      // keyboard (digital) + on-screen joystick (analog) share the same axes
      const kf = (keys.current.KeyW || keys.current.ArrowUp ? 1 : 0) - (keys.current.KeyS || keys.current.ArrowDown ? 1 : 0);
      const kr = (keys.current.KeyD || keys.current.ArrowRight ? 1 : 0) - (keys.current.KeyA || keys.current.ArrowLeft ? 1 : 0);
      const f = THREE.MathUtils.clamp(kf + touchMove.forward, -1, 1);
      const r = THREE.MathUtils.clamp(kr + touchMove.right, -1, 1);
      const dirX = -Math.cos(yaw.current);
      const dirZ = -Math.sin(yaw.current);
      const target = new THREE.Vector3(
        (dirX * f + -dirZ * r) * 3.2,
        0,
        (dirZ * f + dirX * r) * 3.2
      );
      vel.current.lerp(target, Math.min(1, dt * 7));
      pos.current.addScaledVector(vel.current, dt);
    }

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -24.6, 19.2);
    const zLimit = pos.current.x < -20 ? 1.05 : 1.95;
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -zLimit, zLimit);
    pos.current.y = EYE_Y;

    camera.position.copy(pos.current);
    const look = new THREE.Vector3(
      pos.current.x - Math.cos(yaw.current) * Math.cos(pitch.current),
      pos.current.y + Math.sin(pitch.current),
      pos.current.z - Math.sin(yaw.current) * Math.cos(pitch.current)
    );
    camera.lookAt(look);

    let nearest = sections[0];
    let best = Infinity;
    for (const s of sections) {
      const d = Math.abs(s.x - pos.current.x);
      if (d < best) {
        best = d;
        nearest = s;
      }
    }
    if (nearest.id !== state.currentSection) state.setCurrentSection(nearest.id);
  });

  return null;
}

/* ─────────────────────────── scene ─────────────────────────── */

const EXHIBIT_LAYOUT: { id: string; x: number; side: 1 | -1 }[] = [
  { id: "pan-tilt-tracker", x: -13, side: -1 },
  { id: "rc-airplane", x: -10.5, side: 1 },
  { id: "plant-watering", x: -8, side: -1 },
  { id: "noise-monitor", x: -5.5, side: 1 },
  { id: "portfolio-website", x: -3, side: -1 },
  { id: "coral-vision", x: -0.5, side: 1 },
];

export default function CabinScene() {
  const quality = useAppStore((s) => s.quality);
  return (
    <>
      <StormDriver />
      <CabinShell />
      <CeilingRibs />
      <CabinCeiling />
      <SidewallPanels />
      <Cockpit />
      {[-19.5, -18.1, -16.7, -15.3].map((x) => (
        <SeatRow key={x} x={x} />
      ))}
      <ReadingLights />
      <Galley />
      <OverheadBins />
      <SkyLounge />
      <ExitSign x={-20.32} />
      <ExitSign x={21.65} />
      <ArchCurtains x={1.6} />
      <ArchCurtains x={7.6} />
      {quality !== "performance" && (
        <Sparkles count={70} scale={[42, 3, 4]} size={1.6} speed={0.18} opacity={0.3} color="#b8bcff" position={[-2, 0.8, 0]} />
      )}
      {EXHIBIT_LAYOUT.map(({ id, x, side }) => {
        const p = projects.find((pr) => pr.id === id);
        return p ? <Exhibit key={id} project={p} x={x} side={side} /> : null;
      })}
      <ResearchLab />
      <BriefingRoom />
      <SystemsBay />
      <CommsTerminal />
      <InteriorRig />
    </>
  );
}
