import type { BotController } from "../control/BotController.ts";
import type { Bot, SensorPair } from "../robot/Bot.ts";
import type { Renderer } from "./Renderer.ts";

/** Snapshot handed to the UI after every tick. */
export interface TickInfo {
  readonly sensors: SensorPair;
  readonly motors: { left: number; right: number };
  readonly controllerId: string;
}

/** Largest simulated step (s); caps catch-up after the tab was backgrounded. */
const MAX_DT_SEC = 0.05;

/**
 * The real-time loop that ties paper, robot and controller together. Each frame
 * it lets the active controller perceive and command, advances the robot, and
 * renders. It owns *when* things happen, not *how* — kinematics live in the
 * robot, decisions in the controller, drawing in the renderer.
 */
export class Simulation {
  onTick: ((info: TickInfo) => void) | undefined;

  readonly #bot: Bot;
  readonly #renderer: Renderer;
  #controller: BotController;
  #running = false;
  #lastTimeMs: number | null = null;
  #frameHandle = 0;

  constructor(bot: Bot, renderer: Renderer, controller: BotController) {
    this.#bot = bot;
    this.#renderer = renderer;
    this.#controller = controller;
    controller.onActivate?.();
  }

  get controller(): BotController {
    return this.#controller;
  }

  setController(next: BotController): void {
    if (next === this.#controller) {
      return;
    }
    this.#controller.onDeactivate?.();
    this.#bot.stop();
    this.#controller = next;
    next.onActivate?.();
  }

  start(): void {
    if (this.#running) {
      return;
    }
    this.#running = true;
    this.#lastTimeMs = null;
    this.#frameHandle = requestAnimationFrame(this.#loop);
  }

  stop(): void {
    this.#running = false;
    cancelAnimationFrame(this.#frameHandle);
  }

  get running(): boolean {
    return this.#running;
  }

  readonly #loop = (timeMs: number): void => {
    if (!this.#running) {
      return;
    }
    const dtSec = this.#lastTimeMs === null ? 0 : Math.min((timeMs - this.#lastTimeMs) / 1000, MAX_DT_SEC);
    this.#lastTimeMs = timeMs;

    const sensors = this.#bot.readSensors();
    this.#controller.update({ bot: this.#bot, sensors, dtSec });
    this.#bot.update(dtSec);
    this.#renderer.render(this.#bot);

    this.onTick?.({ sensors, motors: this.#bot.motorSpeeds, controllerId: this.#controller.id });

    this.#frameHandle = requestAnimationFrame(this.#loop);
  };
}
