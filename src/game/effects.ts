import type { Particle, Ring, Vec2 } from './types';

const SHAKE_DECAY_PER_SEC = 1.8;
const MAX_OFFSET = 14;

/**
 * Screen shake driven by "trauma": kicks add trauma (clamped to 1), offset is
 * proportional to trauma squared so small hits feel subtle.
 */
export class Shake {
  private trauma = 0;

  get level(): number {
    return this.trauma;
  }

  kick(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * SHAKE_DECAY_PER_SEC);
  }

  offset(): Vec2 {
    const t = this.trauma * this.trauma;
    return {
      x: (Math.random() * 2 - 1) * MAX_OFFSET * t,
      y: (Math.random() * 2 - 1) * MAX_OFFSET * t,
    };
  }
}

/** Spawn `count` particles exploding outward from a point. */
export function burst(
  out: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.6);
    const life = 0.35 + Math.random() * 0.5;
    out.push({
      x,
      y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      size: 1 + Math.random() * 2.5,
      life,
      maxLife: life,
      color,
    });
  }
}

/** Advance particles and remove spent ones. Velocities are px/frame @60fps. */
export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/** Add an expanding shockwave ring that starts wide (at `startRadius`). */
export function spawnRing(
  out: Ring[],
  x: number,
  y: number,
  color: string,
  maxRadius: number,
  startRadius = maxRadius * 0.1,
): void {
  out.push({
    x,
    y,
    radius: startRadius,
    startRadius,
    maxRadius,
    life: 0.5,
    maxLife: 0.5,
    color,
    width: 3,
  });
}

/** Expand rings from their start radius and expire finished ones. */
export function updateRings(rings: Ring[], dt: number): void {
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.life -= dt;
    const progress = 1 - r.life / r.maxLife;
    r.radius = r.startRadius + (r.maxRadius - r.startRadius) * easeOut(progress);
    if (r.life <= 0) rings.splice(i, 1);
  }
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}
