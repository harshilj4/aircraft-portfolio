/**
 * Shared analog movement input written by the on-screen joystick and read by
 * the interior camera rig every frame. A plain mutable object (not React
 * state) so dragging the stick never triggers re-renders.
 */
export const touchMove = {
  /** -1..1 — push up on the stick to walk toward the nose */
  forward: 0,
  /** -1..1 — push right on the stick to strafe right */
  right: 0,
};

export function resetTouchMove() {
  touchMove.forward = 0;
  touchMove.right = 0;
}

// dev/testing hook, mirroring the __app store handle
if (typeof window !== "undefined") {
  (window as unknown as { __touchMove: typeof touchMove }).__touchMove = touchMove;
}
