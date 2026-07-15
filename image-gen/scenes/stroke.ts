import type { Vector2 } from "../../src/geometry/Vector2.ts";

/** Default printed line width (mm). The robot's sensors straddle this. */
export const DEFAULT_LINE_WIDTH_MM = 24;

export interface StrokeOptions {
  readonly color?: string;
  readonly widthMm?: number;
  readonly close?: boolean;
}

/** Stroke a connected poly-line through the given millimetre-space points. */
export function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: readonly Vector2[],
  options: StrokeOptions = {},
): void {
  if (points.length < 2) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = options.color ?? "rgb(20, 20, 20)";
  ctx.lineWidth = options.widthMm ?? DEFAULT_LINE_WIDTH_MM;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const first = points[0]!;
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i += 1) {
    const p = points[i]!;
    ctx.lineTo(p.x, p.y);
  }
  if (options.close) {
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

/** Sample a parametric curve `f(t)` over `[from, to]` into a poly-line. */
export function sampleCurve(from: number, to: number, steps: number, f: (t: number) => Vector2): Vector2[] {
  const points: Vector2[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = from + ((to - from) * i) / steps;
    points.push(f(t));
  }
  return points;
}
