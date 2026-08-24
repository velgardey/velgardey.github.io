import { describe, expect, it } from 'vitest';
import { Shake, burst, spawnRing, updateParticles, updateRings } from './effects';
import type { Particle, Ring } from './types';

describe('Shake', () => {
  it('decays monotonically to zero', () => {
    const s = new Shake();
    s.kick(1);
    let prev = s.level;
    for (let i = 0; i < 100; i++) {
      s.update(0.016);
      expect(s.level).toBeLessThanOrEqual(prev);
      prev = s.level;
    }
    expect(s.level).toBe(0);
  });

  it('clamps trauma at 1', () => {
    const s = new Shake();
    s.kick(5);
    s.kick(5);
    expect(s.level).toBeLessThanOrEqual(1);
  });

  it('shrinks offsets as trauma decays', () => {
    const s = new Shake();
    s.kick(1);
    const big = Math.hypot(s.offset().x, s.offset().y);
    for (let i = 0; i < 60; i++) s.update(0.016);
    const small = Math.hypot(s.offset().x, s.offset().y);
    expect(small).toBeLessThan(big);
  });

  it('never offsets beyond the trauma-squared bound', () => {
    const s = new Shake();
    s.kick(1);
    const o = s.offset();
    const bound = 14 * s.level * s.level;
    expect(Math.hypot(o.x, o.y)).toBeLessThanOrEqual(bound * Math.SQRT2 + 1e-9);
  });
});

describe('particles', () => {
  it('burst spawns living, moving particles', () => {
    const ps: Particle[] = [];
    burst(ps, 10, 10, '#fff', 20, 5);
    expect(ps).toHaveLength(20);
    expect(ps.every((p) => p.life > 0 && p.life <= p.maxLife)).toBe(true);
    expect(ps.every((p) => p.vx !== 0 || p.vy !== 0)).toBe(true);
  });

  it('update culls particles whose life is spent', () => {
    const ps: Particle[] = [];
    burst(ps, 0, 0, '#fff', 10, 3);
    for (let i = 0; i < 500; i++) updateParticles(ps, 0.016);
    expect(ps).toHaveLength(0);
  });
});

describe('rings', () => {
  it('expand monotonically then expire', () => {
    const rs: Ring[] = [];
    spawnRing(rs, 0, 0, '#fff', 100, 40);
    expect(rs[0]!.radius).toBe(40); // starts at the given radius, not a point
    let lastRadius = rs[0]!.radius;
    let frames = 0;
    while (rs.length > 0 && frames < 600) {
      updateRings(rs, 0.016);
      if (rs[0]) {
        expect(rs[0].radius).toBeGreaterThanOrEqual(lastRadius - 1e-9);
        lastRadius = rs[0].radius;
      }
      frames++;
    }
    expect(rs).toHaveLength(0);
    expect(lastRadius).toBeGreaterThan(50); // actually grew toward maxRadius
  });
});
