import type { Pose } from "../geometry/Pose.ts";
import type { Paper } from "../paper/Paper.ts";
import { clamp } from "../util/math.ts";
import { delay } from "../util/delay.ts";
import { DifferentialDrive } from "./DifferentialDrive.ts";
import { LineSensor, type SensorReading } from "./LineSensor.ts";

/** Tunable physical model of the robot. Defaults match {@link BITBOT_PRO}. */
export interface BotConfig {
  /** Distance between the two driven wheels (mm). */
  readonly wheelBaseMm: number;
  /** Diameter of the round chassis (mm) — used for rendering and collision-free spacing. */
  readonly bodyDiameterMm: number;
  /** Wheel velocity at full motor power (mm/s). Kept gentle so motion is watchable. */
  readonly maxWheelSpeedMmPerSec: number;
  /** How far ahead of the wheel axle the line sensors sit (mm). */
  readonly sensorForwardMm: number;
  /** Lateral gap between the left and right line sensors (mm). */
  readonly sensorSpacingMm: number;
  /** Radius of each sensor's footprint (mm). */
  readonly sensorRadiusMm: number;
}

/**
 * 4tronix Bit:Bot PRO defaults: a ~125 mm round chassis, ~108 mm wheel base,
 * and two front line sensors straddling a printed line. The top speed is
 * deliberately throttled below the real buggy so the simulation is easy to watch.
 */
export const BITBOT_PRO: BotConfig = {
  wheelBaseMm: 108,
  bodyDiameterMm: 125,
  maxWheelSpeedMmPerSec: 150,
  sensorForwardMm: 55,
  sensorSpacingMm: 24,
  sensorRadiusMm: 4,
};

/** Readings from both line sensors in one tick. */
export interface SensorPair {
  readonly left: SensorReading;
  readonly right: SensorReading;
}

const MOTOR_MIN = -100;
const MOTOR_MAX = 100;
/** Minimum duration of a timed command, so scripted moves never blink past. */
const MIN_COMMAND_MS = 50;

/**
 * The robot: pose, two independently driven wheels, and two line sensors. It
 * composes a {@link DifferentialDrive} for kinematics and {@link LineSensor}s
 * for perception (Dependency Inversion / composition over a god-object).
 *
 * Motor speeds use the Bit:Bot convention of -100..100. `setMotors` runs the
 * wheels continuously (manual / ML control); `drive` is a bit:bot-style timed
 * command that runs the wheels for a duration and then stops.
 */
export class Bot {
  readonly config: BotConfig;
  readonly leftSensor: LineSensor;
  readonly rightSensor: LineSensor;

  readonly #drive: DifferentialDrive;
  #pose: Pose;
  #leftMotor = 0;
  #rightMotor = 0;

  constructor(paper: Paper, start: Pose, config: BotConfig = BITBOT_PRO) {
    this.config = config;
    this.#pose = start;
    this.#drive = new DifferentialDrive(config.wheelBaseMm);
    const halfSpacing = config.sensorSpacingMm / 2;
    this.leftSensor = new LineSensor(paper, {
      label: "left",
      forwardMm: config.sensorForwardMm,
      lateralMm: -halfSpacing,
      radiusMm: config.sensorRadiusMm,
    });
    this.rightSensor = new LineSensor(paper, {
      label: "right",
      forwardMm: config.sensorForwardMm,
      lateralMm: halfSpacing,
      radiusMm: config.sensorRadiusMm,
    });
  }

  get pose(): Pose {
    return this.#pose;
  }

  get motorSpeeds(): { left: number; right: number } {
    return { left: this.#leftMotor, right: this.#rightMotor };
  }

  /** Set both wheel powers (-100..100) and keep them running. */
  setMotors(left: number, right: number): void {
    this.#leftMotor = clamp(left, MOTOR_MIN, MOTOR_MAX);
    this.#rightMotor = clamp(right, MOTOR_MIN, MOTOR_MAX);
  }

  stop(): void {
    this.#leftMotor = 0;
    this.#rightMotor = 0;
  }

  /**
   * Bit:Bot-style timed move: run the wheels at the given powers for at least
   * `durationMs`, then stop. The delay is what keeps scripted motion from being
   * instantaneous.
   */
  async drive(left: number, right: number, durationMs: number): Promise<void> {
    this.setMotors(left, right);
    await delay(Math.max(durationMs, MIN_COMMAND_MS));
    this.stop();
  }

  /** Advance the pose by `dtSec` using the current motor powers. */
  update(dtSec: number): void {
    if (dtSec <= 0) {
      return;
    }
    this.#pose = this.#drive.integrate(
      this.#pose,
      this.#motorToMmPerSec(this.#leftMotor),
      this.#motorToMmPerSec(this.#rightMotor),
      dtSec,
    );
  }

  readSensors(): SensorPair {
    return {
      left: this.leftSensor.read(this.#pose),
      right: this.rightSensor.read(this.#pose),
    };
  }

  reset(start: Pose): void {
    this.#pose = start;
    this.stop();
  }

  #motorToMmPerSec(motor: number): number {
    return (motor / MOTOR_MAX) * this.config.maxWheelSpeedMmPerSec;
  }
}
