"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import { useAppStore } from "@/stores/useAppStore";
import type { SectionId } from "@/data/sections";

/**
 * Procedural twin-engine wide-body inspired by the Boeing 777: long clean
 * fuselage (no hump), two very large wing-mounted engines, high-aspect swept
 * wings with raked tips, flap-track fairings, belly fairing, angular cockpit
 * glazing, doors, antennas. Fictional storm-liveried "HJ" design — built
 * entirely from code. Nose points toward -X.
 */

const HULL = "#cfd6de";
const HULL_DARK = "#aab3bf";
const LIVERY = "#241d4d"; // deep storm indigo
const ACCENT = "#9d8cff";
const AMBER = "#ffb454";

const HOTSPOTS: { id: SectionId; x: number; label: string }[] = [
  { id: "cockpit", x: -25.5, label: "About Me" },
  { id: "projects", x: -13, label: "Projects" },
  { id: "research", x: -5, label: "Research" },
  { id: "briefing", x: 2, label: "Experience" },
  { id: "systems", x: 9, label: "Skills" },
  { id: "comms", x: 16, label: "Contact" },
];

function useFuselageGeometry() {
  return useMemo(() => {
    const profile: [number, number][] = [
      [0.02, 0], [0.95, 0.8], [1.85, 2.0], [2.55, 3.8], [2.95, 6.5],
      [3.1, 10], [3.1, 44], [2.8, 50], [2.2, 55], [1.4, 59.5], [0.6, 62.5], [0.06, 64],
    ];
    const geo = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      48
    );
    geo.rotateZ(-Math.PI / 2);
    geo.translate(-32, 0, 0);
    return geo;
  }, []);
}

/** High-aspect swept wing with a raked tip (777 signature). */
function useWingGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-3, 0);      // root leading edge
    s.lineTo(7, 20);      // outboard leading edge
    s.lineTo(10.6, 26.5); // raked tip leading edge
    s.lineTo(11.1, 26.5); // tip
    s.lineTo(8.7, 20);    // trailing edge kink
    s.lineTo(5.6, 0);     // root trailing edge
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.1,
      bevelSegments: 2,
    });
    geo.rotateX(-Math.PI / 2); // span -> -Z
    return geo;
  }, []);
}

function useStabGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(4.2, 9);
    s.lineTo(5.8, 9);
    s.lineTo(4.8, 0);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);
}

function useFinGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(5.4, 8.6);
    s.lineTo(8.0, 8.6);
    s.lineTo(7.4, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false });
  }, []);
}

/** GE90-class engine — enormous nacelle, wide fan, twin exhaust cones. */
function BigEngine({ position }: { position: [number, number, number] }) {
  const fan = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    fan.current.rotation.x += dt * 22;
  });
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.42, 1.5, 4.4, 30, 1, true]} />
        <meshStandardMaterial color={LIVERY} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-2.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.42, 0.13, 12, 34]} />
        <meshStandardMaterial color="#b9c2cc" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[-2.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[1.36, 34]} />
        <meshStandardMaterial color="#090b10" roughness={0.7} />
      </mesh>
      <group ref={fan} position={[-1.95, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[(i * Math.PI) / 4, 0, 0]}>
            <boxGeometry args={[0.05, 2.55, 0.2]} />
            <meshStandardMaterial color="#3b4350" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.3, 0.65, 14]} />
          <meshStandardMaterial color="#8a93a0" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
      {/* core + fan exhaust */}
      <mesh position={[2.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 1.05, 1.3, 24]} />
        <meshStandardMaterial color="#6d675f" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[3.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.34, 1.0, 16]} />
        <meshStandardMaterial color="#4b463f" metalness={0.9} roughness={0.45} />
      </mesh>
      {/* pylon */}
      <mesh position={[0.9, 1.5, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[2.6, 1.6, 0.26]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.55} roughness={0.4} />
      </mesh>
    </group>
  );
}

function CabinWindows() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = useMemo(() => {
    let n = 0;
    for (let x = -24; x <= 18; x += 0.8) n += 2;
    return n;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let x = -24; x <= 18; x += 0.8) {
      for (const side of [-1, 1]) {
        m.setPosition(x, 0.6, side * 3.04);
        ref.current.setMatrixAt(i++, m);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.24, 0.36, 0.14]} />
      {/* warm lit cabin glowing against the storm */}
      <meshStandardMaterial color="#1a1f2b" emissive="#ffd9a0" emissiveIntensity={1.3} roughness={0.2} metalness={0.3} />
    </instancedMesh>
  );
}

/** Six angular flight-deck windows wrapped around the nose. */
function CockpitGlazing() {
  const panes = useMemo(() => {
    const az = [-1.0, -0.62, -0.22, 0.22, 0.62, 1.0];
    return az.map((a) => ({
      a,
      pos: [-28.35 - Math.cos(a) * 1.15, 1.22, Math.sin(a) * 2.05] as [number, number, number],
    }));
  }, []);
  return (
    <group>
      {panes.map(({ a, pos }, i) => (
        <group key={i} position={pos} rotation={[0, -Math.PI / 2 + a, 0]}>
          <mesh rotation={[-0.42, 0, 0]}>
            <planeGeometry args={[0.52, 0.44]} />
            <meshStandardMaterial color="#0a0d16" metalness={0.5} roughness={0.1} emissive="#3a3560" emissiveIntensity={0.4} />
          </mesh>
          {/* frame */}
          <mesh rotation={[-0.42, 0, 0]} position={[0, 0, -0.012]}>
            <planeGeometry args={[0.6, 0.52]} />
            <meshStandardMaterial color="#20242e" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function NavLights() {
  const beacon = useRef<THREE.MeshStandardMaterial>(null!);
  const strobeL = useRef<THREE.MeshStandardMaterial>(null!);
  const strobeR = useRef<THREE.MeshStandardMaterial>(null!);
  const tail = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    beacon.current.emissiveIntensity = (t % 1.6) < 0.12 ? 8 : 0.3;
    const s = (t % 1.1) < 0.06 || ((t + 0.15) % 1.1) < 0.06 ? 12 : 0.7;
    strobeL.current.emissiveIntensity = s;
    strobeR.current.emissiveIntensity = s;
    tail.current.emissiveIntensity = (t % 1.1) < 0.06 ? 10 : 1.5;
  });
  return (
    <>
      <mesh position={[-6, 3.22, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial ref={beacon} color="#440000" emissive="#ff2a1f" emissiveIntensity={1} />
      </mesh>
      <mesh position={[9.9, 0.35, 26.4]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial ref={strobeL} color="#330000" emissive="#ff3b30" emissiveIntensity={1} />
      </mesh>
      <mesh position={[9.9, 0.35, -26.4]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial ref={strobeR} color="#002200" emissive="#30d158" emissiveIntensity={1} />
      </mesh>
      <mesh position={[31.6, 0.5, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial ref={tail} color="#333" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
    </>
  );
}

/** Volumetric-looking landing-light beams cutting through the storm. */
function LandingLights() {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s} position={[-5.5, -1.9, s * 3.3]}>
          <mesh rotation={[0, 0, -Math.PI / 2]} position={[-14, 0, 0]}>
            <coneGeometry args={[3.0, 28, 20, 1, true]} />
            <meshBasicMaterial
              color="#cdd6ff"
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Wingtip condensation trails — pulse stronger as the aircraft banks. */
function WingTrails() {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#c9cfff",
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  useFrame(({ clock }) => {
    material.opacity = 0.05 + Math.abs(Math.sin(clock.elapsedTime * 0.13)) * 0.12;
  });
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[38, 0.35, s * 26.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.18, 56, 8, 1, true]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </>
  );
}

function WindowHotspot({ id, x, label }: { id: SectionId; x: number; label: string }) {
  const [hovered, setHovered] = useState(false);
  const board = useAppStore((s) => s.board);
  const ring = useRef<THREE.Mesh>(null!);
  useCursor(hovered);
  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.08;
    ring.current.scale.setScalar(hovered ? 1.25 : pulse);
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    board(id);
  };
  return (
    <group position={[x, 0.6, 3.2]}>
      <mesh
        ref={ring}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <ringGeometry args={[0.4, 0.55, 32]} />
        <meshBasicMaterial
          color={hovered ? "#ffffff" : ACCENT}
          transparent
          opacity={hovered ? 0.95 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh onClick={onClick} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)} visible={false}>
        <sphereGeometry args={[1.1, 8, 8]} />
      </mesh>
      <mesh position={[0, 0, -0.12]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color={hovered ? "#ffe9c4" : "#c9bfff"} transparent opacity={hovered ? 1 : 0.8} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={26} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div
            style={{
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: 6,
              background: "rgba(11,8,24,0.9)",
              border: "1px solid rgba(157,140,255,0.55)",
              color: "#efeaff",
              fontFamily: "Consolas, monospace",
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {label} ▸ board here
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Aircraft() {
  const group = useRef<THREE.Group>(null!);
  const fuselage = useFuselageGeometry();
  const wing = useWingGeometry();
  const stab = useStabGeometry();
  const fin = useFinGeometry();
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    // storm flying: pronounced banking + pitch, with light turbulence jitter
    group.current.rotation.x =
      Math.sin(t * 0.13) * 0.085 + Math.sin(t * 1.7) * 0.006;
    group.current.rotation.z =
      Math.sin(t * 0.21) * 0.03 + Math.sin(t * 2.3) * 0.004;
    group.current.rotation.y = Math.sin(t * 0.07) * 0.035;
    group.current.position.y =
      Math.sin(t * 0.4) * 0.7 + Math.sin(t * 3.1) * 0.05 + Math.sin(t * 9) * 0.015;
  });

  const hullMat = (
    <meshStandardMaterial color={HULL} metalness={0.55} roughness={0.32} envMapIntensity={1.2} />
  );

  const flapFairings = useMemo(() => {
    const items: { x: number; z: number; s: number }[] = [];
    for (const side of [-1, 1]) {
      for (const span of [4.5, 8.5, 12.5, 16.5]) {
        items.push({ x: 4.2 + span * 0.28, z: side * span, s: 1 - span * 0.02 });
      }
    }
    return items;
  }, []);

  return (
    <group ref={group}>
      <mesh geometry={fuselage}>{hullMat}</mesh>
      {/* wing-to-body belly fairing */}
      <mesh position={[1, -1.9, 0]} scale={[9.5, 1.5, 2.7]}>
        <sphereGeometry args={[1, 26, 18]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.55} roughness={0.38} />
      </mesh>
      <CockpitGlazing />
      {/* violet cheatline */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-3, -0.2, s * 3.06]}>
          <boxGeometry args={[49, 0.26, 0.06]} />
          <meshStandardMaterial color="#5b4fc8" emissive="#5b4fc8" emissiveIntensity={0.25} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* door outlines */}
      {[-22, -12, 2, 14].map((dx) =>
        [-1, 1].map((s) => (
          <mesh key={`${dx}${s}`} position={[dx, 0.25, s * 3.075]}>
            <boxGeometry args={[0.06, 1.15, 0.55]} />
            <meshStandardMaterial color={HULL_DARK} metalness={0.5} roughness={0.45} />
          </mesh>
        ))
      )}
      {/* antennas + APU area */}
      <mesh position={[-14, 3.15, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.5, 0.35, 0.05]} />
        <meshStandardMaterial color={HULL_DARK} />
      </mesh>
      <mesh position={[6, 3.12, 0]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshStandardMaterial color={HULL_DARK} />
      </mesh>
      {/* wings with raked tips */}
      <group position={[-1, -1.15, 0]}>
        <mesh geometry={wing} rotation={[0.08, 0, 0]}>{hullMat}</mesh>
        <mesh geometry={wing} rotation={[-0.08, 0, 0]} scale={[1, 1, -1]}>
          <meshStandardMaterial color={HULL} metalness={0.55} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* flap-track fairings under the wings */}
      {flapFairings.map(({ x, z, s }, i) => (
        <mesh key={i} position={[x, -1.55 + Math.abs(z) * 0.075, z]} rotation={[0, 0, Math.PI / 2]} scale={s}>
          <capsuleGeometry args={[0.16, 1.7, 4, 10]} />
          <meshStandardMaterial color={HULL_DARK} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* two giant engines */}
      <BigEngine position={[-4.4, -2.6, -8.5]} />
      <BigEngine position={[-4.4, -2.6, 8.5]} />
      {/* horizontal stabilizers */}
      <group position={[25.2, 0.95, 0]}>
        <mesh geometry={stab} rotation={[0.09, 0, 0]}>{hullMat}</mesh>
        <mesh geometry={stab} rotation={[-0.09, 0, 0]} scale={[1, 1, -1]}>
          <meshStandardMaterial color={HULL} metalness={0.55} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* vertical fin — storm-indigo livery with lightning stripes */}
      <group position={[23.6, 1.3, -0.15]}>
        <mesh geometry={fin}>
          <meshStandardMaterial color={LIVERY} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[6.1, 6.6, 0.16]} rotation={[0, 0, 1.01]}>
          <boxGeometry args={[3.6, 0.3, 0.34]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[5.6, 5.7, 0.16]} rotation={[0, 0, 1.01]}>
          <boxGeometry args={[3.3, 0.16, 0.34]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.7} />
        </mesh>
      </group>
      <CabinWindows />
      <NavLights />
      <LandingLights />
      <WingTrails />
      {/* logo light wash on the tail */}
      <pointLight position={[27, 4.5, 3]} intensity={20} distance={9} color="#cfc8ff" />
      {HOTSPOTS.map((h) => (
        <WindowHotspot key={h.id} {...h} />
      ))}
    </group>
  );
}
