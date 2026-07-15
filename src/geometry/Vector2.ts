/** An immutable 2D point/vector expressed in millimetres. */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

export function vec(x: number, y: number): Vector2 {
  return { x, y };
}

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
