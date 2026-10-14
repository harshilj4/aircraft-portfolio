"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useCursor, useTexture, Sparkles } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ClubSeats, ImportedLoungeChair } from "./LuxurySeats";
import { useAppStore } from "@/stores/useAppStore";
import { sections, getSection } from "@/data/sections";
import { projects, type Project } from "@/data/projects";
import { skillGroups } from "@/data/skills";
import { useCanvasTexture, drawExhibitScreen, drawZoneSign } from "@/lib/canvasTexture";
import {
  drawPFD, drawND, drawEICAS, drawMFD,
  drawBriefing, drawSystemsPanel, drawComms, drawLabScreen,
} from "@/lib/cockpitDisplays";
import { touchMove, touchJump } from "@/lib/touchControls";
import { blocksCabinPosition } from "@/lib/cabinCollision";
import type { PerfProfile } from "@/lib/device";

/**
 * DAYBREAK CABIN — a bright, sunlit exhibition deck.
 *
 * Performance shape (the previous build ran 7 dynamic point lights and a few
 * hundred individually-drawn meshes, which is what made phones crawl):
 *   · 2 lights total — hemisphere + directional. Every "lamp" you can see is
 *     an emissive surface, which costs nothing per fragment.
 *   · MeshLambertMaterial throughout. Full PBR on 200 interior surfaces buys
 *     nothing in a diffuse cabin and costs a great deal per pixel.
 *   · Seats, windows, ribs and downlights are instanced — the entire economy
 *     cabin is ~6 draw calls instead of ~100.
 * Fuselage runs along X: nose bulkhead -26, tail bulkhead +22.
 */

const EYE_Y = 0.55;

/* palette */
const WALL = "#eee5d7";
const WALL_SHADE = "#d1c0a7";
const TRIM = "#c7b69a";
const WOOD = "#553523";
const CARPET = "#272c32";
const SEAT_BODY = "#cdbb9e";
const SEAT_TRIM = "#996847";
const BRASS = "#b78c59";
const INK = "#14161a";
const SIGNAL = "#c76445";

const ZONES = [
  { id: "cockpit", accent: "#10395e", from: -26, to: -20.4, sign: -20.4 },
  { id: "projects", accent: "#e2571f", from: -20.4, to: 1.6, sign: -14.6 },
  { id: "research", accent: "#7b4fa8", from: 1.6, to: 7.6, sign: 1.6 },
  { id: "briefing", accent: "#1f7a55", from: 7.6, to: 13.2, sign: 7.6 },
  { id: "systems", accent: "#1b5081", from: 13.2, to: 17.8, sign: 13.2 },
  { id: "comms", accent: "#b83f12", from: 17.8, to: 22, sign: 17.8 },
] as const;

function SoftBox({args,radius=.07}:{args:[number,number,number];radius?:number}) {
  const geometry=useMemo(()=>new RoundedBoxGeometry(args[0],args[1],args[2],2,Math.min(radius,Math.min(...args)*.4)),[args[0],args[1],args[2],radius]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <primitive object={geometry} attach="geometry"/>;
}

function ClubTables() {
  return <group>
    {[-1.75,1.75].map(z=><group key={z} position={[-17.4,0,z]}>
      <mesh position={[0,-.28,0]}><SoftBox args={[1.06,.07,.8]}/><meshLambertMaterial color={WOOD}/></mesh>
      <mesh position={[0,-.33,0]}><SoftBox args={[1,.035,.75]}/><meshLambertMaterial color={BRASS}/></mesh>
      <mesh position={[0,-.66,0]}><cylinderGeometry args={[.07,.12,.63,10]}/><meshLambertMaterial color="#8b7963"/></mesh>
      <mesh position={[.25,-.18,0]}><cylinderGeometry args={[.065,.055,.14,12]}/><meshLambertMaterial color="#eee2cc"/></mesh>
    </group>)}
  </group>;
}

/**
 * Hides its children once the camera is far down the cabin.
 *
 * The fuselage is a 48-unit tube, so standing at one end every exhibit, panel
 * and console at the other end is still inside the frustum and still drawn —
 * paying full material and texture cost for things a few pixels tall. Toggling
 * `group.visible` in the frame loop (rather than React state) skips the whole
 * subtree with zero re-renders.
 */
function ZoneGate({
  x,
  range,
  children,
}: {
  x: number;
  range: number;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ camera }) => {
    g.current.visible = Math.abs(camera.position.x - x) < range;
  });
  return <group ref={g}>{children}</group>;
}

/* ───────────────────────────── textures ───────────────────────────── */

function useCarpetTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = CARPET;
    ctx.fillRect(0, 0, 128, 128);
    // woven speckle
    for (let i = 0; i < 2600; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    // faint tonal chevron — pattern, not colour
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    for (let y = -128; y < 128; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y + 32);
      ctx.lineTo(128, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(26, 2);
    return tex;
  }, []);
}

/**
 * The view out of the window: dawn sky with clouds that actually drift past.
 * One shared texture scrolled by UV offset — every window in the cabin uses
 * it, so the whole effect costs a single texture and no extra draw calls, and
 * it does more for "you are airborne" than any amount of extra geometry.
 */
function useWindowSkyTexture() {
  const time = useAppStore(s=>s.timeOfDay);
  const texture = useMemo(() => {
    // Match the window's tall aspect ratio so clouds stay cloud-shaped.
    const W = 256;
    const H = 384;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const colors=time==="midnight"?["#010208","#050917","#10182b","#080d18"]:time==="evening"?["#3d4265","#b56a71","#efa76c","#8c6374"]:["#4b83ac","#a8cedc","#e1e9e5","#e9d8bd"];
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.50, colors[1]);
    g.addColorStop(0.68, colors[2]);
    g.addColorStop(1, colors[3]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // wrap-around cloud puffs so the scroll never shows a seam
    let s = 4211;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 32; i++) {
      const x = rnd() * W;
      const y = H * (0.58 + rnd() * 0.32);
      const r = 18 + rnd() * 42;
      const a = time==="midnight"?0.015:0.24 + rnd() * 0.34;
      for (const ox of [-W, 0, W]) {
        const rg = ctx.createRadialGradient(x + ox, y, 0, x + ox, y, r);
        rg.addColorStop(0, `rgba(255,255,255,${a})`);
        rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(x + ox, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if(time==="midnight") {
      ctx.fillStyle="#8c9caf";
      for(let i=0;i<24;i++)ctx.fillRect(rnd()*W,rnd()*H*.6,1,1);
    }
    if(time==="evening") {
      const sun=ctx.createRadialGradient(180,218,2,180,218,43);
      sun.addColorStop(0,"#ffe2a1");sun.addColorStop(.12,"#f8cf8b");sun.addColorStop(1,"rgba(255,163,85,0)");ctx.fillStyle=sun;ctx.fillRect(130,170,100,100);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [time]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return texture;
}

/** Sidewall panel map — soft vertical joins, keeps the walls from reading flat. */
function useWallTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f1f0e9";
    ctx.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = "rgba(35,64,67,0.13)";
      ctx.fillRect(x, 0, 1.5, 64);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(x + 2, 0, 1, 64);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(9, 1);
    return tex;
  }, []);
}

/** A real cabin window silhouette, shared by every instanced window. */
function roundedWindow(width: number, height: number, radius: number) {
  const s = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ShapeGeometry(s, 4);
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (uv.getX(i) + width / 2) / width, (uv.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return geometry;
}

/* ───────────────────────────── shell ───────────────────────────── */

function CabinShell() {
  const time=useAppStore(s=>s.timeOfDay);
  const night=time==="midnight", evening=time==="evening";
  const carpet = useCarpetTexture();
  const veneer = useTexture("/textures/cabin/walnut.jpg");
  const wall = useMemo(()=>{const t=veneer.clone();t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(18,1);t.colorSpace=THREE.SRGBColorSpace;return t;},[veneer]);
  useEffect(()=>()=>wall.dispose(),[wall]);
  const windowSky = useWindowSkyTexture();
  const glassGeometry = useMemo(() => roundedWindow(0.61, 0.88, 0.29), []);
  const revealGeometry = useMemo(() => roundedWindow(0.69, 0.97, 0.32), []);
  const bezelGeometry = useMemo(() => roundedWindow(0.84, 1.12, 0.39), []);

  // clouds slide past the windows
  useFrame((_, dt) => {
    windowSky.offset.x = (windowSky.offset.x + dt * 0.026) % 1;
  });

  // windows: one instanced mesh for the glass, one for the surrounds
  const glass = useRef<THREE.InstancedMesh>(null!);
  const reveal = useRef<THREE.InstancedMesh>(null!);
  const bezel = useRef<THREE.InstancedMesh>(null!);
  const slots = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -19; x <= 20; x += 1.6) for (const s of [-1, 1]) out.push([x, s]);
    return out;
  }, []);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    slots.forEach(([x, s], i) => {
      d.position.set(x, 0.62, s * 2.68);
      d.rotation.set(0, s === 1 ? Math.PI : 0, 0);
      d.updateMatrix();
      glass.current.setMatrixAt(i, d.matrix);
      d.position.set(x, 0.62, s * 2.70);
      d.updateMatrix();
      reveal.current.setMatrixAt(i, d.matrix);
      d.position.set(x, 0.62, s * 2.72);
      d.updateMatrix();
      bezel.current.setMatrixAt(i, d.matrix);
    });
    glass.current.instanceMatrix.needsUpdate = true;
    reveal.current.instanceMatrix.needsUpdate = true;
    bezel.current.instanceMatrix.needsUpdate = true;
  }, [slots]);

  // structural frames
  const ribs = useRef<THREE.InstancedMesh>(null!);
  const ribXs = useMemo(() => {
    const xs: number[] = [];
    for (let x = -23; x <= 21; x += 1.6) xs.push(x);
    return xs;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    ribXs.forEach((x, i) => {
      d.position.set(x, 0, 0);
      d.rotation.set(0, Math.PI / 2, 0);
      d.updateMatrix();
      ribs.current.setMatrixAt(i, d.matrix);
    });
    ribs.current.instanceMatrix.needsUpdate = true;
  }, [ribXs]);

  // recessed ceiling downlights
  const spots = useRef<THREE.InstancedMesh>(null!);
  const spotXs = useMemo(() => {
    const xs: number[] = [];
    for (let x = -22.5; x <= 20.5; x += 2.1) xs.push(x);
    return xs;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    spotXs.forEach((x, i) => {
      // Ceiling panel ends at y=2.47. A visible gap prevents z-fighting.
      d.position.set(x, 2.435, 0);
      d.rotation.set(Math.PI / 2, 0, 0);
      d.updateMatrix();
      spots.current.setMatrixAt(i, d.matrix);
    });
    spots.current.instanceMatrix.needsUpdate = true;
  }, [spotXs]);

  return (
    <group>
      {/* fuselage tube */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[2.9, 2.9, 50, 24, 1, true]} />
        <meshLambertMaterial color={WALL} side={THREE.BackSide} />
      </mesh>

      {/* bulkheads */}
      {([[-26, Math.PI / 2], [22, -Math.PI / 2]] as const).map(([x, ry]) => (
        <group key={x} position={[x, 0, 0]} rotation={[0, ry, 0]}>
          <mesh>
            <circleGeometry args={[2.95, 28]} />
            <meshLambertMaterial color={WALL_SHADE} />
          </mesh>
          <mesh position={[0, 0.12, 0.035]}>
            <boxGeometry args={[1.78, 2.35, 0.05]} />
            <meshLambertMaterial color={TRIM} />
          </mesh>
          <mesh position={[0, 0.12, 0.075]}>
            <boxGeometry args={[1.59, 2.16, 0.035]} />
            <meshLambertMaterial color={WALL} />
          </mesh>
          <mesh position={[-0.56, 0.12, 0.105]}>
            <boxGeometry args={[0.08, 0.32, 0.03]} />
            <meshLambertMaterial color={SEAT_BODY} />
          </mesh>
          <mesh position={[0, 1.38, 0.08]}>
            <boxGeometry args={[1.36, 0.16, 0.05]} />
            <meshBasicMaterial color="#c4dcd0" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Floor pan + carpet runner. The carpet MUST sit clear of the pan's top
          face — coincident surfaces z-fight and the floor tears into flickering
          stripes as the camera moves. 8mm of separation is invisible and safe. */}
      <mesh position={[-2, -1.06, 0]}>
        <boxGeometry args={[48, 0.12, 4.7]} />
        <meshLambertMaterial color="#41555c" />
      </mesh>
      <mesh position={[-2, -0.992, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[48, 4.5]} />
        <meshLambertMaterial map={carpet} />
      </mesh>

      {/* continuous brass aisle inlay — zone colour lives on the arches and
          placards instead, so the floor stays calm */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-2, -0.962, s * 0.9]}>
          <boxGeometry args={[46, 0.02, 0.04]} />
          <meshLambertMaterial color={BRASS} />
        </mesh>
      ))}

      {/* sidewall panels + dado rail + wood accent */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[-2, -0.42, s * 2.72]}>
            <boxGeometry args={[48, 1.1, 0.06]} />
            <meshLambertMaterial map={wall} color="#c0a484" />
          </mesh>
          <mesh position={[-2, 0.16, s * 2.74]}>
            <boxGeometry args={[48, 0.09, 0.05]} />
            <meshLambertMaterial color={BRASS} />
          </mesh>
          <mesh position={[-2, -0.95, s * 2.66]}>
            <boxGeometry args={[48, 0.05, 0.05]} />
            <meshLambertMaterial color={TRIM} />
          </mesh>
        </group>
      ))}

      {/* dropped ceiling panel + warm cove strips */}
      <mesh position={[-2, 2.5, 0]}>
        <boxGeometry args={[46, 0.06, 1.7]} />
        <meshLambertMaterial color="#f3e8d6" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-2, 2.02, s * 2.06]}>
          <boxGeometry args={[46, 0.05, 0.06]} />
          <meshBasicMaterial color={night?"#e1ae69":evening?"#ffd3a1":"#fff0d1"} toneMapped={false} />
        </mesh>
      ))}
      <instancedMesh ref={spots} args={[undefined, undefined, spotXs.length]} frustumCulled={false}>
        <circleGeometry args={[0.1, 10]} />
        <meshBasicMaterial color="#fff0d8" side={THREE.DoubleSide} toneMapped={false} />
      </instancedMesh>

      {/* structural frames */}
      <instancedMesh ref={ribs} args={[undefined, undefined, ribXs.length]} frustumCulled={false}>
        <torusGeometry args={[2.86, 0.019, 5, 24]} />
        <meshLambertMaterial color="#ddd0b9" />
      </instancedMesh>

      {/* windows — bright dawn outside */}
      <instancedMesh ref={bezel} args={[undefined, undefined, slots.length]} frustumCulled={false}>
        <primitive object={bezelGeometry} attach="geometry" />
        <meshLambertMaterial color="#f6f3e8" />
      </instancedMesh>
      <instancedMesh ref={reveal} args={[undefined, undefined, slots.length]} frustumCulled={false}>
        <primitive object={revealGeometry} attach="geometry" />
        <meshLambertMaterial color="#876d4d" />
      </instancedMesh>
      <instancedMesh ref={glass} args={[undefined, undefined, slots.length]} frustumCulled={false}>
        <primitive object={glassGeometry} attach="geometry" />
        <meshBasicMaterial map={windowSky} toneMapped={false} />
      </instancedMesh>

      {/* zone arches + placards */}
      {ZONES.map((z) => {
        const sec = sections.find((s) => s.id === z.id)!;
        return (
          <group key={z.id}>
            <mesh position={[z.sign, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[2.78, 0.05, 6, 30]} />
              <meshLambertMaterial color={TRIM} />
            </mesh>
            {z.id !== "cockpit" && (
              <ZoneSign x={z.sign + 0.01} zone={sec.zoneName} tagline={sec.name} accent={z.accent} />
            )}
          </group>
        );
      })}

      {/* ── cabin lighting: three cheap, normal-independent sources ──
          Ambient does the heavy lifting because a BackSide fuselage tube has
          outward-facing normals, so any directional/hemisphere term lights the
          interior as if from outside and turns the walls muddy. Ambient is
          also the cheapest light there is — no per-fragment work at all. */}
      <ambientLight intensity={night?.43:evening?.83:1.1} color={night?"#ebceab":"#fff2de"} />
      <directionalLight position={[-6, 5, 16]} intensity={night?.28:evening?.6:.72} color={evening?"#ffc18a":"#ffefd8"} />
      <directionalLight position={[6, 4, -16]} intensity={night?.15:.28} color={night?"#99afd3":"#c4d8e6"} />
    </group>
  );
}

function ZoneSign({ x, zone, tagline, accent }: { x: number; zone: string; tagline: string; accent: string }) {
  const time=useAppStore(s=>s.timeOfDay);
  const tex = useCanvasTexture((ctx, w, h) => drawZoneSign(ctx, w, h, { zone, tagline, accent }), 512, 128, [zone]);
  return (
    <group position={[x, 1.78, 0]}>
      {[Math.PI / 2, -Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation={[0, ry, 0]} position={[i === 0 ? 0.012 : -0.012, 0, 0]}>
          <planeGeometry args={[1.7, 0.42]} />
          <meshBasicMaterial map={tex} color={time==="midnight"?"#a9a18e":"#ffffff"} toneMapped={false} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[0, 0.4, z]}>
          <cylinderGeometry args={[0.014, 0.014, 0.4, 5]} />
          <meshLambertMaterial color={TRIM} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────── instanced seating ───────────────────────── */

/**
 * All economy seats drawn as 5 instanced meshes regardless of seat count.
 * Adding rows costs a matrix, not a draw call.
 */
function SeatBlocks({ rows }: { rows: number[] }) {
  const seats = useMemo(() => rows.flatMap((x,i) => [-1.75,1.75].map(z => ({x,z,rotation:i%2===0?Math.PI:0}))), [rows]);
  return <ClubSeats seats={seats}/>;
}

/** Single seat used for the lounge / briefing furniture. */
function Seat({x,z,ry=0}:{x:number;z:number;ry?:number}) {
  const seats=useMemo(()=>[{x,z,rotation:ry}],[x,z,ry]);
  return <ClubSeats seats={seats}/>;
}

function OverheadBins() {
  const seams = useRef<THREE.InstancedMesh>(null!);
  const seamPositions = useMemo(() => {
    const out: [number, number][] = [];
    for (const [bx, len] of [[-17.4, 5.6], [0.6, 3.2], [15.5, 3.0]]) {
      for (let x = bx - len / 2 + 1.1; x < bx + len / 2; x += 1.1) {
        out.push([x, -1], [x, 1]);
      }
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    seamPositions.forEach(([x, s], i) => {
      d.position.set(x, 1.82, s * 2.12);
      d.rotation.set(s * -0.45, 0, 0);
      d.updateMatrix();
      seams.current.setMatrixAt(i, d.matrix);
    });
    seams.current.instanceMatrix.needsUpdate = true;
  }, [seamPositions]);
  return (
    <>
      {([[-17.4, 5.6], [0.6, 3.2], [15.5, 3.0]] as const).map(([bx, len]) =>
        [-1, 1].map((s) => (
          <group key={`${bx}${s}`}>
            <mesh position={[bx, 1.82, s * 2.12]} rotation={[s * -0.45, 0, 0]}>
              <boxGeometry args={[len, 0.42, 0.78]} />
              <meshLambertMaterial color={WALL} />
            </mesh>
            <mesh position={[bx, 1.62, s * 2.34]} rotation={[s * -0.45, 0, 0]}>
              <boxGeometry args={[len, 0.05, 0.05]} />
              <meshLambertMaterial color={WOOD} />
            </mesh>
          </group>
        ))
      )}
      <instancedMesh ref={seams} args={[undefined, undefined, seamPositions.length]} frustumCulled={false}>
        <boxGeometry args={[0.016, 0.4, 0.79]} />
        <meshLambertMaterial color="#829593" />
      </instancedMesh>
    </>
  );
}

function Galley() {
  return (
    <group position={[0.7, -0.99, -2.05]}>
      <mesh position={[0, 0.75, 0]}>
        <SoftBox args={[1.9, 1.5, 0.7]} />
        <meshLambertMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 1.53, 0]}>
        <SoftBox args={[1.96, 0.07, 0.78]} />
        <meshLambertMaterial color="#e5d8c1" />
      </mesh>
      {[-0.6, 0, 0.6].map((dx) => (
        <mesh key={dx} position={[dx, 0.4, 0.12]}>
          <SoftBox args={[0.5, 0.8, 0.55]} />
          <meshLambertMaterial color="#765038" />
        </mesh>
      ))}
      <mesh position={[0.55, 1.18, 0.18]}>
        <boxGeometry args={[0.3, 0.24, 0.3]} />
        <meshLambertMaterial color={INK} />
      </mesh>
    </group>
  );
}

/* ───────────────────────── project exhibits ───────────────────────── */

function TurretProp() {
  const head = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    head.current.rotation.y = Math.sin(clock.elapsedTime * 0.9) * 0.7;
    head.current.rotation.z = Math.sin(clock.elapsedTime * 1.3) * 0.18;
  });
  return (
    <group position={[0, 1.26, -0.13]} scale={0.32}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.25, 14]} />
        <meshLambertMaterial color="#8d949c" />
      </mesh>
      <group ref={head} position={[0, 0.45, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.45]} />
          <meshLambertMaterial color="#4a525c" />
        </mesh>
        <mesh position={[0.42, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
          <meshLambertMaterial color={INK} />
        </mesh>
        <mesh position={[0.7, 0.05, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#34c759" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function PlaneProp() {
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    g.current.rotation.y = clock.elapsedTime * 0.4;
    g.current.position.y = 1.36 + Math.sin(clock.elapsedTime * 1.1) * 0.05;
  });
  return (
    <group ref={g} position={[0, 1.36, -0.13]} scale={0.28}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, 1.6, 4, 8]} />
        <meshLambertMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0.2, 0.05, 0]}>
        <boxGeometry args={[0.5, 0.04, 2.4]} />
        <meshLambertMaterial color={SIGNAL} />
      </mesh>
      <mesh position={[-0.85, 0.15, 0]}>
        <boxGeometry args={[0.25, 0.35, 0.05]} />
        <meshLambertMaterial color={SIGNAL} />
      </mesh>
      <mesh position={[-0.8, 0.05, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.9]} />
        <meshLambertMaterial color="#f4f1ea" />
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
        accent: "#aac6b9",
      }),
    640, 400, [project.id]
  );

  return (
    <group
      position={[x, -0.99, side * 1.95]}
      rotation={[0, side === -1 ? 0 : Math.PI, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        setPanel(project.zone === "research" ? "research" : "projects");
        setProject(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Flush wall terminal and a fold-down tray keep the aisle open. */}
      <mesh position={[0, 1.54, -0.65]}>
        <boxGeometry args={[1.73, 1.17, 0.07]} />
        <meshLambertMaterial color="#6d8585" />
      </mesh>
      <mesh position={[0, 1.08, -0.30]}>
        <boxGeometry args={[1.48, 0.055, 0.58]} />
        <meshLambertMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0.94, -0.56]}>
        <boxGeometry args={[1.35, 0.24, 0.07]} />
        <meshLambertMaterial color={WALL_SHADE} />
      </mesh>
      {project.id === "pan-tilt-tracker" && <TurretProp />}
      {project.id === "rc-airplane" && <PlaneProp />}

      {/* display */}
      <group position={[0, 1.55, -0.60]} rotation={[-0.08, 0, 0]} scale={hovered ? 1.02 : 1}>
        <mesh>
          <boxGeometry args={[1.6, 1.04, 0.06]} />
          <meshLambertMaterial color={INK} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.48, 0.925]} />
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.54, 0.02]}>
          <boxGeometry args={[1.6, 0.06, 0.08]} />
          <meshBasicMaterial color="#aac6b9" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────────────────────── cockpit ───────────────────────────── */

function Cockpit() {
  const [hovered, setHovered] = useState(false);
  const setPanel = useAppStore((s) => s.setPanel);
  useCursor(hovered);

  const pfd = useCanvasTexture(drawPFD, 320, 320, []);
  const nd = useCanvasTexture(drawND, 320, 320, []);
  const eicas = useCanvasTexture(drawEICAS, 320, 320, []);
  const mfd = useCanvasTexture(drawMFD, 640, 360, []);

  const panes = useMemo(() => {
    const az = [-0.95, -0.55, -0.18, 0.18, 0.55, 0.95];
    return az.map((a) => ({
      a,
      pos: [-25.45 + (1 - Math.cos(a)) * 0.85, 1.02, Math.sin(a) * 1.95] as [number, number, number],
    }));
  }, []);

  const buttons = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 9; c++) {
        d.position.set(-24.55 + r * 0.16, 1.72 + r * 0.05, -0.64 + c * 0.16);
        d.rotation.set(0, 0, 0.3);
        d.updateMatrix();
        buttons.current.setMatrixAt(i++, d.matrix);
      }
    }
    buttons.current.instanceMatrix.needsUpdate = true;
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
      {/* windshield — bright dawn outside */}
      {panes.map(({ a, pos }, i) => (
        <group key={i} position={pos} rotation={[0, Math.PI / 2 + a, 0]}>
          <mesh rotation={[0.32, 0, 0]}>
            <planeGeometry args={[0.78, 0.62]} />
            <meshBasicMaterial color="#cfe4f2" toneMapped={false} />
          </mesh>
          <mesh rotation={[0.32, 0, 0]} position={[0, 0, -0.015]}>
            <planeGeometry args={[0.9, 0.74]} />
            <meshLambertMaterial color={WALL_SHADE} />
          </mesh>
        </group>
      ))}

      <mesh position={[-24.55, 0.52, 0]}>
        <boxGeometry args={[0.95, 0.2, 3.5]} />
        <meshLambertMaterial color="#2b3038" />
      </mesh>
      <mesh position={[-24.1, 0.53, 0]}>
        <boxGeometry args={[0.06, 0.12, 2.6]} />
        <meshBasicMaterial color="#e0a02a" toneMapped={false} />
      </mesh>

      {/* instrument panel */}
      <group position={[-24.3, 0.02, 0]} rotation={[0, 0, -0.28]}>
        <mesh>
          <boxGeometry args={[0.6, 0.95, 3.5]} />
          <meshLambertMaterial color="#31363e" />
        </mesh>
        {([[pfd, -1.3], [nd, -0.48], [eicas, 0.48]] as const).map(([tex, z], i) => (
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

      {/* pedestal + throttles */}
      <mesh position={[-23.35, -0.62, 0]}>
        <boxGeometry args={[1.15, 0.55, 0.72]} />
        <meshLambertMaterial color="#3a4049" />
      </mesh>
      {[-0.14, 0.14].map((z) => (
        <group key={z} position={[-23.45, -0.28, z]} rotation={[0, 0, -0.35]}>
          <mesh>
            <boxGeometry args={[0.07, 0.34, 0.09]} />
            <meshLambertMaterial color="#5c636b" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshLambertMaterial color={INK} />
          </mesh>
        </group>
      ))}

      {/* yokes + seats */}
      {[-0.85, 0.85].map((z) => (
        <group key={z}>
          <group position={[-23.15, -0.35, z]}>
            <mesh rotation={[0, 0, -0.25]}>
              <cylinderGeometry args={[0.035, 0.045, 0.55, 6]} />
              <meshLambertMaterial color="#2b3038" />
            </mesh>
            <mesh position={[-0.07, 0.3, 0]}>
              <boxGeometry args={[0.06, 0.07, 0.3]} />
              <meshLambertMaterial color={INK} />
            </mesh>
          </group>
          <group position={[-22.15, -0.5, z]}>
            <mesh>
              <boxGeometry args={[0.62, 0.18, 0.62]} />
              <meshLambertMaterial color={SEAT_BODY} />
            </mesh>
            <mesh position={[0.3, 0.55, 0]}>
              <boxGeometry args={[0.15, 1.05, 0.6]} />
              <meshLambertMaterial color={SEAT_BODY} />
            </mesh>
            <mesh position={[0.32, 1.16, 0]}>
              <boxGeometry args={[0.15, 0.24, 0.36]} />
              <meshLambertMaterial color={SEAT_TRIM} />
            </mesh>
          </group>
        </group>
      ))}

      {/* overhead panel */}
      <mesh position={[-24.2, 1.78, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.3, 0.08, 1.7]} />
        <meshLambertMaterial color="#3a4049" />
      </mesh>
      <instancedMesh ref={buttons} args={[undefined, undefined, 54]} frustumCulled={false}>
        <boxGeometry args={[0.07, 0.045, 0.07]} />
        <meshLambertMaterial color="#aab0b8" />
      </instancedMesh>

      {/* door pillars */}
      {[-1.15, 1.15].map((z) => (
        <mesh key={z} position={[-20.4, 0.4, z]}>
          <boxGeometry args={[0.12, 2.9, 0.12]} />
          <meshLambertMaterial color={TRIM} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────────────────── zones ───────────────────────────── */

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
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.6, 1.0, 0.8]} />
          <meshLambertMaterial color="#d8dde2" />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <boxGeometry args={[2.64, 0.05, 0.84]} />
          <meshLambertMaterial color="#9aa2aa" />
        </mesh>
        {[-0.9, -0.45, 0, 0.45, 0.9].map((dx, i) => (
          <mesh key={i} position={[dx, 1.06, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.28, 0.28]} />
            <meshLambertMaterial color={i % 2 ? "#2b2b30" : "#3d3436"} />
          </mesh>
        ))}
        <mesh position={[0, 1.45, 0.1]}>
          <boxGeometry args={[2.2, 0.08, 0.08]} />
          <meshLambertMaterial color={TRIM} />
        </mesh>
        <mesh position={[0.45, 1.28, 0.1]}>
          <boxGeometry args={[0.14, 0.28, 0.14]} />
          <meshBasicMaterial color="#7b4fa8" toneMapped={false} />
        </mesh>
        <group position={[0, 1.9, -0.55]} rotation={[-0.1, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 1.08, 0.06]} />
            <meshLambertMaterial color={INK} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <planeGeometry args={[1.58, 0.98]} />
            <meshBasicMaterial map={labTex} toneMapped={false} />
          </mesh>
          <mesh ref={dot}>
            <circleGeometry args={[0.022, 6]} />
            <meshBasicMaterial color="#f2e8ff" toneMapped={false} />
          </mesh>
        </group>
        <mesh position={[-1.6, 1.5, -0.4]}>
          <boxGeometry args={[0.7, 0.05, 0.35]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        {[-1.8, -1.6, -1.4].map((jx) => (
          <mesh key={jx} position={[jx, 1.62, -0.4]}>
            <cylinderGeometry args={[0.05, 0.05, 0.16, 8]} />
            <meshLambertMaterial color="#a98fc4" />
          </mesh>
        ))}
      </group>
      <group position={[4.6, -0.99, 1.95]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.4, 0.9, 0.7]} />
          <meshLambertMaterial color="#d8dde2" />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 0.42, 8]} />
          <meshLambertMaterial color="#6c737b" />
        </mesh>
        <mesh position={[0, 0.93, 0.12]}>
          <boxGeometry args={[0.3, 0.06, 0.3]} />
          <meshLambertMaterial color="#9aa2aa" />
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
          <meshLambertMaterial color={INK} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[3.36, 1.89]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[10.6, -0.62, 1.55]}>
        <cylinderGeometry args={[0.8, 0.55, 0.08, 20]} />
        <meshLambertMaterial color={WOOD} />
      </mesh>
      <mesh position={[10.6, -0.85, 1.55]}>
        <cylinderGeometry args={[0.1, 0.16, 0.4, 10]} />
        <meshLambertMaterial color="#7b8390" />
      </mesh>
      {([[9.7, 1.2], [11.5, 1.2], [9.9, 2.2], [11.3, 2.2]] as const).map(([cx, cz], i) => (
        <Seat key={i} x={cx} z={cz} />
      ))}
    </group>
  );
}

function SystemsPanel({
  x, side, label, items,
}: { x: number; side: number; label: string; items: string[] }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => drawSystemsPanel(ctx, w, h, label.toUpperCase(), items),
    384, 480, [label]
  );
  return (
    <group position={[x, 0.5, side * 2.5]} rotation={[0, side === -1 ? 0 : Math.PI, 0]}>
      <mesh>
        <boxGeometry args={[1.3, 1.6, 0.07]} />
        <meshLambertMaterial color={INK} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.18, 1.47]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.84, 0.02]}>
        <boxGeometry args={[1.3, 0.06, 0.08]} />
        <meshBasicMaterial color="#1b5081" toneMapped={false} />
      </mesh>
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
      {skillGroups.slice(0, 6).map((g, i) => (
        <SystemsPanel
          key={g.id}
          x={14 + Math.floor(i / 2) * 1.65}
          side={i % 2 === 0 ? -1 : 1}
          label={g.label}
          items={g.skills}
        />
      ))}
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
          <meshLambertMaterial color={INK} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.56, 1.6]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <mesh ref={cursor} position={[0.62, -0.47, 0.07]}>
          <planeGeometry args={[0.09, 0.035]} />
          <meshBasicMaterial color="#34c759" transparent toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[19.9, -0.7, 0]}>
        <boxGeometry args={[0.8, 0.08, 2.2]} />
        <meshLambertMaterial color={WOOD} />
      </mesh>
      <Seat x={19.2} z={-1.35} />
    </group>
  );
}

/* ───────────────────────── sky lounge ───────────────────────── */

function LoungeChair({x,z,ry}:{x:number;z:number;ry:number}) {
  return <Suspense fallback={null}><ImportedLoungeChair x={x} z={z} ry={ry}/></Suspense>;
}

function PottedPlant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, -0.99, z]} scale={scale}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.13, 0.1, 0.28, 8]} />
        <meshLambertMaterial color="#c9c0ae" />
      </mesh>
      {([[0, 0.48, 0, 0.2], [-0.09, 0.4, 0.07, 0.13], [0.09, 0.42, -0.06, 0.14]] as const).map(
        ([px, py, pz, r], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <sphereGeometry args={[r, 7, 7]} />
            <meshLambertMaterial color={i === 0 ? "#4f8a5f" : "#5f9c6c"} />
          </mesh>
        )
      )}
    </group>
  );
}

function SkyLounge() {
  const barSign = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#f6f1e6";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e2571f";
      ctx.fillRect(0, 0, w, 5);
      ctx.fillRect(0, h - 5, w, 5);
      ctx.fillStyle = "#14161a";
      ctx.font = "800 34px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SKY LOUNGE", w / 2, h / 2);
    },
    384, 64, []
  );

  return (
    <group>
      {/* lounge corner — port side */}
      <mesh position={[6.3, -0.975, -1.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 22]} />
        <meshLambertMaterial color="#7d8794" />
      </mesh>
      <group position={[6.3, 0, -2.08]}>
        <mesh position={[0, -0.85, 0]}>
          <SoftBox args={[2.1, 0.3, 0.55]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <SoftBox args={[2.2, 0.19, 0.7]} />
          <meshLambertMaterial color={SEAT_BODY} />
        </mesh>
        <mesh position={[0, -0.2, -0.26]} rotation={[-0.16, 0, 0]}>
          <SoftBox args={[2.2, 0.78, 0.19]} />
          <meshLambertMaterial color={SEAT_BODY} />
        </mesh>
        <mesh position={[-0.75, -0.44, -0.1]} rotation={[0.15, 0.3, 0.1]}>
          <SoftBox args={[0.34, 0.3, 0.13]} />
          <meshLambertMaterial color="#8c583d" />
        </mesh>
        <mesh position={[0.78, -0.44, -0.12]} rotation={[0.12, -0.35, -0.08]}>
          <SoftBox args={[0.34, 0.3, 0.13]} />
          <meshLambertMaterial color="#b79d6c" />
        </mesh>
      </group>
      <group position={[6.3, 0, -1.42]}>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.05, 16]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <cylinderGeometry args={[0.07, 0.13, 0.36, 8]} />
          <meshLambertMaterial color="#7b8390" />
        </mesh>
      </group>
      <LoungeChair x={5.4} z={1.85} ry={-0.5} />
      <LoungeChair x={7.2} z={1.85} ry={0.55 + Math.PI} />
      <PottedPlant x={7.35} z={-2.35} />
      <PottedPlant x={5.2} z={2.42} scale={0.85} />

      {/* bar opposite the galley */}
      <group position={[1.1, 0, 2.12]}>
        <mesh position={[0, -0.52, 0]}>
          <boxGeometry args={[1.7, 0.95, 0.5]} />
          <meshLambertMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[1.78, 0.05, 0.58]} />
          <meshLambertMaterial color="#9aa2aa" />
        </mesh>
        <group position={[0, 0.82, 0.5]}>
          <mesh>
            <boxGeometry args={[1.5, 0.05, 0.24]} />
            <meshLambertMaterial color={WOOD} />
          </mesh>
          {([["#a98fc4", -0.5], ["#e0a02a", -0.17], ["#7fb2d9", 0.16], ["#6fbf8a", 0.5]] as const).map(
            ([c, dx]) => (
              <mesh key={dx} position={[dx, 0.15, 0]}>
                <cylinderGeometry args={[0.045, 0.05, 0.26, 8]} />
                <meshLambertMaterial color={c} />
              </mesh>
            )
          )}
        </group>
        <mesh position={[0, 1.35, 0.52]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.15, 0.19]} />
          <meshBasicMaterial map={barSign} toneMapped={false} />
        </mesh>
        {[-0.45, 0.45].map((dx) => (
          <group key={dx} position={[dx, 0, -0.62]}>
            <mesh position={[0, -0.55, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.06, 10]} />
              <meshLambertMaterial color="#2c4763" />
            </mesh>
            <mesh position={[0, -0.78, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
              <meshLambertMaterial color="#7b8390" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function ExitSign({ x }: { x: number }) {
  const tex = useCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = "#0f2417";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#34c759";
      ctx.font = "700 58px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EXIT", w / 2, h / 2 + 2);
    },
    256, 96, []
  );
  return (
    <group position={[x, 2.08, 0]}>
      {[Math.PI / 2, -Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation={[0, ry, 0]} position={[i === 0 ? 0.016 : -0.016, 0, 0]}>
          <planeGeometry args={[0.5, 0.19]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ─────────────────────── movement + camera ─────────────────────── */

function InteriorRig() {
  const { camera, gl, size } = useThree();
  useEffect(()=>{const cam=camera as THREE.PerspectiveCamera;cam.near=.08;cam.far=120;cam.fov=size.width<640?75:68;cam.updateProjectionMatrix();},[camera,size.width]);
  const currentSection = useAppStore((s) => s.currentSection);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const pos = useRef(new THREE.Vector3(getSection(currentSection).x + 1.5, EYE_Y, 0));
  const vel = useRef(new THREE.Vector3());
  const jump = useRef<{ target: number; t: number } | null>(null);
  const jumpHeight = useRef(0);
  const jumpVelocity = useRef(0);
  const jumpQueued = useRef(false);
  const lastSeat = useRef<{ x: number; z: number } | null>(null);
  const lookPointer = useRef<number | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const bob = useRef(0);
  /** scratch vector — reused so walking allocates nothing per frame */
  const desired = useRef(new THREE.Vector3());
  /** where the look is heading; yaw/pitch chase these so turning glides */
  const yawTarget = useRef(0);
  const pitchTarget = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) jumpQueued.current = true;
      }
      if (e.code === "KeyE" && useAppStore.getState().seatAt) {
        useAppStore.getState().setSeatAt(null);
      }
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    const blur = () => { keys.current = {}; vel.current.set(0,0,0); lookPointer.current=null; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      if (lookPointer.current !== null) return;
      lookPointer.current = e.pointerId;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      // capture so the drag survives leaving the canvas or a stray UI element
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== lookPointer.current) return;
      // Phones deliver several coalesced samples per frame; replaying them all
      // makes the turn track the finger exactly instead of stepping.
      const pts =
        typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      const samples = pts.length ? pts : [e];
      const gain = e.pointerType === "touch" ? 0.0072 : 0.004;
      for (const p of samples) {
        const dx = p.clientX - lastPointer.current.x;
        const dy = p.clientY - lastPointer.current.y;
        lastPointer.current.x = p.clientX; lastPointer.current.y = p.clientY;
        yawTarget.current += dx * gain;
        pitchTarget.current = THREE.MathUtils.clamp(
          pitchTarget.current - dy * gain * 0.75,
          -0.7,
          0.7
        );
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== lookPointer.current) return;
      lookPointer.current = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const state = useAppStore.getState();
    const canMove = !state.openPanel && !state.mapOpen && !state.helpOpen && !state.settingsOpen;
    if (state.seatAt !== lastSeat.current) {
      lastSeat.current = state.seatAt;
      if (state.seatAt) {
        pos.current.x = state.seatAt.x;
        pos.current.z = THREE.MathUtils.clamp(state.seatAt.z, -1.9, 1.9);
        vel.current.set(0, 0, 0);
        yawTarget.current = state.seatAt.z > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        pos.current.z = pos.current.z > 0 ? .65 : -.65;
      }
    }

    if ((jumpQueued.current || touchJump.requested) && canMove && !state.seatAt && jumpHeight.current === 0) {
      jumpVelocity.current = 3.4;
    }
    jumpQueued.current = false;
    touchJump.requested = false;
    if (jumpVelocity.current !== 0 || jumpHeight.current > 0) {
      jumpHeight.current = Math.max(0, jumpHeight.current + jumpVelocity.current * Math.min(dt, 0.05));
      jumpVelocity.current -= 10.5 * Math.min(dt, 0.05);
      if (jumpHeight.current === 0) jumpVelocity.current = 0;
    }

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
    } else if (canMove && !state.seatAt) {
      const kf = (keys.current.KeyW || keys.current.ArrowUp ? 1 : 0) - (keys.current.KeyS || keys.current.ArrowDown ? 1 : 0);
      const kr = (keys.current.KeyD || keys.current.ArrowRight ? 1 : 0) - (keys.current.KeyA || keys.current.ArrowLeft ? 1 : 0);
      const f = THREE.MathUtils.clamp(kf + touchMove.forward, -1, 1);
      const r = THREE.MathUtils.clamp(kr + touchMove.right, -1, 1);
      const dirX = -Math.cos(yaw.current);
      const dirZ = -Math.sin(yaw.current);
      // NOTE: allocating a Vector3 here every frame is what made walking stutter
      // on phones — the garbage it produced forced constant minor GCs. Reuse.
      desired.current.set((dirX * f + -dirZ * r) * 3.2, 0, (dirZ * f + dirX * r) * 3.2);
      desired.current.clampLength(0,3.2);
      vel.current.lerp(desired.current, Math.min(1, dt * 7));
      const step=Math.min(dt,.05);
      const nextX=pos.current.x+vel.current.x*step;
      if(!blocksCabinPosition(nextX,pos.current.z))pos.current.x=nextX;
      else vel.current.x=0;
      const nextZ=pos.current.z+vel.current.z*step;
      if(!blocksCabinPosition(pos.current.x,nextZ))pos.current.z=nextZ;
      else vel.current.z=0;
      // subtle walking bob — sells the "you are walking" feeling
      bob.current += vel.current.length() * dt * 2.4;
    }

    // Frame-rate-independent damping toward the look target. A fixed lerp
    // factor turns every dropped frame into a visible step; this keeps the
    // same feel whether the device is running at 120fps or 40.
    const k = 1 - Math.exp(-18 * dt);
    yaw.current += (yawTarget.current - yaw.current) * k;
    pitch.current += (pitchTarget.current - pitch.current) * k;

    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -24.6, 19.2);
    const zLimit = pos.current.x < -20 ? 1.05 : 1.95;
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -zLimit, zLimit);

    camera.position.set(
      pos.current.x,
      (state.seatAt ? 0.15 : EYE_Y) + jumpHeight.current + (state.seatAt ? 0 : Math.sin(bob.current) * 0.014),
      pos.current.z
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(
      pos.current.x - Math.cos(yaw.current) * Math.cos(pitch.current),
      (state.seatAt ? 0.15 : EYE_Y) + jumpHeight.current + Math.sin(pitch.current),
      pos.current.z - Math.sin(yaw.current) * Math.cos(pitch.current)
    );
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __jumpHeight: number }).__jumpHeight = jumpHeight.current;
    }

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

const SEAT_ROWS = [-18.7, -16.1];

export default function CabinScene({ profile }: { profile: PerfProfile }) {
  const setReady = useAppStore((s) => s.setReady);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady());
    return () => cancelAnimationFrame(id);
  }, [setReady]);

  return (
    <>
      <CabinShell />
      <ZoneGate x={-17.4} range={profile.touch?16:50}><SeatBlocks rows={SEAT_ROWS} /><ClubTables /></ZoneGate>
      <ZoneGate x={.7} range={profile.touch?14:50}><Galley /></ZoneGate>
      <OverheadBins />
      <ZoneGate x={6.3} range={profile.touch?14:50}><SkyLounge /></ZoneGate>
      <ExitSign x={-20.32} />
      <ExitSign x={21.65} />
      {profile.motes > 0 && (
        <Sparkles
          count={profile.motes}
          scale={[42, 3, 4]}
          size={1.4}
          speed={0.16}
          opacity={0.22}
          color="#fff0d0"
          position={[-2, 0.8, 0]}
        />
      )}
      {/* Everything below is distance-gated: only the part of the cabin you are
          actually near gets drawn. */}
      {EXHIBIT_LAYOUT.map(({ id, x, side }) => {
        const p = projects.find((pr) => pr.id === id);
        return p ? (
          <ZoneGate key={id} x={x} range={profile.touch?11:17}>
            <Exhibit project={p} x={x} side={side} />
          </ZoneGate>
        ) : null;
      })}
      <ZoneGate x={4} range={profile.touch?12:18}>
        <ResearchLab />
      </ZoneGate>
      <ZoneGate x={10.5} range={profile.touch?12:18}>
        <BriefingRoom />
      </ZoneGate>
      <ZoneGate x={15.5} range={profile.touch?12:18}>
        <SystemsBay />
      </ZoneGate>
      <ZoneGate x={20} range={profile.touch?12:18}>
        <CommsTerminal />
      </ZoneGate>
      <ZoneGate x={-23} range={profile.touch?12:20}>
        <Cockpit />
      </ZoneGate>
      <InteriorRig />
    </>
  );
}


