"use client";

/**
 * Airliner flight-deck display renderers (canvas). Stylized PFD / ND / EICAS
 * plus the cabin console screens. Decorative flight data only — clearly a
 * visual environment, not real instrument readings.
 */

import { screenBase, wrapText } from "./canvasTexture";

const MONO = "Consolas, monospace";

/** Primary Flight Display — attitude ball, speed & altitude tapes. */
export function drawPFD(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2 - 6;

  // attitude sphere
  const aw = w * 0.42, ah = h * 0.68, ax = cx - aw / 2, ay = cy - ah / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();
  ctx.fillStyle = "#2a5d9c"; // sky
  ctx.fillRect(ax, ay, aw, ah * 0.52);
  ctx.fillStyle = "#7a5426"; // ground
  ctx.fillRect(ax, ay + ah * 0.52, aw, ah * 0.48);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay + ah * 0.52);
  ctx.lineTo(ax + aw, ay + ah * 0.52);
  ctx.stroke();
  // pitch ladder
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  for (const p of [-20, -10, 10, 20]) {
    const py = ay + ah * 0.52 - p * 1.7;
    ctx.beginPath();
    ctx.moveTo(cx - 26, py);
    ctx.lineTo(cx + 26, py);
    ctx.stroke();
    ctx.fillText(String(Math.abs(p)), cx - 38, py + 3);
    ctx.fillText(String(Math.abs(p)), cx + 38, py + 3);
  }
  ctx.restore();
  // aircraft symbol
  ctx.strokeStyle = "#ffe066";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 42, cy); ctx.lineTo(cx - 14, cy); ctx.lineTo(cx - 14, cy + 8);
  ctx.moveTo(cx + 42, cy); ctx.lineTo(cx + 14, cy); ctx.lineTo(cx + 14, cy + 8);
  ctx.stroke();
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(cx - 3, cy - 3, 6, 6);

  // speed tape (left)
  tape(ctx, 14, ay, 52, ah, 251, 10, "left");
  // altitude tape (right)
  tape(ctx, w - 66, ay, 52, ah, 36000, 500, "right");
  // heading strip
  ctx.fillStyle = "#0b0f18";
  ctx.fillRect(ax, h - 26, aw, 20);
  ctx.strokeStyle = "#39414e";
  ctx.strokeRect(ax, h - 26, aw, 20);
  ctx.fillStyle = "#8de08f";
  ctx.font = `600 12px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("HDG 274°", cx, h - 12);
  ctx.fillStyle = "#c9d6e6";
  ctx.font = `10px ${MONO}`;
  ctx.fillText("FL360 · M .84", cx, ay - 8);
  ctx.textAlign = "left";
}

function tape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, tw: number, th: number,
  value: number, step: number, side: "left" | "right"
) {
  ctx.fillStyle = "#0b0f18";
  ctx.fillRect(x, y, tw, th);
  ctx.strokeStyle = "#39414e";
  ctx.strokeRect(x, y, tw, th);
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = "#c9d6e6";
  ctx.textAlign = "center";
  const mid = y + th / 2;
  for (let i = -3; i <= 3; i++) {
    const vy = mid + i * (th / 7);
    ctx.fillText(String(value - i * step), x + tw / 2, vy + 3);
    ctx.fillRect(side === "left" ? x + tw - 8 : x, vy, 8, 1);
  }
  // current-value box
  ctx.fillStyle = "#05070c";
  ctx.fillRect(x - 2, mid - 11, tw + 4, 22);
  ctx.strokeStyle = "#ffe066";
  ctx.strokeRect(x - 2, mid - 11, tw + 4, 22);
  ctx.fillStyle = "#ffe066";
  ctx.font = `700 13px ${MONO}`;
  ctx.fillText(String(value), x + tw / 2, mid + 4);
  ctx.textAlign = "left";
}

/** Navigation Display — compass rose and magenta route. */
export function drawND(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.86, r = h * 0.66;
  ctx.strokeStyle = "#39414e";
  ctx.fillStyle = "#c9d6e6";
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "center";
  for (let a = -60; a <= 60; a += 10) {
    const rad = (a - 90) * (Math.PI / 180);
    const x1 = cx + Math.cos(rad) * r, y1 = cy + Math.sin(rad) * r;
    const x2 = cx + Math.cos(rad) * (r - (a % 30 === 0 ? 12 : 6));
    const y2 = cy + Math.sin(rad) * (r - (a % 30 === 0 ? 12 : 6));
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (a % 30 === 0) {
      const hx = cx + Math.cos(rad) * (r - 24), hy = cy + Math.sin(rad) * (r - 24);
      ctx.fillText(String(((274 + a + 360) % 360) / 10 | 0), hx, hy + 3);
    }
  }
  // route
  ctx.strokeStyle = "#ff5fd7";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 14, cy - r * 0.45);
  ctx.lineTo(cx - 20, cy - r * 0.8);
  ctx.stroke();
  for (const [wx, wy, nm] of [[cx + 14, cy - r * 0.45, "LIG"], [cx - 20, cy - r * 0.8, "AERO"]] as const) {
    ctx.fillStyle = "#ff5fd7";
    ctx.fillRect(wx - 3, wy - 3, 6, 6);
    ctx.fillStyle = "#c9d6e6";
    ctx.fillText(String(nm), wx + 22, wy);
  }
  // ownship
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx - 7, cy + 6); ctx.lineTo(cx + 7, cy + 6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#8de08f";
  ctx.textAlign = "left";
  ctx.font = `600 11px ${MONO}`;
  ctx.fillText("GS 488  TAS 512", 10, 16);
  ctx.fillStyle = "#c084fc";
  ctx.fillText("DEST: AEROSPACE", 10, 30);
}

/** EICAS — twin engine gauges. */
export function drawEICAS(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  const gauge = (gx: number, label: string, val: number) => {
    const gy = h * 0.36, gr = h * 0.24;
    ctx.strokeStyle = "#c9d6e6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 2.05);
    ctx.stroke();
    const ang = Math.PI * 0.75 + (val / 110) * Math.PI * 1.3;
    ctx.strokeStyle = "#8de08f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(ang) * gr * 0.9, gy + Math.sin(ang) * gr * 0.9);
    ctx.stroke();
    ctx.fillStyle = "#0b0f18";
    ctx.fillRect(gx - 30, gy + gr * 0.5, 60, 20);
    ctx.strokeStyle = "#39414e";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 30, gy + gr * 0.5, 60, 20);
    ctx.fillStyle = "#8de08f";
    ctx.font = `700 14px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(val.toFixed(1), gx, gy + gr * 0.5 + 15);
    ctx.fillStyle = "#c9d6e6";
    ctx.font = `11px ${MONO}`;
    ctx.fillText(label, gx, gy - gr - 8);
  };
  gauge(w * 0.3, "N1  ENG 1", 92.4);
  gauge(w * 0.7, "N1  ENG 2", 92.6);
  ctx.fillStyle = "#c9d6e6";
  ctx.font = `11px ${MONO}`;
  ctx.textAlign = "left";
  const lines = ["EGT   612 / 615", "FF    5.9 / 6.0 KLB/H", "OIL P  74 / 76", "VIB   0.6 / 0.5"];
  lines.forEach((l, i) => ctx.fillText(l, w * 0.2, h * 0.66 + i * 16));
  ctx.fillStyle = "#8de08f";
  ctx.fillText("STATUS: ALL SYSTEMS NORMAL", w * 0.2, h * 0.66 + 4 * 16 + 6);
}

/** Centre MFD — pilot identification block. */
export function drawMFD(ctx: CanvasRenderingContext2D, w: number, h: number) {
  screenBase(ctx, w, h, "#9d8cff");
  ctx.textBaseline = "top";
  ctx.fillStyle = "#9d8cff";
  ctx.font = `600 15px ${MONO}`;
  ctx.fillText("FLIGHT CREW IDENTIFICATION", 24, 20);
  ctx.fillStyle = "#f1f4f9";
  ctx.font = "700 30px 'Segoe UI', sans-serif";
  ctx.fillText("HARSHIL JADAWALA", 24, 46);
  ctx.fillStyle = "#c3c9d6";
  ctx.font = `15px ${MONO}`;
  const rows = [
    "PROGRAM ....... MECHANICAL ENGINEERING",
    "INSTITUTION ... YORK UNIVERSITY — LASSONDE",
    "DESTINATION ... AEROSPACE ENGINEERING",
    "MISSION ....... DESIGN · BUILD · TEST · IMPROVE",
  ];
  rows.forEach((r, i) => ctx.fillText(r, 24, 92 + i * 24));
  ctx.fillStyle = "#9d8cff";
  ctx.font = `600 14px ${MONO}`;
  ctx.fillText("▸ CLICK CONSOLE FOR FULL PROFILE", 24, h - 34);
}

/** Briefing-room wall display. */
export function drawBriefing(ctx: CanvasRenderingContext2D, w: number, h: number) {
  screenBase(ctx, w, h, "#ffb454");
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffb454";
  ctx.font = `600 17px ${MONO}`;
  ctx.fillText("ENGINEERING BRIEFING ROOM", w / 2, 34);
  ctx.fillStyle = "#f1f4f9";
  ctx.font = "700 40px 'Segoe UI', sans-serif";
  ctx.fillText("Experience · Education", w / 2, 70);
  ctx.fillText("· Resume ·", w / 2, 118);
  ctx.fillStyle = "#9aa4b8";
  ctx.font = `17px ${MONO}`;
  ctx.fillText("RESEARCH ASSISTANT — LIG SENSORS · YORK U", w / 2, 176);
  ctx.fillText("B.ENG MECHANICAL ENGINEERING — LASSONDE", w / 2, 202);
  ctx.fillText("WORK · VOLUNTEERING · COMMUNITY ROLES", w / 2, 228);
  ctx.fillStyle = "#ffb454";
  ctx.font = `600 16px ${MONO}`;
  ctx.fillText("▸ CLICK TO OPEN BRIEFING", w / 2, h - 40);
  ctx.textAlign = "left";
}

/** Systems-bay skill panel. */
export function drawSystemsPanel(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  label: string, items: string[]
) {
  screenBase(ctx, w, h, "#38bdf8");
  ctx.textBaseline = "top";
  ctx.fillStyle = "#38bdf8";
  ctx.font = `700 19px ${MONO}`;
  const afterLabel = wrapText(ctx, label, 22, 24, w - 44, 24, 2);
  ctx.fillRect(22, afterLabel + 4, w - 44, 2);
  ctx.fillStyle = "#c3c9d6";
  ctx.font = "17px 'Segoe UI', sans-serif";
  let y = afterLabel + 18;
  for (const item of items.slice(0, 6)) {
    ctx.fillText(`▸ ${item}`, 22, y);
    y += 26;
  }
  ctx.fillStyle = "#7f8ba0";
  ctx.font = `600 14px ${MONO}`;
  ctx.fillText("SYSTEMS BAY ▸ CLICK TO OPEN", 22, h - 32);
}

/** Comms terminal screen. */
export function drawComms(ctx: CanvasRenderingContext2D, w: number, h: number) {
  screenBase(ctx, w, h, "#58e07f");
  ctx.textBaseline = "top";
  ctx.fillStyle = "#58e07f";
  ctx.font = `600 16px ${MONO}`;
  ctx.fillText("COMMUNICATIONS TERMINAL — UPLINK READY", 26, 24);
  ctx.fillStyle = "#c9e6d2";
  ctx.font = `19px ${MONO}`;
  const rows = [
    "> CHANNEL 01 ... EMAIL",
    "> CHANNEL 02 ... LINKEDIN /in/harshil-jadawala",
    "> CHANNEL 03 ... GITHUB  /harshilj4",
    "",
    "> OPEN CHANNEL ▸ CLICK CONSOLE_",
  ];
  rows.forEach((r, i) => ctx.fillText(r, 26, 66 + i * 32));
}

/** Research-lab display (raster dot animates over this as a mesh). */
export function drawLabScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  screenBase(ctx, w, h, "#c084fc");
  ctx.textBaseline = "top";
  ctx.fillStyle = "#c084fc";
  ctx.font = `600 16px ${MONO}`;
  ctx.fillText("LIG FABRICATION — RASTER PREVIEW", 24, 22);
  // graph grid
  ctx.strokeStyle = "rgba(192,132,252,0.25)";
  for (let gx = 24; gx < w - 24; gx += 24) {
    ctx.beginPath(); ctx.moveTo(gx, 52); ctx.lineTo(gx, h - 72); ctx.stroke();
  }
  for (let gy = 52; gy < h - 72; gy += 24) {
    ctx.beginPath(); ctx.moveTo(24, gy); ctx.lineTo(w - 24, gy); ctx.stroke();
  }
  ctx.fillStyle = "#e6d5ff";
  ctx.font = "15px 'Segoe UI', sans-serif";
  wrapText(ctx, "Laser-induced graphene humidity sensor research — fabrication methods, laser parameters and sensor performance.", 24, h - 64, w - 48, 20, 2);
  ctx.fillStyle = "#c084fc";
  ctx.font = `600 14px ${MONO}`;
  ctx.fillText("▸ CLICK TO OPEN RESEARCH", 24, h - 24);
}
