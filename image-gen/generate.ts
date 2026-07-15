import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { A2_PORTRAIT, DEFAULT_PIXELS_PER_MM, PATHS } from "../src/paper/PaperSpec.ts";
import { SCENES } from "./scenes/index.ts";

/**
 * Renders each path scene to a PNG under `public/paths/`. Run with
 * `pnpm gen:paths`. The paths are real raster assets that the browser app loads
 * and the robot's sensor samples — generated here rather than drawn at runtime.
 */

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../public/paths");

const size = A2_PORTRAIT;
const pixelsPerMm = DEFAULT_PIXELS_PER_MM;
const width = Math.round(size.widthMm * pixelsPerMm);
const height = Math.round(size.heightMm * pixelsPerMm);

await mkdir(outDir, { recursive: true });

for (const { id, label } of PATHS) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.scale(pixelsPerMm, pixelsPerMm);
  SCENES[id](ctx as unknown as CanvasRenderingContext2D, size);
  ctx.restore();

  const png = await canvas.encode("png");
  const file = resolve(outDir, `${id}.png`);
  await writeFile(file, png);
  console.log(`✓ ${label} → ${file} (${width}×${height})`);
}

console.log(`\nGenerated ${PATHS.length} path images at ${pixelsPerMm}px/mm.`);
