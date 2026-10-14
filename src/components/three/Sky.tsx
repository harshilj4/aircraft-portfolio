"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { PerfProfile } from "@/lib/device";

/**
 * DAYBREAK SKY — dawn at cruise altitude.
 *
 * Built for fill-rate, not for triangle count. The old storm sky stacked 100+
 * screen-filling transparent sprites; every pixel was shaded a dozen times
 * over and phones died on the overdraw. Here the whole sky is:
 *   · one unlit gradient dome        (1 draw call, zero lighting maths)
 *   · 2-4 horizontal cloud-sea decks (a few large quads, sorted, no depth write)
 *   · a small parallax bank of puffs (tier-scaled, 4-16)
 *   · a sun disc + halo              (2 quads)
 * Everything is MeshBasicMaterial: unlit, so it costs a texture fetch and
 * nothing else.
 */

/* ── procedural textures ─────────────────────────────────────────────────── */

/** Vertical dawn gradient with a warm band at the horizon. */
function useSkyTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0.0, "#0d2f63"); // zenith — deep dawn blue
    g.addColorStop(0.22, "#1c5896");
    g.addColorStop(0.44, "#4e93c4");
    g.addColorStop(0.62, "#8fc0dc");
    g.addColorStop(0.76, "#d6dfe0");
    g.addColorStop(0.86, "#f6d9ad"); // warm haze band
    g.addColorStop(0.94, "#f7bc7e");
    g.addColorStop(1.0, "#e89a63"); // horizon glow
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);
}

/** Soft billowed cloud sheet — layered blobs, alpha-faded at the edges. */
function useCloudSheet(seed: number) {
  return useMemo(() => {
    const S = 384;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, S, S);

    // deterministic PRNG so the decks differ but stay stable across reloads
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);

    /**
     * Draws each puff nine times — once per neighbouring tile offset — so any
     * blob crossing an edge reappears on the opposite side. That makes the
     * sheet genuinely seamless when it is repeated across a deck.
     */
    const blob = (x: number, y: number, r: number, a: number, warm: number) => {
      const tint = `${255},${Math.round(250 - warm * 18)},${Math.round(244 - warm * 34)}`;
      for (const ox of [-S, 0, S]) {
        for (const oy of [-S, 0, S]) {
          const px = x + ox;
          const py = y + oy;
          if (px < -r || px > S + r || py < -r || py > S + r) continue;
          const g = ctx.createRadialGradient(px, py, 0, px, py, r);
          g.addColorStop(0, `rgba(${tint},${a})`);
          g.addColorStop(0.45, `rgba(${tint},${a * 0.55})`);
          g.addColorStop(1, `rgba(${tint},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // broad base mass, then smaller detail puffs on top
    for (let i = 0; i < 22; i++) {
      blob(rnd() * S, rnd() * S, 55 + rnd() * 110, 0.3 + rnd() * 0.28, rnd());
    }
    for (let i = 0; i < 40; i++) {
      blob(rnd() * S, rnd() * S, 20 + rnd() * 48, 0.14 + rnd() * 0.24, rnd());
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [seed]);
}

/** Single soft puff used for the parallax banks. */
function usePuffTexture() {
  return useMemo(() => {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d")!;
    const blob = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,252,247,${a})`);
      g.addColorStop(0.5, `rgba(252,244,236,${a * 0.5})`);
      g.addColorStop(1, "rgba(250,240,232,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    blob(128, 140, 96, 0.95);
    blob(80, 156, 62, 0.7);
    blob(178, 152, 68, 0.72);
    blob(120, 108, 54, 0.62);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/* ── components ──────────────────────────────────────────────────────────── */

function CloudSea({ layers }: { layers: number }) {
  const sheets = [useCloudSheet(1), useCloudSheet(2)];
  const group = useRef<THREE.Group>(null!);

  /**
   * The cloud floor sits FAR below (y ≈ -190 and down). Placed close it fills
   * the lower half of the frame as a flat slab; placed far it compresses
   * toward the horizon and reads as an endless deck seen from cruise — which
   * is both truthful and much prettier. Each deck is still a single quad.
   */
  const decks = useMemo(
    () =>
      Array.from({ length: layers }, (_, i) => ({
        y: -190 - i * 70,
        size: 2600 + i * 700,
        repeat: 4 + i,
        opacity: 0.88 - i * 0.17,
        speed: 9 - i * 1.8,
        tint: i === 0 ? "#fffaf2" : i === 1 ? "#f6ebe0" : "#e9e2e4",
      })),
    [layers]
  );

  // per-deck texture clones so each can carry its own repeat
  const maps = useMemo(
    () =>
      decks.map((d, i) => {
        const t = sheets[i % sheets.length].clone();
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(d.repeat, d.repeat);
        t.needsUpdate = true;
        return t;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decks]
  );

  useFrame((_, dt) => {
    for (let i = 0; i < maps.length; i++) {
      maps[i].offset.x += decks[i].speed * dt * 0.0006;
    }
  });

  return (
    <group ref={group}>
      {decks.map((d, i) => (
        <mesh key={i} position={[0, d.y, 0]} rotation={[-Math.PI / 2, 0, i * 0.7]}>
          <planeGeometry args={[d.size, d.size]} />
          <meshBasicMaterial
            map={maps[i]}
            color={d.tint}
            transparent
            opacity={d.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function CloudBanks({ count }: { count: number }) {
  const tex = usePuffTexture();
  const group = useRef<THREE.Group>(null!);

  const puffs = useMemo(() => {
    let s = 7717;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: count }, () => {
      const near = rnd() > 0.45;
      return {
        pos: [
          (rnd() - 0.5) * 620,
          near ? -18 - rnd() * 34 : 26 + rnd() * 60,
          near ? -60 - rnd() * 190 : -220 - rnd() * 320,
        ] as [number, number, number],
        scale: near ? 70 + rnd() * 110 : 150 + rnd() * 240,
        opacity: near ? 0.5 + rnd() * 0.32 : 0.24 + rnd() * 0.24,
        speed: near ? 15 + rnd() * 16 : 5 + rnd() * 7,
        tint: rnd() > 0.6 ? "#fff3e2" : "#ffffff",
      };
    });
  }, [count]);

  useFrame((_, dt) => {
    for (let i = 0; i < group.current.children.length; i++) {
      const sp = group.current.children[i];
      sp.position.x += puffs[i].speed * dt;
      if (sp.position.x > 340) sp.position.x = -340;
    }
  });

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={p.pos} scale={[p.scale, p.scale * 0.52, 1]}>
          <spriteMaterial
            map={tex}
            color={p.tint}
            transparent
            opacity={p.opacity}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  );
}

function Sun() {
  /** [wide halo, tight disc] — both need a texture or a sprite renders square. */
  const [halo, disc] = useMemo(() => {
    const make = (stops: [number, string][]) => {
      const S = 256;
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    return [
      make([
        [0, "rgba(255,246,214,0.85)"],
        [0.14, "rgba(255,226,160,0.45)"],
        [0.4, "rgba(255,190,120,0.16)"],
        [1, "rgba(255,170,110,0)"],
      ]),
      make([
        [0, "rgba(255,253,245,1)"],
        [0.55, "rgba(255,248,225,0.95)"],
        [0.8, "rgba(255,238,196,0.35)"],
        [1, "rgba(255,230,180,0)"],
      ]),
    ];
  }, []);

  return (
    <group position={[-340, 46, -620]}>
      <sprite scale={[480, 480, 1]}>
        <spriteMaterial map={halo} transparent depthWrite={false} fog={false} />
      </sprite>
      <sprite scale={[52, 52, 1]}>
        <spriteMaterial map={disc} transparent depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

/* ── public ──────────────────────────────────────────────────────────────── */

export function SkyDome() {
  const tex = useSkyTexture();
  return (
    // renderOrder -1 + depthWrite off = painted first, everything draws over
    // it. BackSide (rather than a negative scale) is the reliable way to view
    // a sphere from within.
    <mesh renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1200, 24, 16]} />
      <meshBasicMaterial
        map={tex}
        side={THREE.BackSide}
        fog={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Daybreak({ profile }: { profile: PerfProfile }) {
  return (
    <>
      <SkyDome />
      <Sun />
      <CloudSea layers={profile.seaLayers} />
      <CloudBanks count={profile.cloudBanks} />
    </>
  );
}

/**
 * Dawn lighting rig — two lights, total. A warm key from the sun's direction
 * and a cool sky/ground hemisphere for bounce. Point lights are deliberately
 * absent: each one adds per-fragment cost across every lit surface on screen.
 */
export function DaybreakLights({ profile }: { profile: PerfProfile }) {
  return (
    <>
      <hemisphereLight args={["#cfe6f7", "#e8d3b4", 1.5]} />
      <directionalLight position={[-120, 60, -140]} intensity={2.5} color="#fff0d4" />
      {profile.tier === "high" && <directionalLight position={[90, 30, 120]} intensity={0.5} color="#a8c8e8" />}
    </>
  );
}
