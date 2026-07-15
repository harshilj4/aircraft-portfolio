"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";
import { touchMove, resetTouchMove } from "@/lib/touchControls";

/** Max knob travel from the stick centre, in px. */
const TRAVEL = 38;

/**
 * On-screen analog joystick for touch devices — walk the cabin with the left
 * thumb while the rest of the screen stays free for drag-look and tapping
 * exhibits. Writes straight into the shared `touchMove` vector; the interior
 * rig consumes it exactly like WASD input.
 */
export default function TouchControls() {
  const mode = useAppStore((s) => s.mode);
  const openPanel = useAppStore((s) => s.openPanel);
  const isTouch = useIsTouch();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);

  // let go of the stick whenever the cabin is left or a panel takes over
  useEffect(() => {
    if (mode !== "interior" || openPanel) release();
  }, [mode, openPanel]);
  useEffect(() => () => resetTouchMove(), []);

  function release() {
    pointerId.current = null;
    resetTouchMove();
    if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
  }

  function applyPointer(e: React.PointerEvent) {
    const base = baseRef.current!;
    const rect = base.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > TRAVEL) {
      dx = (dx / len) * TRAVEL;
      dy = (dy / len) * TRAVEL;
    }
    touchMove.right = dx / TRAVEL;
    touchMove.forward = -dy / TRAVEL; // screen-up = walk forward
    knobRef.current!.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  if (!isTouch || mode !== "interior") return null;

  return (
    <div
      ref={baseRef}
      className="fixed bottom-6 left-5 z-30 flex h-28 w-28 touch-none select-none items-center justify-center rounded-full border border-alu-500/25 bg-graphite-950/45 backdrop-blur-sm"
      style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      role="application"
      aria-label="Movement joystick — drag to walk through the cabin"
      onPointerDown={(e) => {
        if (pointerId.current !== null) return;
        pointerId.current = e.pointerId;
        baseRef.current!.setPointerCapture(e.pointerId);
        applyPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.pointerId !== pointerId.current) return;
        applyPointer(e);
      }}
      onPointerUp={(e) => {
        if (e.pointerId === pointerId.current) release();
      }}
      onPointerCancel={(e) => {
        if (e.pointerId === pointerId.current) release();
      }}
    >
      {/* travel ring */}
      <div aria-hidden className="absolute inset-3 rounded-full border border-sky-accent/20" />
      {/* knob */}
      <div
        ref={knobRef}
        aria-hidden
        className="h-12 w-12 rounded-full border border-sky-accent/50 bg-sky-accent/25 shadow-[0_0_18px_rgba(157,140,255,0.35)]"
      />
    </div>
  );
}
