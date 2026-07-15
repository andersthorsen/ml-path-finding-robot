/** An 8-bit-per-channel RGB colour. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** The discrete labels the colour sensor can report. */
export type ColorName = "white" | "black" | "red" | "green" | "blue";

interface NamedColor {
  readonly name: ColorName;
  readonly rgb: Rgb;
}

const PALETTE: readonly NamedColor[] = [
  { name: "white", rgb: { r: 255, g: 255, b: 255 } },
  { name: "black", rgb: { r: 20, g: 20, b: 20 } },
  { name: "red", rgb: { r: 210, g: 40, b: 40 } },
  { name: "green", rgb: { r: 40, g: 170, b: 70 } },
  { name: "blue", rgb: { r: 40, g: 90, b: 210 } },
];

export const CSS = {
  red: "rgb(210, 40, 40)",
  green: "rgb(40, 170, 70)",
  blue: "rgb(40, 90, 210)",
  black: "rgb(20, 20, 20)",
} as const;

export function rgbToCss(c: Rgb): string {
  return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
}

function squaredDistance(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/** Classify a raw RGB reading to the nearest palette colour. */
export function classify(c: Rgb): ColorName {
  let best = PALETTE[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of PALETTE) {
    const d = squaredDistance(c, candidate.rgb);
    if (d < bestDistance) {
      bestDistance = d;
      best = candidate;
    }
  }
  return best.name;
}

/** True when the reading is part of a path (i.e. not the white surface). */
export function isOnPath(c: Rgb): boolean {
  return classify(c) !== "white";
}

/** Perceived brightness on a 0..1 scale (Rec. 709 luma). 1 = white. */
export function reflectance(c: Rgb): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}
