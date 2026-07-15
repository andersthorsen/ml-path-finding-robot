import { offsetPoint, type Pose } from "../geometry/Pose.ts";
import type { Vector2 } from "../geometry/Vector2.ts";
import { classify, isOnPath, reflectance, type ColorName, type Rgb } from "../paper/Color.ts";
import type { Paper } from "../paper/Paper.ts";

/** One reading from a Bit:Bot PRO line sensor (it exposes both analog and digital). */
export interface SensorReading {
  /** Averaged colour beneath the sensor footprint. */
  readonly color: Rgb;
  /** Nearest named colour — lets the robot tell the red branch from the green. */
  readonly colorName: ColorName;
  /** Reflected-light intensity, 0..1 (1 = bright white surface). */
  readonly reflectance: number;
  /** Analog value as the micro:bit would read it: 0..1023, high = bright. */
  readonly analog: number;
  /** Digital line detection: true when over any printed path. */
  readonly onLine: boolean;
}

/**
 * A downward-facing line/reflectance sensor mounted at a fixed offset on the
 * robot. It measures the *intensity* (and colour) of the paper beneath it by
 * averaging every pixel inside its circular footprint, mirroring how the real
 * sensor integrates reflected light over its field of view.
 */
export class LineSensor {
  readonly label: string;
  readonly forwardMm: number;
  readonly lateralMm: number;
  readonly radiusMm: number;

  readonly #paper: Paper;

  constructor(
    paper: Paper,
    config: { label: string; forwardMm: number; lateralMm: number; radiusMm: number },
  ) {
    this.#paper = paper;
    this.label = config.label;
    this.forwardMm = config.forwardMm;
    this.lateralMm = config.lateralMm;
    this.radiusMm = config.radiusMm;
  }

  /** Where this sensor sits on the paper for the given robot pose. */
  position(pose: Pose): Vector2 {
    return offsetPoint(pose, this.forwardMm, this.lateralMm);
  }

  read(pose: Pose): SensorReading {
    const color = this.#paper.averageColor(this.position(pose), this.radiusMm);
    const intensity = reflectance(color);
    return {
      color,
      colorName: classify(color),
      reflectance: intensity,
      analog: Math.round(intensity * 1023),
      onLine: isOnPath(color),
    };
  }
}
