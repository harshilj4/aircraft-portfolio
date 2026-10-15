"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useIsTouch } from "@/hooks/useIsMobile";
import { touchMove, touchJump, resetTouchMove } from "@/lib/touchControls";

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
  const seatAt = useAppStore((s) => s.seatAt);
  const mapOpen=useAppStore(s=>s.mapOpen),helpOpen=useAppStore(s=>s.helpOpen),settingsOpen=useAppStore(s=>s.settingsOpen);
  const blocked=!!openPanel||mapOpen||helpOpen||settingsOpen||!!seatAt;
  const isTouch = useIsTouch();
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);

  // let go of the stick whenever the cabin is left or a panel takes over
  useEffect(() => {
    if (mode !== "interior" || blocked) release();
  }, [mode, blocked]);
  useEffect(() => () => resetTouchMove(), []);
  useEffect(()=>{const reset=()=>release();window.addEventListener("blur",reset);document.addEventListener("visibilitychange",reset);return()=>{window.removeEventListener("blur",reset);document.removeEventListener("visibilitychange",reset);};},[]);

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
  if (blocked) return null;

  return (
    <>
    <div
      ref={baseRef}
      className="fixed left-4 z-30 flex h-28 w-28 touch-none select-none items-center justify-center rounded-full border-[1.5px] border-ink-900 bg-paper-100/75"
      style={{ bottom: "max(4.75rem, calc(env(safe-area-inset-bottom) + 4.25rem))" }}
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
      onLostPointerCapture={release}
    >
      {/* travel ring */}
      <div aria-hidden className="absolute inset-3 rounded-full border border-dashed border-ink-400/50" />
      {/* knob */}
      <div
        ref={knobRef}
        aria-hidden
        className="h-12 w-12 rounded-full border-[1.5px] border-ink-900 bg-signal shadow-[2px_2px_0_rgba(20,22,26,0.9)]"
      />
    </div>
    {!openPanel && (
      <button
        type="button"
        className="btn btn--signal fixed right-4 z-30 h-14 w-14 touch-none select-none rounded-full p-0 text-[0.58rem]"
        style={{ bottom: "max(5.3rem, calc(env(safe-area-inset-bottom) + 4.8rem))" }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          touchJump.requested = true;
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Keyboard and assistive activation have no preceding pointer event.
          if (e.detail === 0) touchJump.requested = true;
        }}
        aria-label="Jump"
      >
        JUMP
      </button>
    )}
    </>
  );
}
