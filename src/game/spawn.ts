import { SHIP_RADIUS } from './physics';
import type { Planet, PlanetDef, RingParticle, Viewport } from './types';

/** Small, fast, seedable PRNG — deterministic layouts for tests and stable decoration. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIN_GAP = 28; // extra clearance between planet edges
const SHIP_CLEARANCE = 48; // extra clearance around the spacecraft
const MAX_SHRINK_STEPS = 10;
const SHRINK_FACTOR = 0.88;

/** Planet size scales with label length so text always fits inside the disc. */
export function planetRadius(label: string, mobile: boolean): number {
  const base = mobile ? 44 : 68;
  const perChar = mobile ? 1.4 : 2.6;
  return Math.max(base, base + label.length * perChar);
}

function decorate(rng: () => number): Pick<Planet, 'ringParticles'> {
  const ringParticles: RingParticle[] = [];
  if (rng() < 0.55) {
    const count = 10 + Math.floor(rng() * 7); // 10..16
    for (let i = 0; i < count; i++) {
      ringParticles.push({
        angle: (i / count) * Math.PI * 2 + rng() * 0.6,
        speed: 0.35 + rng() * 0.55, // same direction, varied pace
        size: 1.2 + rng() * 1.6,
        alpha: 0.35 + rng() * 0.5,
        lift: 7 + rng() * 13,
        phase: rng() * Math.PI * 2,
      });
    }
  }
  return { ringParticles };
}

/**
 * Place every def on the field. Candidates come from a jittered grid scanned
 * in rng order (far better coverage than blind uniform sampling), and if a
 * layout cannot fit, every planet shrinks a step and we try again — so the
 * result is always overlap-free and inside bounds. Deterministic per seed.
 */
export function spawnPlanets(
  defs: PlanetDef[],
  viewport: Viewport,
  mobile: boolean,
  seed?: number,
): Planet[] {
  const rng = mulberry32(seed ?? (Date.now() ^ (Math.random() * 0xffffffff)));

  let scale = 1;
  for (let step = 0; step <= MAX_SHRINK_STEPS; step++, scale *= SHRINK_FACTOR) {
    const layout = tryLayout(defs, viewport, mobile, scale, rng);
    if (layout) return layout;
  }

  // Geometry refused everything; place along the bottom as a last resort.
  return bottomLine(defs, viewport, mobile, rng);
}

/** One full placement pass at a given scale; returns null if any def fails. */
function tryLayout(
  defs: PlanetDef[],
  vp: Viewport,
  mobile: boolean,
  scale: number,
  rng: () => number,
): Planet[] | null {
  const placed: Planet[] = [];

  for (const def of defs) {
    const radius = planetRadius(def.label, mobile) * scale;
    const spot = findSpot(radius, vp, placed, rng);
    if (!spot) return null;

    const { ringParticles } = decorate(rng);
    placed.push(toPlanet(def, spot.x, spot.y, radius, mobile, ringParticles, rng()));
  }
  return placed;
}

/** Jittered-grid candidates in rng order; first one that fits wins. */
function findSpot(
  radius: number,
  vp: Viewport,
  others: Planet[],
  rng: () => number,
): { x: number; y: number } | null {
  const cell = radius * 2 + MIN_GAP;
  const cols = Math.floor(vp.width / cell);
  const rows = Math.floor(vp.height / cell);
  if (cols < 1 || rows < 1) return null;

  const candidates: Array<{ x: number; y: number }> = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      candidates.push({
        x: radius + c * cell + rng() * MIN_GAP,
        y: radius + r * cell + rng() * MIN_GAP,
      });
    }
  }

  // Deterministic Fisher-Yates driven by the same rng.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.find((p) => fits(p.x, p.y, radius, vp, others)) ?? null;
}

function fits(x: number, y: number, radius: number, vp: Viewport, others: Planet[]): boolean {
  if (x - radius < 0 || x + radius > vp.width) return false;
  if (y - radius < 0 || y + radius > vp.height) return false;

  const cx = vp.width / 2;
  const cy = vp.height / 2;
  if (Math.hypot(x - cx, y - cy) < radius + SHIP_RADIUS + SHIP_CLEARANCE) return false;

  return others.every((o) => Math.hypot(x - o.x, y - o.y) >= radius + o.radius + MIN_GAP);
}

function bottomLine(
  defs: PlanetDef[],
  vp: Viewport,
  mobile: boolean,
  rng: () => number,
): Planet[] {
  const placed: Planet[] = [];
  const slots = Math.max(defs.length, 2);

  defs.forEach((def, index) => {
    const radius = planetRadius(def.label, mobile);
    const { ringParticles } = decorate(rng);
    const step = (vp.width - radius * 2) / slots;
    const x = radius + step * index;
    const y = vp.height - radius - 8;
    placed.push(toPlanet(def, x, y, radius, mobile, ringParticles, rng()));
  });
  return placed;
}

function toPlanet(
  def: PlanetDef,
  x: number,
  y: number,
  radius: number,
  mobile: boolean,
  ringParticles: RingParticle[],
  seed: number,
): Planet {
  const angle = seed * Math.PI * 2;
  const speed = mobile ? 0.35 : 0.55;
  return {
    defId: def.id,
    label: def.label,
    color: def.color,
    url: def.url,
    x,
    y,
    radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    ringParticles,
    flash: 0,
    seed,
  };
}
