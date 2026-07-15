import { pose, type Pose } from "../geometry/Pose.ts";

const STRAIGHT_EPSILON = 1e-6;

/**
 * Differential-drive kinematics for a two-wheel robot. Converts independent
 * left/right wheel velocities into a new pose using exact arc integration, so
 * large time steps stay accurate. Knows nothing about sensors or rendering.
 */
export class DifferentialDrive {
  readonly wheelBaseMm: number;

  constructor(wheelBaseMm: number) {
    this.wheelBaseMm = wheelBaseMm;
  }

  integrate(current: Pose, leftMmPerSec: number, rightMmPerSec: number, dtSec: number): Pose {
    const linear = (leftMmPerSec + rightMmPerSec) / 2;
    const angular = (rightMmPerSec - leftMmPerSec) / this.wheelBaseMm;
    const { x, y, heading } = current;

    if (Math.abs(angular) < STRAIGHT_EPSILON) {
      return pose(x + linear * Math.cos(heading) * dtSec, y + linear * Math.sin(heading) * dtSec, heading);
    }

    const nextHeading = heading + angular * dtSec;
    const turnRadius = linear / angular;
    return pose(
      x + turnRadius * (Math.sin(nextHeading) - Math.sin(heading)),
      y - turnRadius * (Math.cos(nextHeading) - Math.cos(heading)),
      nextHeading,
    );
  }
}
