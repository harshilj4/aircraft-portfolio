"use client";

/**
 * Procedural ambient audio — no audio files, no licensing issues.
 * A filtered noise source approximates cabin/engine ambience.
 * Starts only after an explicit user toggle (autoplay-safe) and is quiet.
 */

let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let started = false;

export function startAmbience(interior: boolean) {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Brown noise — deep, engine-like rumble
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;

      gainNode = ctx.createGain();
      gainNode.gain.value = 0;

      src.connect(filter).connect(gainNode).connect(ctx.destination);
      src.start();
      started = true;
    }
    if (ctx.state === "suspended") void ctx.resume();
    if (gainNode && ctx) {
      const target = interior ? 0.05 : 0.09;
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.2);
    }
  } catch {
    // Audio is a nice-to-have; never let it break the experience.
  }
}

export function stopAmbience() {
  if (!started || !ctx || !gainNode) return;
  gainNode.gain.cancelScheduledValues(ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
}

/** Short soft click for UI interactions (only when sound is on). */
export function uiClick(soundOn: boolean) {
  if (!soundOn || !ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = 640;
    g.gain.setValueAtTime(0.03, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    /* ignore */
  }
}
