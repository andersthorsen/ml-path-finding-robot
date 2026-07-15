import type { SensorReading } from "../robot/LineSensor.ts";

/** Perception fed to a driving policy each tick. */
export interface PolicyInput {
  readonly left: SensorReading;
  readonly right: SensorReading;
}

/** Motor powers a policy wants applied, in Bit:Bot -100..100 units. */
export interface MotorCommand {
  readonly left: number;
  readonly right: number;
}

/**
 * A driving brain: sensor readings in, motor command out. This is the seam
 * where a *machine-learned* controller plugs in — a trained network simply
 * implements `decide`. {@link ReactiveLineFollower} is the hand-written
 * baseline to compare future learned policies against.
 */
export interface Policy {
  readonly id: string;
  readonly label: string;
  decide(input: PolicyInput): MotorCommand;
  /** Clear any episodic state when control (re)starts. */
  reset?(): void;
}
