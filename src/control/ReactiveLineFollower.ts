import { clamp } from "../util/math.ts";
import type { MotorCommand, Policy, PolicyInput } from "./Policy.ts";

export interface LineFollowerTuning {
  /** Forward power when centred on the line. */
  readonly cruise: number;
  /** Steering gain applied to the left/right intensity difference. */
  readonly steerGain: number;
  /** Power used to spin and re-acquire the line when both sensors are off it. */
  readonly searchPower: number;
}

const DEFAULT_TUNING: LineFollowerTuning = {
  cruise: 55,
  steerGain: 90,
  searchPower: 45,
};

/**
 * Hand-written proportional line follower used as the non-learning baseline.
 *
 * Each sensor reports reflectance (1 = white surface, lower = darker path), so
 * "darkness" marks where the line is. The robot steers toward the darker
 * sensor; when both sensors are bright it has lost the line and spins in the
 * direction it last saw it.
 */
export class ReactiveLineFollower implements Policy {
  readonly id = "line-follower";
  readonly label = "line follower (baseline)";

  readonly #tuning: LineFollowerTuning;
  #lastTurnSign = 1;

  constructor(tuning: Partial<LineFollowerTuning> = {}) {
    this.#tuning = { ...DEFAULT_TUNING, ...tuning };
  }

  reset(): void {
    this.#lastTurnSign = 1;
  }

  decide({ left, right }: PolicyInput): MotorCommand {
    const { cruise, steerGain, searchPower } = this.#tuning;

    if (!left.onLine && !right.onLine) {
      // Line lost — rotate in place toward where it most recently was.
      return { left: this.#lastTurnSign * searchPower, right: -this.#lastTurnSign * searchPower };
    }

    const leftDark = 1 - left.reflectance;
    const rightDark = 1 - right.reflectance;
    const turn = leftDark - rightDark; // > 0 → line is to the left
    this.#lastTurnSign = turn >= 0 ? -1 : 1;

    const steer = steerGain * turn;
    return {
      left: clamp(cruise - steer, -100, 100),
      right: clamp(cruise + steer, -100, 100),
    };
  }
}
