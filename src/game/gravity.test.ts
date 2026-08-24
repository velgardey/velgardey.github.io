import { describe, expect, it } from 'vitest';
import { stepDust, GRAVITY_REACH_FACTOR, MAX_CAPTURED_PER_PLANET } from './gravity';
import type { Dust, Planet } from './types';

const makePlanet = (o: Partial<Planet> = {}): Planet => ({
  defId: 'p',
  label: 'P',
  color: '#FFFFFF',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 50,
  flash: 0,
  spawnT: 1,
  seed: 0,
  ...o,
});

const makeDust = (o: Partial<Dust> = {}): Dust => ({
  x: 0,
  y: 0,
  vx: 5,
  vy: -3,
  size: 1.5,
  phase: 0,
  capturedBy: -1,
  orbitAngle: 0,
  orbitRadius: 0,
  orbitSpeed: 0,
  releaseIn: 0,
  cooldown: 0,
  ...o,
});

describe('capture', () => {
  it('captures free dust inside the gravity well', () => {
    const planets = [makePlanet({ radius: 50 })];
    const d = makeDust({ x: 50 * GRAVITY_REACH_FACTOR - 5, y: 0 });
    stepDust(d, planets, [d], 0.016);
    expect(d.capturedBy).toBe(0);
  });

  it('ignores dust beyond the well', () => {
    const planets = [makePlanet({ radius: 50 })];
    const d = makeDust({ x: 50 * GRAVITY_REACH_FACTOR + 30, y: 0 });
    stepDust(d, planets, [d], 0.016);
    expect(d.capturedBy).toBe(-1);
  });

  it('bigger planets pull from further away', () => {
    const small = makePlanet({ radius: 40 });
    const big = makePlanet({ radius: 90 });
    const probe = 40 * GRAVITY_REACH_FACTOR + 12; // outside small, inside big

    const d1 = makeDust({ x: probe, y: 0 });
    stepDust(d1, [small], [d1], 0.016);
    expect(d1.capturedBy).toBe(-1);

    const d2 = makeDust({ x: probe, y: 0 });
    stepDust(d2, [big], [d2], 0.016);
    expect(d2.capturedBy).toBe(0);
  });

  it('respects the post-release cooldown', () => {
    const planets = [makePlanet()];
    const d = makeDust({ x: 10, y: 0, cooldown: 2 });
    stepDust(d, planets, [d], 0.016);
    expect(d.capturedBy).toBe(-1);
  });

  it('stops capturing once a planet holds its cap', () => {
    const planets = [makePlanet()];
    const captured = Array.from({ length: MAX_CAPTURED_PER_PLANET }, () =>
      makeDust({
        x: 10,
        y: 0,
        capturedBy: 0,
        orbitRadius: 60,
        orbitAngle: 1,
        orbitSpeed: 1,
        releaseIn: 10,
      }),
    );
    captured.forEach((c) => stepDust(c, planets, captured, 0.016));

    const newcomer = makeDust({ x: 10, y: 0 });
    stepDust(newcomer, planets, captured, 0.016);
    expect(newcomer.capturedBy).toBe(-1);
  });
});

describe('orbit', () => {
  it('moves captured dust along its orbit and keeps it near the planet', () => {
    const p = makePlanet({ x: 100, y: 100 });
    const d = makeDust({
      x: 130,
      y: 100,
      capturedBy: 0,
      orbitRadius: 30,
      orbitAngle: 0,
      orbitSpeed: Math.PI,
      releaseIn: 5,
    });
    stepDust(d, [p], [d], 0.5);
    expect(d.capturedBy).toBe(0);
    expect(Math.hypot(d.x - p.x, d.y - p.y)).toBeCloseTo(30);
    expect(d.x).toBeCloseTo(100); // half turn from angle 0
    expect(d.releaseIn).toBeCloseTo(4.5);
  });

  it('releases captured dust whose planet disappeared', () => {
    const d = makeDust({
      capturedBy: 3,
      orbitRadius: 30,
      orbitAngle: 0,
      orbitSpeed: 1,
      x: 5,
      y: 5,
    });
    stepDust(d, [], [d], 0.016);
    expect(d.capturedBy).toBe(-1);
    expect(d.cooldown).toBeGreaterThan(0);
  });
});

describe('release', () => {
  it('ejects tangentially with an outward push and starts a cooldown', () => {
    const p = makePlanet({ x: 0, y: 0 });
    const d = makeDust({
      capturedBy: 0,
      orbitRadius: 60,
      orbitAngle: 0,
      orbitSpeed: 1,
      releaseIn: 0.01,
      x: 60,
      y: 0,
    });
    stepDust(d, [p], [d], 0.5);
    expect(d.capturedBy).toBe(-1);
    expect(d.cooldown).toBeGreaterThan(0);
    // velocity must point along tangent + outward normal, whatever the random magnitude
    const tangent = { x: -Math.sin(d.orbitAngle), y: Math.cos(d.orbitAngle) };
    const normal = { x: Math.cos(d.orbitAngle), y: Math.sin(d.orbitAngle) };
    const expected = { x: tangent.x + normal.x, y: tangent.y + normal.y };
    const dot = d.vx * expected.x + d.vy * expected.y;
    expect(dot).toBeGreaterThan(0);
  });
});
