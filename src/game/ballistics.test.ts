import { describe, expect, it } from 'vitest';
import { CORE_HIT_RATIO } from './ballistics';
import { firstImpact } from './ballistics';
import type { Planet, Vec2 } from './types';

const planet = (o: Partial<Planet>): Planet => ({
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

describe('firstImpact', () => {
  const ship: Vec2 = { x: 0, y: 0 };

  it('finds the nearest planet in the path and the contact point', () => {
    const planets = [planet({ x: 500, y: 0, radius: 50 }), planet({ x: 200, y: 0, radius: 40 })];
    const hit = firstImpact(ship, { x: 1, y: 0 }, planets);
    expect(hit).not.toBeNull();
    expect(hit!.planet.radius).toBe(40);
    expect(hit!.t).toBeCloseTo(160); // 200 - 40
    expect(hit!.core).toBe(true); // passes dead centre
  });

  it('classifies edge passes as graze', () => {
    const planets = [planet({ x: 200, y: 30, radius: 40 })]; // offset 30 > 0.72*40
    const hit = firstImpact(ship, { x: 1, y: 0 }, planets);
    expect(hit).not.toBeNull();
    expect(hit!.core).toBe(false);
  });

  it('ignores planets behind the shot or off the line', () => {
    const planets = [planet({ x: -200, y: 0 }), planet({ x: 200, y: 300 })];
    expect(firstImpact(ship, { x: 1, y: 0 }, planets)).toBeNull();
  });

  it('kills on rim entry when the path runs through the core (CCD regression)', () => {
    // Bullet segment ends right at the rim, but the trajectory aims dead-centre.
    const planets = [planet({ x: 175, y: 0, radius: 40 })];
    const hit = firstImpact({ x: 0, y: 0 }, { x: 1, y: 0 }, planets);
    expect(hit).not.toBeNull();
    expect(hit!.core).toBe(true);
    expect(hit!.t).toBeCloseTo(135); // contact at the rim, not the centre
  });

  it('returns null on a clear path', () => {
    expect(firstImpact(ship, { x: 1, y: 0 }, [planet({ x: -100, y: 0 })])).toBeNull();
  });

  it('CORE_HIT_RATIO splits kill from graze bands', () => {
    expect(CORE_HIT_RATIO).toBeGreaterThan(0.5);
    expect(CORE_HIT_RATIO).toBeLessThan(1);
  });
});
