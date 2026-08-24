import type { Bullet, Particle, Planet, Ring, Vec2, Viewport } from './types';

export interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  layer: 0 | 1 | 2;
  phase: number;
}

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
      r: layer === 2 ? 1.4 + Math.random() * 0.9 : layer === 1 ? 0.9 + Math.random() * 0.7 : 0.5 + Math.random() * 0.5,
      alpha: 0.25 + Math.random() * 0.6,
      layer,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
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
  { x: 0.22, y: 0.28, r: 0.42, rgb: '90,60,180', a: 0.05 },
  { x: 0.75, y: 0.18, r: 0.36, rgb: '30,120,200', a: 0.06 },
  { x: 0.62, y: 0.72, r: 0.48, rgb: '160,40,120', a: 0.04 },
  { x: 0.15, y: 0.78, r: 0.34, rgb: '20,140,140', a: 0.045 },
  { x: 0.45, y: 0.45, r: 0.55, rgb: '70,70,160', a: 0.03 },
];

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  stars: Star[],
  asteroids: Asteroid[],
  time: number,
  aim: Vec2,
  reducedMotion: boolean,
): void {
  const bg = ctx.createLinearGradient(0, 0, 0, vp.height);
  bg.addColorStop(0, '#05050a');
  bg.addColorStop(0.6, '#0b1020');
  bg.addColorStop(1, '#131a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, vp.width, vp.height);

  // Drifting nebula clouds.
  for (const n of NEBULAE) {
    const drift = reducedMotion ? 0 : Math.sin(time * 0.00008 + n.x * 9) * 24;
    const x = n.x * vp.width + drift;
    const y = n.y * vp.height + drift * 0.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, n.r * Math.min(vp.width, vp.height));
    g.addColorStop(0, `rgba(${n.rgb},${n.a})`);
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

    const twinkle = reducedMotion ? 1 : 0.7 + 0.3 * Math.sin(time * 0.001 + s.phase);
    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = '#dfe9ff';
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

export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  p: Planet,
  hovered: boolean,
  focused: boolean,
  time: number,
): void {
  const rgb = rgbOf(p.color);

  ctx.save();
  ctx.shadowColor = `rgba(${rgb},0.9)`;
  ctx.shadowBlur = hovered ? 34 : 16;

  const g = ctx.createRadialGradient(
    p.x - p.radius * 0.3,
    p.y - p.radius * 0.3,
    p.radius * 0.1,
    p.x,
    p.y,
    p.radius,
  );
  g.addColorStop(0, `rgba(${lighten(rgb, 46)},1)`);
  g.addColorStop(1, `rgba(${rgb},0.88)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ring behind label work happens above; stroke on top for crispness.
  ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(255,255,255,0.65)';
  ctx.lineWidth = hovered ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.stroke();

  if (p.hasRing) {
    ctx.strokeStyle = `rgba(${rgb},0.7)`;
    ctx.lineWidth = 3;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.45);
    ctx.scale(1, 0.32);
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const m of p.moons) {
    const mx = p.x + Math.cos(m.angle + time * 0.001 * m.speed) * m.distance;
    const my = p.y + Math.sin(m.angle + time * 0.001 * m.speed) * m.distance;
    ctx.fillStyle = 'rgba(220,228,255,0.85)';
    ctx.beginPath();
    ctx.arc(mx, my, m.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLabel(ctx, p);

  if (p.flash > 0) {
    ctx.globalAlpha = Math.min(1, p.flash / 0.35) * 0.85;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (focused) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.lineDashOffset = -time * 0.02;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawLabel(ctx: CanvasRenderingContext2D, p: Planet): void {
  const words = p.label.split(' ');
  const fontSize = Math.max(11, Math.min(17, p.radius / 4));
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
): void {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);

  if (muzzle > 0) {
    ctx.globalAlpha = muzzle / 0.09;
    const flashLen = 46;
    const g = ctx.createRadialGradient(24, 0, 2, 24, 0, flashLen);
    g.addColorStop(0, 'rgba(255,240,180,0.95)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(24, 0, flashLen, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.shadowColor = 'rgba(243,91,4,0.9)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#f35b04';
  ctx.beginPath();
  ctx.moveTo(-22, -16);
  ctx.lineTo(24, 0);
  ctx.lineTo(-22, 16);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(-4, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(-4, 10);
  ctx.stroke();

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
  const maxR = Math.hypot(Math.max(center.x, vp.width - center.x), Math.max(center.y, vp.height - center.y));
  ctx.fillStyle = color;
  ctx.globalAlpha = progress < 0.85 ? 1 : (1 - progress) / 0.15;
  ctx.beginPath();
  ctx.arc(center.x, center.y, maxR * progress, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
