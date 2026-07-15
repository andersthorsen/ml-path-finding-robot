import type { Vector2 } from "./Vector2.ts";

/**
 * A robot pose on the paper.
 *
 * Coordinates are in millimetres. `heading` is in radians, measured clockwise
 * from the +x axis (because the canvas y-axis grows downward). Heading 0 points
 * to the right; +PI/2 points down the page.
 */
export interface Pose {
  readonly x: number;
  readonly y: number;
  readonly heading: number;
}

export function pose(x: number, y: number, heading: number): Pose {
  return { x, y, heading };
}

/** The point at a given distance straight ahead of the pose. */
export function pointAhead(p: Pose, distanceMm: number): Vector2 {
  return offsetPoint(p, distanceMm, 0);
}

/**
 * A point offset from the pose by `forwardMm` along the heading and
 * `lateralMm` to the robot's right (positive) or left (negative). With the
 * canvas y-axis pointing down, "right" is the heading rotated 90° clockwise.
 */
export function offsetPoint(p: Pose, forwardMm: number, lateralMm: number): Vector2 {
  const cos = Math.cos(p.heading);
  const sin = Math.sin(p.heading);
  return {
    x: p.x + cos * forwardMm - sin * lateralMm,
    y: p.y + sin * forwardMm + cos * lateralMm,
  };
}
