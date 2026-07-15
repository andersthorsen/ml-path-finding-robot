import { clamp } from "../util/math.ts";
import type { BotController, ControlContext } from "./BotController.ts";

/** Logical manual inputs — bound to keys and to on-screen buttons alike. */
export type ManualInput =
  | "forward"
  | "back"
  | "left"
  | "right"
  | "leftWheelForward"
  | "leftWheelBack"
  | "rightWheelForward"
  | "rightWheelBack";

const DRIVE_POWER = 75;
const TURN_POWER = 55;
const WHEEL_POWER = 75;

/**
 * Human control: holds a set of active inputs and converts them to motor powers
 * every tick. Supports both tank-style driving (forward/back + turn) and direct
 * per-wheel jogging, so the user can manually exercise each wheel.
 */
export class ManualController implements BotController {
  readonly id = "manual";
  readonly label = "Manual";

  readonly #active = new Set<ManualInput>();

  press(input: ManualInput): void {
    this.#active.add(input);
  }

  release(input: ManualInput): void {
    this.#active.delete(input);
  }

  releaseAll(): void {
    this.#active.clear();
  }

  onDeactivate(): void {
    this.releaseAll();
  }

  update({ bot }: ControlContext): void {
    const has = (input: ManualInput): number => (this.#active.has(input) ? 1 : 0);

    const drive = has("forward") - has("back");
    const turn = has("right") - has("left");

    let left = drive * DRIVE_POWER + turn * TURN_POWER;
    let right = drive * DRIVE_POWER - turn * TURN_POWER;

    left += has("leftWheelForward") * WHEEL_POWER - has("leftWheelBack") * WHEEL_POWER;
    right += has("rightWheelForward") * WHEEL_POWER - has("rightWheelBack") * WHEEL_POWER;

    bot.setMotors(clamp(left, -100, 100), clamp(right, -100, 100));
  }
}
