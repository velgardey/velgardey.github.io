import type { Dust, Planet } from './types';

/**
 * Dust gravity: free-floating background particles that drift too close to a
 * planet get captured into orbit, revolve for a while (joining the ring look),
 * then are ejected tangentially so the sky never empties out.
 */

/** Gravity well reach as a multiple of the planet radius — bigger = stronger. */
export const GRAVITY_REACH_FACTOR = 2.2;

/** Per-planet cap so a few planets can't hoard the whole sky. */
export const MAX_CAPTURED_PER_PLANET = 14;

/** Seconds a released particle is immune to recapture. */
const RELEASE_COOLDOWN = 2.5;

export function stepDust(d: Dust, planets: Planet[], population: Dust[], dt: number): void {
  if (d.cooldown > 0) d.cooldown -= dt;

  if (d.capturedBy >= 0) {
    const planet = planets[d.capturedBy];
    if (!planet) {
      release(d, null);
      return;
    }
    d.orbitAngle += d.orbitSpeed * dt;
    d.x = planet.x + Math.cos(d.orbitAngle) * d.orbitRadius;
    d.y = planet.y + Math.sin(d.orbitAngle) * d.orbitRadius;
    d.releaseIn -= dt;
    if (d.releaseIn <= 0) release(d, planet);
    return;
  }

  if (d.cooldown <= 0) tryCapture(d, planets, population);
}

function tryCapture(d: Dust, planets: Planet[], population: Dust[]): void {
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const reach = p.radius * GRAVITY_REACH_FACTOR;
    const dist = Math.hypot(d.x - p.x, d.y - p.y);
    if (dist >= reach) continue;
    if (population.filter((other) => other.capturedBy === i).length >= MAX_CAPTURED_PER_PLANET)
      continue;
    capture(d, i, p, dist);
    return;
  }
}

/** Capture dust into orbit around planet `index`. */
function capture(d: Dust, index: number, p: Planet, dist: number): void {
  // Kepler-ish flavour: closer orbits run faster.
  d.capturedBy = index;
  d.orbitRadius = Math.min(Math.max(dist, p.radius + 6), p.radius * 1.9);
  d.orbitAngle = Math.atan2(d.y - p.y, d.x - p.x);
  d.orbitSpeed = (0.5 + 26 / d.orbitRadius) * (Math.random() < 0.5 ? 1 : -1);
  d.releaseIn = 8 + Math.random() * 6;
}

/**
 * Freshly spawned planets sweep up the nearest free dust so they never appear
 * naked — the grains are still "picked up from the background", just at spawn.
 */
export function seedCaptures(dust: Dust[], planets: Planet[], perPlanet: number): void {
  for (let i = 0; i < planets.length; i++) {
    const p = planets[i];
    const nearest = dust
      .filter((d) => d.capturedBy === -1)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))
      .slice(0, perPlanet);
    for (const d of nearest) capture(d, i, p, Math.hypot(d.x - p.x, d.y - p.y));
  }
}

function release(d: Dust, planet: Planet | null): void {
  // Tangential ejection (matching the orbit direction) plus a gentle outward
  // push so the particle clears the gravity well before cooldown ends.
  const tangent = d.orbitAngle + (Math.PI / 2) * Math.sign(d.orbitSpeed || 1);
  const speed = 14 + Math.random() * 14;
  const nx = planet && d.orbitRadius ? (d.x - planet.x) / d.orbitRadius : 0;
  const ny = planet && d.orbitRadius ? (d.y - planet.y) / d.orbitRadius : 0;

  d.vx = Math.cos(tangent) * speed + nx * 12;
  d.vy = Math.sin(tangent) * speed + ny * 12;
  d.capturedBy = -1;
  d.cooldown = RELEASE_COOLDOWN;
}
