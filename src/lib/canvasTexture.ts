"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Canvas-texture helpers — all in-scene screen content (exhibit displays,
 * cockpit instruments, zone signs, consoles) is DRAWN onto textures instead of
 * floated as DOM overlays. Text is genuinely "on the glass": it never bleeds
 * over UI panels and scales perfectly with the geometry.
 */

/**
 * Touch devices render these screens small and pay real costs for them:
 * anisotropic filtering is expensive on tile GPUs, and full-size canvases eat
 * texture bandwidth. Halving the canvas quarters the memory per screen, which
 * matters when the cabin carries ~50 of them.
 */
const COARSE =
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const TEX_SCALE = COARSE ? 0.6 : 1;

export function useCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 320,
  deps: unknown[] = []
): THREE.CanvasTexture {
  return useMemo(() => {
    // draw at the authored size, then let the GPU scale — the draw code can
    // keep using plain pixel coordinates
    const cw = Math.max(64, Math.round(w * TEX_SCALE));
    const ch = Math.max(64, Math.round(h * TEX_SCALE));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(TEX_SCALE, TEX_SCALE);
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = COARSE ? 1 : 4;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Word-wraps text; returns the y after the last drawn line. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 99
): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lines + 1 >= maxLines) {
        ctx.fillText(line + "…", x, y);
        return y + lineHeight;
      }
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines++;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

/** Standard dark display background with a subtle scanline + edge glow. */
export function screenBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string
) {
  ctx.fillStyle = "#0e1620";
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,0.05)");
  grad.addColorStop(0.5, "rgba(255,255,255,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // faint scanlines
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  // accent frame
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.globalAlpha = 1;
}

/** Exhibit display: status, title, summary, prompt — all embedded. */
export function drawExhibitScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { title: string; status: string; category: string; summary: string; accent: string }
) {
  screenBase(ctx, w, h, opts.accent);
  ctx.textBaseline = "top";
  ctx.fillStyle = opts.accent;
  ctx.font = "600 17px Consolas, monospace";
  ctx.fillText(`${opts.status.toUpperCase()} · ${opts.category.toUpperCase()}`, 28, 26);
  ctx.fillStyle = "#f1f4f9";
  ctx.font = "700 34px 'Segoe UI', sans-serif";
  const yAfterTitle = wrapText(ctx, opts.title, 28, 58, w - 56, 40, 2);
  ctx.fillStyle = "#9aa4b8";
  ctx.font = "400 19px 'Segoe UI', sans-serif";
  wrapText(ctx, opts.summary, 28, yAfterTitle + 12, w - 56, 26, 4);
  ctx.fillStyle = opts.accent;
  ctx.font = "600 17px Consolas, monospace";
  ctx.fillText("▸ CLICK TO OPEN EXHIBIT", 28, h - 42);
}

/** Overhead zone sign hanging in the cabin. */
export function drawZoneSign(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { zone: string; tagline: string; accent: string }
) {
  // Backlit cabin placard: warm paper face, ink type, accent rules — matches
  // the printed-manual language the rest of the UI uses.
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = opts.accent;
  ctx.fillRect(0, 0, w, 7);
  ctx.fillRect(0, h - 7, w, 7);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#14161a";
  const zone = opts.zone.toUpperCase();
  let titleSize = 44;
  ctx.font = `800 ${titleSize}px 'Segoe UI', sans-serif`;
  while (ctx.measureText(zone).width > w - 56 && titleSize > 20) {
    ctx.font = `800 ${--titleSize}px 'Segoe UI', sans-serif`;
  }
  ctx.fillText(zone, w / 2, h / 2 - 15);
  ctx.fillStyle = "#4c535d";
  ctx.font = "600 19px Consolas, monospace";
  ctx.fillText(opts.tagline.toUpperCase(), w / 2, h / 2 + 30, w - 56);
  ctx.textAlign = "left";
}

