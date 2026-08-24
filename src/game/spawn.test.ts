import { describe, expect, it } from 'vitest';
import { NAV_PLANETS } from '../data/content';
import { SHIP_RADIUS } from './physics';
import { mulberry32, planetRadius, spawnPlanets } from './spawn';
import type { Viewport } from './types';

const viewports: Viewport[] = [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];

describe('spawnPlanets', () => {
  it('places planets legally across many seeds and viewports', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const vp of viewports) {
        const planets = spawnPlanets([...NAV_PLANETS], vp, false, seed);
        expect(planets).toHaveLength(NAV_PLANETS.length);

        for (const p of planets) {
          expect(p.x).toBeGreaterThanOrEqual(p.radius);
          expect(p.x).toBeLessThanOrEqual(vp.width - p.radius);
          expect(p.y).toBeGreaterThanOrEqual(p.radius);
          expect(p.y).toBeLessThanOrEqual(vp.height - p.radius);
          expect(Math.hypot(p.x - vp.width / 2, p.y - vp.height / 2)).toBeGreaterThanOrEqual(
            p.radius + SHIP_RADIUS + 48,
          );
        }

        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const a = planets[i];
            const b = planets[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            expect(d).toBeGreaterThanOrEqual(a.radius + b.radius + 28);
          }
        }
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = spawnPlanets([...NAV_PLANETS], viewports[0], false, 7);
    const b = spawnPlanets([...NAV_PLANETS], viewports[0], false, 7);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('planets are born bare — rings come from captured dust', () => {
    const planets = spawnPlanets([...NAV_PLANETS], viewports[0], false, 3);
    expect(planets.every((p) => !('ringParticles' in p))).toBe(true);
  });

  it('carries def content onto the planet', () => {
    const [planet] = spawnPlanets([{ id: 'x', label: 'Hello World', color: '#FFFFFF' }], viewports[0], false, 1);
    expect(planet.defId).toBe('x');
    expect(planet.label).toBe('Hello World');
    expect(planet.color).toBe('#FFFFFF');
    expect(planet.flash).toBe(0);
  });

  it('different seeds give different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});

describe('planetRadius', () => {
  it('grows with label length on desktop and mobile', () => {
    expect(planetRadius('Back', false)).toBeLessThan(planetRadius('Find Your Flick', false));
    expect(planetRadius('Back', true)).toBeLessThan(planetRadius('Find Your Flick', true));
  });

  it('mobile radii are smaller than desktop', () => {
    expect(planetRadius('Projects', true)).toBeLessThan(planetRadius('Projects', false));
  });
});
