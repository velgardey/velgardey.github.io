import { firstImpact } from './ballistics';
import type { Beam, Bullet, Dust, Particle, Planet, Ring, Vec2, Viewport } from './types';

export interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  layer: 0 | 1 | 2;
  phase: number;
  color: string;
}

const STAR_TINTS = ['#DFE9FF', '#DFE9FF', '#DFE9FF', '#9BE8DC', '#B4BCFF'];

export interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  verts: Array<{ x: number; y: number }>;
}

const STAR_LAYER_PARALLAX = [0.006, 0.014, 0.026];

/** Hex like '#RRGGBB' → 'r,g,b' triple for rgba() composition. */
function rgbOf(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** 'r,g,b' triple with each channel brightened by `amt` (clamped). */
function lighten(rgb: string, amt: number): string {
  return rgb
    .split(',')
    .map((c) => Math.min(255, Number(c) + amt))
    .join(',');
}

export function makeStars(vp: Viewport, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const layer = (i % 3) as 0 | 1 | 2;
    stars.push({
      x: Math.random() * vp.width,
      y: Math.random() * vp.height,
      r:
        layer === 2
          ? 1.4 + Math.random() * 0.9
          : layer === 1
            ? 0.9 + Math.random() * 0.7
            : 0.5 + Math.random() * 0.5,
      alpha: 0.25 + Math.random() * 0.6,
      layer,
      phase: Math.random() * Math.PI * 2,
      color: STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)],
    });
  }
  return stars;
}

export function makeDust(vp: Viewport, count: number): Dust[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * vp.width,
    y: Math.random() * vp.height,
    vx: (Math.random() - 0.5) * 30,
    vy: (Math.random() - 0.5) * 30,
    size: 1 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
    capturedBy: -1,
    orbitAngle: 0,
    orbitRadius: 0,
    orbitSpeed: 0,
    releaseIn: 0,
    cooldown: 0,
  }));
}

export function makeAsteroids(vp: Viewport, count: number): Asteroid[] {
  const asteroids: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    const verts = Array.from({ length: 7 }, (_, k) => {
      const angle = (k / 7) * Math.PI * 2;
      const r = 5 + Math.random() * 9;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    asteroids.push({
      x: Math.random() * vp.width,
      y: Math.random() * vp.height,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4,
      verts,
    });
  }
  return asteroids;
}

const NEBULAE = [
  { x: 0.22, y: 0.28, r: 0.42, rgb: '94,234,212', a: 0.035 },
  { x: 0.75, y: 0.18, r: 0.36, rgb: '139,147,248', a: 0.05 },
  { x: 0.62, y: 0.72, r: 0.48, rgb: '240,171,252', a: 0.028 },
  { x: 0.15, y: 0.78, r: 0.34, rgb: '56,120,255', a: 0.04 },
  { x: 0.45, y: 0.45, r: 0.55, rgb: '99,102,241', a: 0.03 },
];

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  stars: Star[],
  asteroids: Asteroid[],
  time: number,
  aim: Vec2,
  reducedMotion: boolean,
  warp = 0,
): void {
  const bg = ctx.createLinearGradient(0, 0, 0, vp.height);
  bg.addColorStop(0, '#04060f');
  bg.addColorStop(0.55, '#0a0f22');
  bg.addColorStop(1, '#131a33');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, vp.width, vp.height);

  // Drifting nebula clouds, breathing slowly.
  for (const n of NEBULAE) {
    const drift = reducedMotion ? 0 : Math.sin(time * 0.00008 + n.x * 9) * 24;
    const breathe = reducedMotion ? 1 : 1 + 0.18 * Math.sin(time * 0.0002 + n.y * 11);
    const x = n.x * vp.width + drift;
    const y = n.y * vp.height + drift * 0.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, n.r * Math.min(vp.width, vp.height));
    g.addColorStop(0, `rgba(${n.rgb},${n.a * breathe})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, vp.width, vp.height);
  }

  // Parallax starfield; layers drift toward the aim point and twinkle.
  const ax = aim.x - vp.width / 2;
  const ay = aim.y - vp.height / 2;
  for (const s of stars) {
    const px = reducedMotion ? 0 : ax * STAR_LAYER_PARALLAX[s.layer];
    const py = reducedMotion ? 0 : ay * STAR_LAYER_PARALLAX[s.layer];
    let x = s.x + px;
    let y = s.y + py;
    if (x < 0) x += vp.width;
    if (x > vp.width) x -= vp.width;
    if (y < 0) y += vp.height;
    if (y > vp.height) y -= vp.height;

    const twinkle = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(time * 0.0005 + s.phase);

    // Warp streaks: during a jump, stars stretch radially away from centre.
    if (warp > 0.02) {
      const cx = vp.width / 2;
      const cy = vp.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const len = warp * (8 + s.layer * 14) * Math.min(1, dist / 220);
      ctx.globalAlpha = s.alpha * twinkle * (0.5 + warp * 0.5);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.r * 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (dx / dist) * len, y + (dy / dist) * len);
      ctx.stroke();
      continue;
    }

    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Rogue asteroids, decorative only.
  ctx.strokeStyle = 'rgba(150,160,190,0.35)';
  ctx.lineWidth = 1.2;
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.beginPath();
    ctx.moveTo(a.verts[0].x, a.verts[0].y);
    for (const v of a.verts.slice(1)) ctx.lineTo(v.x, v.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

/** Lock-on tracer fired at a focused planet. */
export function drawBeams(ctx: CanvasRenderingContext2D, beams: Beam[]): void {
  for (const b of beams) {
    ctx.globalAlpha = Math.max(0, b.life / b.maxLife);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

/**
 * Tactical aim guide: dotted ray to the first planet in the path. Solid dot =
 * core (kill) shot, hollow ring = graze (shove) shot.
 */
export function drawAimGuide(
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  to: Vec2,
  planets: Planet[],
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const dir = { x: dx / len, y: dy / len };

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#9BE8DC';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 8]);
  ctx.beginPath();
  ctx.moveTo(from.x + dir.x * 34, from.y + dir.y * 34);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const impact = firstImpact(from, dir, planets);
  if (impact) {
    const cx = from.x + dir.x * impact.t;
    const cy = from.y + dir.y * impact.t;
    if (impact.core) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#7DF9FF';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Ambient dust: dim, slow-twinkling; captured grains tint toward their planet. */
export function drawDust(
  ctx: CanvasRenderingContext2D,
  dust: Dust[],
  planets: Planet[],
  time: number,
): void {
  for (const d of dust) {
    // Slow twinkle across the whole field.
    const twinkle = 0.55 + 0.45 * Math.sin(time * 0.0006 + d.phase);
    const captured = d.capturedBy >= 0;
    const tint = captured && planets[d.capturedBy] ? planets[d.capturedBy].color : '#BFD5FF';
    ctx.globalAlpha = (captured ? 0.55 : 0.32) * twinkle;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size + (captured ? 0.4 : 0), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function advanceAsteroids(asteroids: Asteroid[], dt: number, vp: Viewport): void {
  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.rot += a.vr * dt;
    if (a.x < -20) a.x = vp.width + 20;
    if (a.x > vp.width + 20) a.x = -20;
    if (a.y < -20) a.y = vp.height + 20;
    if (a.y > vp.height + 20) a.y = -20;
  }
}

/** Back-eased overshoot for the warp-in arrival. */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  p: Planet,
  hovered: boolean,
  focused: boolean,
  time: number,
  center: Vec2,
): void {
  const rgb = rgbOf(p.color);
  const arriving = p.spawnT < 1;
  const scale = arriving ? Math.max(0.001, easeOutBack(Math.max(0, p.spawnT))) : 1;
  const radius = p.radius * scale;

  // Arrival streak: a light trail pointing home while the planet materialises.
  if (arriving) {
    const strength = 1 - p.spawnT;
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    const dist = Math.hypot(dx, dy) || 1;
    const g = ctx.createLinearGradient(p.x, p.y, p.x - (dx / dist) * 130, p.y - (dy / dist) * 130);
    g.addColorStop(0, `rgba(${rgb},${0.5 * strength})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = p.radius * 0.5 * strength + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - (dx / dist) * 130, p.y - (dy / dist) * 130);
    ctx.stroke();
  }

  ctx.save();
  ctx.shadowColor = `rgba(${rgb},0.9)`;
  ctx.shadowBlur = hovered ? 34 : 16;

  const g = ctx.createRadialGradient(
    p.x - radius * 0.3,
    p.y - radius * 0.3,
    radius * 0.1,
    p.x,
    p.y,
    radius,
  );
  g.addColorStop(0, `rgba(${lighten(rgb, 46)},1)`);
  g.addColorStop(1, `rgba(${rgb},0.88)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Stroke on top for crispness.
  ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.65)';
  ctx.lineWidth = hovered ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  drawLabel(ctx, p, radius);

  if (p.flash > 0) {
    ctx.globalAlpha = Math.min(1, p.flash / 0.35) * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (focused) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.lineDashOffset = -time * 0.02;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLabel(ctx: CanvasRenderingContext2D, p: Planet, radius: number): void {
  const words = p.label.split(' ');
  const fontSize = Math.max(11, Math.min(17, radius / 4));
  ctx.font = `700 ${fontSize}px "Space Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;

  const startY = p.y - ((words.length - 1) * fontSize) / 2;
  words.forEach((word, i) => {
    ctx.fillText(word, p.x, startY + i * fontSize);
  });
  ctx.shadowBlur = 0;
}

export function drawShip(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  angle: number,
  muzzle: number,
  time: number,
): void {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  // Muzzle flash at the nose.
  if (muzzle > 0) {
    ctx.globalAlpha = muzzle / 0.09;
    const g = ctx.createRadialGradient(30, 0, 2, 30, 0, 42);
    g.addColorStop(0, 'rgba(214,250,255,0.95)');
    g.addColorStop(1, 'rgba(94,234,212,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(30, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Engine exhaust: flickering aurora plume behind the hull.
  const flicker = 0.72 + 0.18 * Math.sin(time * 0.02) + 0.1 * Math.sin(time * 0.047);
  ctx.globalCompositeOperation = 'lighter';
  const exhaust = ctx.createRadialGradient(-18, 0, 1, -18, 0, 26 * flicker);
  exhaust.addColorStop(0, 'rgba(125,249,255,0.85)');
  exhaust.addColorStop(0.45, 'rgba(94,234,212,0.35)');
  exhaust.addColorStop(1, 'rgba(139,147,248,0)');
  ctx.fillStyle = exhaust;
  ctx.beginPath();
  ctx.arc(-18, 0, 26 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // Hull: layered dart with a notched tail.
  ctx.shadowColor = 'rgba(94,234,212,0.55)';
  ctx.shadowBlur = 14;
  const hull = ctx.createLinearGradient(0, -12, 0, 12);
  hull.addColorStop(0, '#243258');
  hull.addColorStop(0.5, '#141E3C');
  hull.addColorStop(1, '#0C1329');
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(28, 0); // nose
  ctx.lineTo(-10, 11); // starboard wing
  ctx.lineTo(-6, 0); // tail notch
  ctx.lineTo(-10, -11); // port wing
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Aurora edge: teal -> violet along the hull.
  const edge = ctx.createLinearGradient(-10, -11, 28, 0);
  edge.addColorStop(0, '#8B93F8');
  edge.addColorStop(1, '#5EEAD4');
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Spine highlight.
  ctx.strokeStyle = 'rgba(233,238,251,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-5, 0);
  ctx.stroke();

  // Wing-tip accents.
  ctx.strokeStyle = 'rgba(94,234,212,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 8);
  ctx.lineTo(-9, 10);
  ctx.moveTo(-4, -8);
  ctx.lineTo(-9, -10);
  ctx.stroke();

  // Cockpit glow.
  ctx.shadowColor = 'rgba(125,249,255,0.9)';
  ctx.shadowBlur = 9;
  ctx.fillStyle = '#7DF9FF';
  ctx.beginPath();
  ctx.ellipse(9, 0, 4.5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

export function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]): void {
  for (const b of bullets) {
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / speed) * 18;
    const ty = b.y - (b.vy / speed) * 18;

    const g = ctx.createLinearGradient(tx, ty, b.x, b.y);
    g.addColorStop(0, 'rgba(0,255,255,0)');
    g.addColorStop(1, 'rgba(120,240,255,0.95)');

    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,255,255,0.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawRings(ctx: CanvasRenderingContext2D, rings: Ring[]): void {
  for (const r of rings) {
    ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Full-screen colour wipe used during page transitions. `progress` runs 0..1;
 * radius covers the whole viewport diagonal at 1.
 */
export function drawWipe(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  center: Vec2,
  progress: number,
  color: string,
): void {
  const maxR = Math.hypot(
    Math.max(center.x, vp.width - center.x),
    Math.max(center.y, vp.height - center.y),
  );
  ctx.fillStyle = color;
  ctx.globalAlpha = progress < 0.85 ? 1 : (1 - progress) / 0.15;
  ctx.beginPath();
  ctx.arc(center.x, center.y, maxR * progress, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
