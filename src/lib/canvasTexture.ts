"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Canvas-texture helpers — all in-scene screen content (exhibit displays,
 * cockpit instruments, zone signs, consoles) is DRAWN onto textures instead of
 * floated as DOM overlays. Text is genuinely "on the glass": it never bleeds
 * over UI panels and scales perfectly with the geometry.
 */

export function useCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 320,
  deps: unknown[] = []
): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
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
  ctx.fillStyle = "#070a12";
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
  ctx.fillStyle = "#0b0918";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = opts.accent;
  ctx.fillRect(0, 0, w, 6);
  ctx.fillRect(0, h - 6, w, 6);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#eef1f7";
  ctx.font = "700 44px 'Segoe UI', sans-serif";
  ctx.fillText(opts.zone.toUpperCase(), w / 2, h / 2 - 16);
  ctx.fillStyle = opts.accent;
  ctx.font = "500 20px Consolas, monospace";
  ctx.fillText(opts.tagline.toUpperCase(), w / 2, h / 2 + 30);
  ctx.textAlign = "left";
}
