import type { Vector2 } from "../geometry/Vector2.ts";
import type { Rgb } from "./Color.ts";
import { A2_PORTRAIT, DEFAULT_PIXELS_PER_MM, type PaperSize } from "./PaperSpec.ts";

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

export interface PaperOptions {
  readonly size?: PaperSize;
  readonly pixelsPerMm?: number;
}

/**
 * The physical surface: a white sheet with a printed coloured path, backed by a
 * raster image. The {@link Paper} owns all pixel access — it is the authority
 * the sensor queries for the colour/intensity beneath it. It does not know what
 * a robot or a sensor is (Single Responsibility).
 */
export class Paper {
  readonly size: PaperSize;
  readonly pixelsPerMm: number;
  readonly bitmap: ImageBitmap;

  readonly #pixels: Uint8ClampedArray;
  readonly #width: number;
  readonly #height: number;

  private constructor(bitmap: ImageBitmap, pixels: ImageData, size: PaperSize, pixelsPerMm: number) {
    this.bitmap = bitmap;
    this.size = size;
    this.pixelsPerMm = pixelsPerMm;
    this.#pixels = pixels.data;
    this.#width = pixels.width;
    this.#height = pixels.height;
  }

  /** Load a path PNG and rasterise it at the paper's working resolution. */
  static async load(url: string, options: PaperOptions = {}): Promise<Paper> {
    const size = options.size ?? A2_PORTRAIT;
    const pixelsPerMm = options.pixelsPerMm ?? DEFAULT_PIXELS_PER_MM;
    const width = Math.round(size.widthMm * pixelsPerMm);
    const height = Math.round(size.heightMm * pixelsPerMm);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load path image "${url}": ${response.status}`);
    }
    const source = await createImageBitmap(await response.blob());

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("2D canvas context is unavailable in this browser.");
    }
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);

    const bitmap = await createImageBitmap(canvas);
    return new Paper(bitmap, pixels, size, pixelsPerMm);
  }

  /** The raw colour of the single pixel at a millimetre coordinate. */
  colorAt({ x, y }: Vector2): Rgb {
    const px = Math.round(x * this.pixelsPerMm);
    const py = Math.round(y * this.pixelsPerMm);
    return this.#colorAtPixel(px, py);
  }

  /**
   * Average colour of every pixel within `radiusMm` of a point — this is what
   * a real sensor "sees": the blended reflection of its whole footprint, not a
   * single pixel.
   */
  averageColor(center: Vector2, radiusMm: number): Rgb {
    const cx = center.x * this.pixelsPerMm;
    const cy = center.y * this.pixelsPerMm;
    const radiusPx = Math.max(1, radiusMm * this.pixelsPerMm);
    const radiusSq = radiusPx * radiusPx;

    const minX = Math.floor(cx - radiusPx);
    const maxX = Math.ceil(cx + radiusPx);
    const minY = Math.floor(cy - radiusPx);
    const maxY = Math.ceil(cy + radiusPx);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let py = minY; py <= maxY; py += 1) {
      for (let px = minX; px <= maxX; px += 1) {
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy > radiusSq) {
          continue;
        }
        const sample = this.#colorAtPixel(px, py);
        r += sample.r;
        g += sample.g;
        b += sample.b;
        count += 1;
      }
    }
    if (count === 0) {
      return WHITE;
    }
    return { r: r / count, g: g / count, b: b / count };
  }

  #colorAtPixel(px: number, py: number): Rgb {
    if (px < 0 || py < 0 || px >= this.#width || py >= this.#height) {
      return WHITE; // off the paper reads as the white surface
    }
    const i = (py * this.#width + px) * 4;
    return { r: this.#pixels[i]!, g: this.#pixels[i + 1]!, b: this.#pixels[i + 2]! };
  }
}
