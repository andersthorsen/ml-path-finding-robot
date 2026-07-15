import type { Bot, SensorPair } from "../robot/Bot.ts";

/** Everything a controller needs to decide the next motor command. */
export interface ControlContext {
  readonly bot: Bot;
  readonly sensors: SensorPair;
  readonly dtSec: number;
}

/**
 * Strategy for driving the robot. The simulation calls `update` every tick; an
 * implementation reacts by calling `bot.setMotors`. Swapping manual control for
 * an automatic/ML driver is just swapping the controller (Open/Closed +
 * Dependency Inversion — the simulation depends on this interface, not on any
 * concrete controller).
 */
export interface BotController {
  readonly id: string;
  readonly label: string;
  update(ctx: ControlContext): void;
  /** Called when this controller becomes active. */
  onActivate?(): void;
  /** Called when another controller takes over. */
  onDeactivate?(): void;
}
