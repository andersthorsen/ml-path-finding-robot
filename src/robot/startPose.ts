import { pose, type Pose } from "../geometry/Pose.ts";
import type { PaperSize, PathId } from "../paper/PaperSpec.ts";
import {
  circleGeometry,
  lineGeometry,
  mazePoints,
  treeGeometry,
  waveGeometry,
  waveX,
} from "../paper/pathGeometry.ts";

const headingBetween = (from: { x: number; y: number }, to: { x: number; y: number }): number =>
  Math.atan2(to.y - from.y, to.x - from.x);

/** A sensible starting pose for the robot at the beginning of each path. */
export function startPoseFor(id: PathId, size: PaperSize): Pose {
  switch (id) {
    case "circle": {
      const { center, radius } = circleGeometry(size);
      return pose(center.x, center.y + radius, 0); // bottom of the loop, facing +x
    }
    case "line": {
      const { from, to } = lineGeometry(size);
      return pose(from.x, from.y, headingBetween(from, to));
    }
    case "wave": {
      const wave = waveGeometry(size);
      const slope = (waveX(wave, wave.topY + 1) - waveX(wave, wave.topY)) / 1;
      return pose(waveX(wave, wave.topY), wave.topY, Math.atan2(1, slope));
    }
    case "maze": {
      const points = mazePoints(size);
      return pose(points[0]!.x, points[0]!.y, headingBetween(points[0]!, points[1]!));
    }
    case "tree": {
      const { trunkStart, fork } = treeGeometry(size);
      return pose(trunkStart.x, trunkStart.y, headingBetween(trunkStart, fork));
    }
  }
}
