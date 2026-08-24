import { describe, expect, it } from 'vitest';
import { bounceOff, clampSpeed, elasticCollide, integrate, wallBounce } from './physics';
import type { Kinematic } from './types';

const body = (o: Partial<Kinematic> = {}): Kinematic => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  ...o,
});

describe('integrate', () => {
  it('scales velocity by dt at a 60fps baseline', () => {
    const b = body({ vx: 1 });
    integrate(b, 0.5);
    expect(b.x).toBeCloseTo(30);
  });
});

describe('wallBounce', () => {
  it('reflects and clamps at left/right walls', () => {
    const b = body({ x: 5, vx: -2 });
    wallBounce(b, 800, 600);
    expect(b.x).toBe(10);
    expect(b.vx).toBe(2);

    const c = body({ x: 795, vx: 3 });
    wallBounce(c, 800, 600);
    expect(c.x).toBe(790);
    expect(c.vx).toBe(-3);
  });

  it('reflects and clamps at top/bottom walls', () => {
    const b = body({ y: 4, vy: -1 });
    wallBounce(b, 800, 600);
    expect(b.y).toBe(10);
    expect(b.vy).toBe(1);

    const c = body({ y: 596, vy: 1 });
    wallBounce(c, 800, 600);
    expect(c.y).toBe(590);
    expect(c.vy).toBe(-1);
  });
});

describe('elasticCollide', () => {
  it('swaps head-on velocities and separates overlapping bodies', () => {
    const a = body({ x: 0, vx: 5 });
    const b = body({ x: 15, vx: -5 });
    elasticCollide(a, b);
    expect(a.vx).toBeCloseTo(-5);
    expect(b.vx).toBeCloseTo(5);
    expect(a.x + b.x).toBeCloseTo(15); // separation is symmetric
  });

  it('ignores bodies that are not overlapping', () => {
    const a = body({ x: 0, vx: 5 });
    const b = body({ x: 500, vx: 0 });
    elasticCollide(a, b);
    expect(a.vx).toBe(5);
    expect(b.vx).toBe(0);
  });

  it('does not accelerate separating bodies', () => {
    const a = body({ x: 0, vx: -5 });
    const b = body({ x: 15, vx: 5 }); // moving apart despite overlap
    elasticCollide(a, b);
    expect(a.vx).toBeCloseTo(-5);
    expect(b.vx).toBeCloseTo(5);
    // still separated positionally so they don't re-collide
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThanOrEqual(20);
  });
});

describe('bounceOff', () => {
  it('reflects an approach and ejects the body outside the circle', () => {
    const b = body({ x: 60, y: 0, vx: -4 }); // heading toward a circle at origin
    expect(bounceOff(b, 0, 0, 30)).toBe(true);
    const dist = Math.hypot(b.x, b.y);
    expect(dist).toBeGreaterThanOrEqual(40); // radius 10 + circle 30
    const nx = b.x / dist;
    const ny = b.y / dist;
    expect(b.vx * nx + b.vy * ny).toBeGreaterThanOrEqual(0); // no longer approaching
  });

  it('returns false when clearly outside', () => {
    const b = body({ x: 500, y: 500 });
    expect(bounceOff(b, 0, 0, 30)).toBe(false);
  });
});

describe('clampSpeed', () => {
  it('rescales velocity magnitude to target', () => {
    const b = body({ vx: 3, vy: 4 });
    clampSpeed(b, 1);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(1);
  });

  it('leaves zero-velocity bodies alone', () => {
    const b = body();
    clampSpeed(b, 1);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
  });
});
