import type { Kinematic } from './types';

/**
 * Velocities on Kinematic bodies are expressed in px/frame at a 60fps baseline,
 * so physics looks identical at any refresh rate once scaled by elapsed time.
 */
const BASE_FPS = 60;

/** Radius of the player-controlled spacecraft, used for collision exclusion. */
export const SHIP_RADIUS = 26;

export function integrate(b: Kinematic, dtSec: number): void {
  b.x += b.vx * dtSec * BASE_FPS;
  b.y += b.vy * dtSec * BASE_FPS;
}

export function wallBounce(b: Kinematic, width: number, height: number): void {
  if (b.x - b.radius < 0) {
    b.x = b.radius;
    b.vx = Math.abs(b.vx);
  } else if (b.x + b.radius > width) {
    b.x = width - b.radius;
    b.vx = -Math.abs(b.vx);
  }
  if (b.y - b.radius < 0) {
    b.y = b.radius;
    b.vy = Math.abs(b.vy);
  } else if (b.y + b.radius > height) {
    b.y = height - b.radius;
    b.vy = -Math.abs(b.vy);
  }
}

/**
 * Reflect a body off an immobile circle (the spacecraft). Returns true when a
 * bounce happened. Only inward-moving bodies are reflected; overlapping bodies
 * that are already leaving are just pushed to the rim.
 */
export function bounceOff(b: Kinematic, cx: number, cy: number, cr: number): boolean {
  const dx = b.x - cx;
  const dy = b.y - cy;
  const dist = Math.hypot(dx, dy);
  const min = b.radius + cr;
  if (dist >= min || dist === 0) return false;

  const nx = dx / dist;
  const ny = dy / dist;
  const approaching = b.vx * nx + b.vy * ny < 0;
  if (approaching) {
    b.vx -= 2 * (b.vx * nx + b.vy * ny) * nx;
    b.vy -= 2 * (b.vx * nx + b.vy * ny) * ny;
  }
  b.x = cx + nx * min;
  b.y = cy + ny * min;
  return true;
}

/** Equal-mass elastic collision between two overlapping circles. */
export function elasticCollide(a: Kinematic, b: Kinematic): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const min = a.radius + b.radius;
  if (dist >= min || dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;
  // Normal relative velocity; only act when the bodies are approaching.
  const p = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (p > 0) {
    a.vx -= p * nx;
    a.vy -= p * ny;
    b.vx += p * nx;
    b.vy += p * ny;
  }

  // Positional correction so overlap resolves symmetrically.
  const overlap = (min - dist) / 2;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;
}

/** Rescale velocity so its magnitude equals `target`. */
export function clampSpeed(b: Kinematic, target: number): void {
  const speed = Math.hypot(b.vx, b.vy);
  if (speed === 0 || Math.abs(speed - target) < 0.01) return;
  const factor = target / speed;
  b.vx *= factor;
  b.vy *= factor;
}
