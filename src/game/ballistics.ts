import type { Planet, Vec2 } from './types';

/**
 * Shot resolution: a bullet that passes through a planet's inner core kills it
 * (navigates); one that only clips the outer band grazes — sparks plus an
 * impulse that shoves the planet along the shot. Shoot blockers out of the way.
 */

/** Fraction of the radius that counts as a kill shot; outside is a graze. */
export const CORE_HIT_RATIO = 0.72;

/** Momentum a graze imparts, scaled by planet radius (bigger = heavier). */
const GRAZE_IMPULSE = 18;

export interface Impact {
  planet: Planet;
  /** Distance along the ray to the first contact point. */
  t: number;
  /** True when the ray passes through the kill core. */
  core: boolean;
}

/** First planet a ray from `from` toward `dir` (unit) would touch, if any. */
export function firstImpact(
  from: Vec2,
  dir: Vec2,
  planets: Planet[],
): Impact | null {
  let best: Impact | null = null;

  for (const planet of planets) {
    const px = planet.x - from.x;
    const py = planet.y - from.y;
    const along = px * dir.x + py * dir.y;
    if (along <= 0) continue; // behind the shot

    const closest = Math.hypot(px - dir.x * along, py - dir.y * along);
    if (closest >= planet.radius) continue; // misses the disc

    const halfChord = Math.sqrt(planet.radius * planet.radius - closest * closest);
    const t = along - halfChord;
    if (best && t >= best.t) continue;

    best = {
      planet,
      t,
      core: closest < planet.radius * CORE_HIT_RATIO,
    };
  }
  return best;
}

/** Nudge a grazed planet along the shot direction; heavier planets move less. */
export function applyGrazeImpulse(planet: Planet, dir: Vec2): void {
  const kick = GRAZE_IMPULSE / planet.radius;
  planet.vx += dir.x * kick;
  planet.vy += dir.y * kick;
}
