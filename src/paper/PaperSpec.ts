/**
 * Shared, dependency-free description of the paper and the available paths.
 *
 * Both the browser app and the (Node) image generator import this module, so
 * it must not reference the DOM, Node, or any canvas implementation. It is the
 * single source of truth for paper size, raster resolution and the path list.
 */

/** Physical extent of the paper, in millimetres. */
export interface PaperSize {
  readonly widthMm: number;
  readonly heightMm: number;
}

/**
 * A2 paper, portrait orientation: 420 mm × 594 mm.
 *
 * Rendered at {@link DEFAULT_PIXELS_PER_MM} this yields an 840 × 1188 px raster
 * — high enough that the sensor footprint covers many pixels (good intensity
 * averaging) while staying a sensible PNG size.
 */
export const A2_PORTRAIT: PaperSize = { widthMm: 420, heightMm: 594 };

/** Raster resolution used for the generated PNGs and for sensor sampling. */
export const DEFAULT_PIXELS_PER_MM = 2;

/** Identifier for one of the five built-in paths. */
export type PathId = "circle" | "tree" | "maze" | "wave" | "line";

export interface PathInfo {
  readonly id: PathId;
  readonly label: string;
  readonly description: string;
}

/** The five paths, in display order. */
export const PATHS = [
  { id: "circle", label: "Circle", description: "A single closed loop." },
  { id: "tree", label: "Tree fork (red / green)", description: "Trunk that splits into a red and a green branch." },
  { id: "maze", label: "Maze (straight lines)", description: "Right-angle segments like a simple maze." },
  { id: "wave", label: "Wave", description: "A smooth sine wave down the page." },
  { id: "line", label: "Straight line", description: "A single straight diagonal line." },
] as const satisfies readonly PathInfo[];

/** Public URL (Vite serves `public/` at the web root) for a path's PNG. */
export function pathImageUrl(id: PathId): string {
  return `/paths/${id}.png`;
}
