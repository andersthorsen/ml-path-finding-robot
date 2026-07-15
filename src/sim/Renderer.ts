import { rgbToCss } from "../paper/Color.ts";
import type { Paper } from "../paper/Paper.ts";
import type { Bot } from "../robot/Bot.ts";

const TRAIL_MAX = 700;
const WHEEL_LENGTH_MM = 42;
const WHEEL_WIDTH_MM = 12;

/**
 * Draws the world onto a 2D canvas: the paper raster, the robot's breadcrumb
 * trail, its chassis, wheels and heading, plus each sensor coloured by what it
 * currently reads. Pure presentation — it never mutates the simulation.
 */
export class Renderer {
  readonly #ctx: CanvasRenderingContext2D;
  readonly #paper: Paper;
  readonly #scale: number;
  readonly #trail: { x: number; y: number }[] = [];

  constructor(canvas: HTMLCanvasElement, paper: Paper) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("2D canvas context is unavailable in this browser.");
    }
    this.#paper = paper;
    this.#scale = paper.pixelsPerMm;
    canvas.width = Math.round(paper.size.widthMm * this.#scale);
    canvas.height = Math.round(paper.size.heightMm * this.#scale);
    this.#ctx = ctx;
  }

  clearTrail(): void {
    this.#trail.length = 0;
  }

  render(bot: Bot): void {
    const ctx = this.#ctx;
    const scale = this.#scale;
    const pose = bot.pose;

    ctx.drawImage(this.#paper.bitmap, 0, 0);

    this.#pushTrail(pose.x * scale, pose.y * scale);
    this.#drawTrail();

    const sensors = bot.readSensors();

    ctx.save();
    ctx.translate(pose.x * scale, pose.y * scale);
    ctx.rotate(pose.heading);
    ctx.scale(scale, scale);

    const { bodyDiameterMm, wheelBaseMm, sensorForwardMm, sensorSpacingMm, sensorRadiusMm } = bot.config;
    const bodyRadius = bodyDiameterMm / 2;

    // Wheels.
    ctx.fillStyle = "#222";
    for (const side of [-1, 1]) {
      ctx.fillRect(-WHEEL_LENGTH_MM / 2, side * (wheelBaseMm / 2) - WHEEL_WIDTH_MM / 2, WHEEL_LENGTH_MM, WHEEL_WIDTH_MM);
    }

    // Chassis.
    ctx.beginPath();
    ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(70, 130, 200, 0.7)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#22456b";
    ctx.stroke();

    // Heading arrow.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(bodyRadius, 0);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#22456b";
    ctx.stroke();

    // Sensors, coloured by what each reads.
    const half = sensorSpacingMm / 2;
    for (const reading of [sensors.left, sensors.right]) {
      const lateral = reading === sensors.left ? -half : half;
      ctx.beginPath();
      ctx.arc(sensorForwardMm, lateral, sensorRadiusMm + 2, 0, Math.PI * 2);
      ctx.fillStyle = rgbToCss(reading.color);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = reading.onLine ? "#ffcc00" : "#888";
      ctx.stroke();
    }

    ctx.restore();
  }

  #pushTrail(x: number, y: number): void {
    const last = this.#trail.at(-1);
    if (last && Math.hypot(last.x - x, last.y - y) < 2) {
      return;
    }
    this.#trail.push({ x, y });
    if (this.#trail.length > TRAIL_MAX) {
      this.#trail.shift();
    }
  }

  #drawTrail(): void {
    if (this.#trail.length < 2) {
      return;
    }
    const ctx = this.#ctx;
    ctx.beginPath();
    const first = this.#trail[0]!;
    ctx.moveTo(first.x, first.y);
    for (const point of this.#trail) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(70, 130, 200, 0.45)";
    ctx.stroke();
  }
}
