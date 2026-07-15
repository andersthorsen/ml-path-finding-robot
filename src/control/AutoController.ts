import type { BotController, ControlContext } from "./BotController.ts";
import type { Policy } from "./Policy.ts";

/**
 * Drives the robot from a {@link Policy}. The same controller serves the
 * baseline line follower today and a machine-learned policy later — only the
 * injected policy changes.
 */
export class AutoController implements BotController {
  readonly id = "auto";
  readonly label: string;

  readonly #policy: Policy;

  constructor(policy: Policy) {
    this.#policy = policy;
    this.label = `Auto — ${policy.label}`;
  }

  onActivate(): void {
    this.#policy.reset?.();
  }

  update({ bot, sensors }: ControlContext): void {
    const command = this.#policy.decide({ left: sensors.left, right: sensors.right });
    bot.setMotors(command.left, command.right);
  }
}
