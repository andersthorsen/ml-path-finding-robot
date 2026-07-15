import { CSS } from "../../src/paper/Color.ts";
import type { PaperSize, PathId } from "../../src/paper/PaperSpec.ts";
import {
  circleGeometry,
  lineGeometry,
  mazePoints,
  treeGeometry,
  waveGeometry,
  waveX,
} from "../../src/paper/pathGeometry.ts";
import { sampleCurve, strokePolyline } from "./stroke.ts";

/**
 * A scene drawer strokes one path into a millimetre-space 2D context. Adding a
 * path means adding a drawer here (Open/Closed) — the generator and runtime
 * pick it up via the shared catalog.
 */
export type SceneDrawer = (ctx: CanvasRenderingContext2D, size: PaperSize) => void;

const drawCircle: SceneDrawer = (ctx, size) => {
  const { center, radius } = circleGeometry(size);
  const points = sampleCurve(0, Math.PI * 2, 180, (t) => ({
    x: center.x + radius * Math.cos(t),
    y: center.y + radius * Math.sin(t),
  }));
  strokePolyline(ctx, points, { close: true });
};

const drawLine: SceneDrawer = (ctx, size) => {
  const { from, to } = lineGeometry(size);
  strokePolyline(ctx, [from, to]);
};

const drawWave: SceneDrawer = (ctx, size) => {
  const wave = waveGeometry(size);
  const points = sampleCurve(wave.topY, wave.bottomY, 240, (y) => ({ x: waveX(wave, y), y }));
  strokePolyline(ctx, points);
};

const drawMaze: SceneDrawer = (ctx, size) => {
  strokePolyline(ctx, mazePoints(size));
};

const drawTree: SceneDrawer = (ctx, size) => {
  const { trunkStart, fork, redEnd, greenEnd } = treeGeometry(size);
  strokePolyline(ctx, [trunkStart, fork]); // black trunk
  strokePolyline(ctx, [fork, redEnd], { color: CSS.red });
  strokePolyline(ctx, [fork, greenEnd], { color: CSS.green });
};

export const SCENES: Record<PathId, SceneDrawer> = {
  circle: drawCircle,
  line: drawLine,
  wave: drawWave,
  maze: drawMaze,
  tree: drawTree,
};
