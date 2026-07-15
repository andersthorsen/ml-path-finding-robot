import type { Vector2 } from "../geometry/Vector2.ts";
import type { PaperSize } from "./PaperSpec.ts";

/**
 * Geometry of each path, expressed purely as millimetre coordinates derived
 * from the paper size. This module has no canvas or DOM dependency, so it is
 * the single source of truth shared by the (Node) image generator — which
 * strokes these shapes into PNGs — and the browser runtime, which uses it to
 * place the robot at each path's start.
 */

export interface CircleGeometry {
  readonly center: Vector2;
  readonly radius: number;
}

export interface SegmentGeometry {
  readonly from: Vector2;
  readonly to: Vector2;
}

export interface WaveGeometry {
  readonly centerX: number;
  readonly topY: number;
  readonly bottomY: number;
  readonly amplitude: number;
  readonly wavelength: number;
}

export interface TreeGeometry {
  readonly trunkStart: Vector2;
  readonly fork: Vector2;
  readonly redEnd: Vector2;
  readonly greenEnd: Vector2;
}

export const circleGeometry = ({ widthMm, heightMm }: PaperSize): CircleGeometry => ({
  center: { x: widthMm / 2, y: heightMm / 2 },
  radius: Math.min(widthMm, heightMm) * 0.36,
});

export const lineGeometry = ({ widthMm, heightMm }: PaperSize): SegmentGeometry => ({
  from: { x: widthMm * 0.17, y: heightMm * 0.875 },
  to: { x: widthMm * 0.83, y: heightMm * 0.15 },
});

export const waveGeometry = ({ widthMm, heightMm }: PaperSize): WaveGeometry => {
  const topY = heightMm * 0.12;
  const bottomY = heightMm * 0.88;
  return {
    centerX: widthMm / 2,
    topY,
    bottomY,
    amplitude: widthMm * 0.26,
    wavelength: (bottomY - topY) / 2.5,
  };
};

/** The wave's x position for a given y (used by both drawing and analysis). */
export const waveX = (wave: WaveGeometry, y: number): number =>
  wave.centerX + wave.amplitude * Math.sin((2 * Math.PI * (y - wave.topY)) / wave.wavelength);

export const mazePoints = ({ widthMm, heightMm }: PaperSize): Vector2[] => {
  const w = widthMm;
  const h = heightMm;
  return [
    { x: w * 0.16, y: h * 0.88 },
    { x: w * 0.16, y: h * 0.66 },
    { x: w * 0.5, y: h * 0.66 },
    { x: w * 0.5, y: h * 0.44 },
    { x: w * 0.82, y: h * 0.44 },
    { x: w * 0.82, y: h * 0.2 },
    { x: w * 0.4, y: h * 0.2 },
  ];
};

export const treeGeometry = ({ widthMm, heightMm }: PaperSize): TreeGeometry => ({
  trunkStart: { x: widthMm / 2, y: heightMm * 0.88 },
  fork: { x: widthMm / 2, y: heightMm * 0.55 },
  redEnd: { x: widthMm * 0.26, y: heightMm * 0.18 },
  greenEnd: { x: widthMm * 0.74, y: heightMm * 0.18 },
});
