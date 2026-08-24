import { AudioManager } from './audio';
import { Shake, burst, spawnRing, updateParticles, updateRings } from './effects';
import { attachInput, type Command, type GameInput } from './input';
import {
  SHIP_RADIUS,
  bounceOff,
  clampSpeed,
  elasticCollide,
  integrate,
  wallBounce,
} from './physics';
import {
  advanceAsteroids,
  drawBackground,
  drawBullets,
  drawParticles,
  drawPlanet,
  drawRings,
  drawShip,
  drawWipe,
  makeAsteroids,
  makeStars,
  type Asteroid,
  type Star,
} from './render';
import { spawnPlanets } from './spawn';
import type { Bullet, Planet, PlanetDef, Particle, Ring, Vec2, Viewport } from './types';

const BULLET_SPEED = 900; // px/s
const MAX_DT = 0.05;
const DESKTOP_TARGET_SPEED = 0.55;
const MOBILE_TARGET_SPEED = 0.75;

export interface EngineHooks {
  onHover(planet: Planet | null, x: number, y: number): void;
  onPlanetHit(planet: Planet): void;
  /** Non-audio commands ('help', navigation digits) belong to the app layer. */
  onUiCommand?(cmd: Command): void;
  /** Escape pressed outside of any modal. */
  onCancel?(): void;
}

interface WipeState {
  center: Vec2;
  color: string;
  progress: number;
  done: () => void;
}

/**
 * Owns the canvas, the rAF loop and every entity. React never sees game state
 * per frame — it only receives hover/hit events and issues commands.
 */
export class GameEngine {
  readonly audio = new AudioManager();

  private ctx: CanvasRenderingContext2D;
  private vp: Viewport = { width: 0, height: 0 };
  private dpr = 1;

  private planets: Planet[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private stars: Star[] = [];
  private asteroids: Asteroid[] = [];

  private aim: Vec2 = { x: 0, y: 0 };
  private shipAngle = -Math.PI / 2;
  private muzzle = 0;
  private hovered: Planet | null = null;
  private focusedIndex = -1;
  private shake = new Shake();
  private wipe: WipeState | null = null;

  private lastFrame = 0;
  private rafId: number | null = null;
  private bulletId = 0;
  private paused = false;
  private reducedMotion = false;
  private mobile = false;
  private detachInput: (() => void) | null = null;

  private canvas: HTMLCanvasElement;
  private hooks: EngineHooks;

  constructor(canvas: HTMLCanvasElement, hooks: EngineHooks) {
    this.canvas = canvas;
    this.hooks = hooks;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
  }

  start(): void {
    this.resize();
    this.detachInput = attachInput(this.canvas, this.makeInputHandlers());
    this.lastFrame = performance.now();
    const loop = (t: number) => {
      this.frame(t);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.detachInput?.();
    this.audio.destroy();
  }

  // ---- commands -----------------------------------------------------------

  setPlanets(defs: PlanetDef[]): void {
    this.planets = spawnPlanets(defs, this.vp, this.mobile);
    this.focusedIndex = -1;
    this.setHovered(null, this.aim.x, this.aim.y);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  resize(): void {
    this.vp = { width: window.innerWidth, height: window.innerHeight };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.vp.width * this.dpr;
    this.canvas.height = this.vp.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.stars = makeStars(this.vp, this.mobile ? 150 : 300);
    this.asteroids = makeAsteroids(this.vp, 5);
  }

  shootAt(x: number, y: number): void {
    if (this.paused) return;
    const dx = x - this.vp.width / 2;
    const dy = y - this.vp.height / 2;
    const angle = Math.atan2(dy, dx);
    this.shipAngle = angle;
    this.muzzle = 0.09;
    this.shake.kick(0.06);
    this.audio.shoot();

    this.bullets.push({
      id: this.bulletId++,
      x: this.vp.width / 2 + Math.cos(angle) * SHIP_RADIUS,
      y: this.vp.height / 2 + Math.sin(angle) * SHIP_RADIUS,
      vx: Math.cos(angle) * BULLET_SPEED,
      vy: Math.sin(angle) * BULLET_SPEED,
    });
  }

  focusNext(): void {
    if (this.paused || this.planets.length === 0) return;
    this.focusedIndex = (this.focusedIndex + 1) % this.planets.length;
  }

  activateFocus(): void {
    if (this.paused || this.focusedIndex < 0) return;
    const planet = this.planets[this.focusedIndex];
    if (planet) this.shootAt(planet.x, planet.y);
  }

  /** Full-screen colour wipe toward `done`; used for page transitions. */
  beginWipe(center: Vec2, color: string, done: () => void): void {
    this.wipe = { center: { ...center }, color, progress: 0, done };
    this.audio.explosion();
    burst(this.particles, center.x, center.y, color, 60, 6);
    spawnRing(this.rings, center.x, center.y, color, Math.max(this.vp.width, this.vp.height) * 0.4);
    this.shake.kick(0.5);
  }

  handleCommand(cmd: Command): void {
    if (cmd === 'mute') {
      this.audio.toggleMute();
      return;
    }
    this.hooks.onUiCommand?.(cmd);
  }

  get isMobile(): boolean {
    return this.mobile;
  }

  setMobile(mobile: boolean): void {
    if (this.mobile === mobile) return;
    this.mobile = mobile;
    this.resize();
    this.setPlanets(this.planets.map((p) => ({ id: p.defId, label: p.label, color: p.color, url: p.url })));
  }

  // ---- internals ----------------------------------------------------------

  private makeInputHandlers(): GameInput {
    return {
      onPointerMove: (x, y) => {
        this.aim = { x, y };
        if (!this.mobile) this.shipAngle = Math.atan2(y - this.vp.height / 2, x - this.vp.width / 2);
      },
      onShoot: (x, y) => {
        void this.audio.init(); // first gesture also unlocks audio
        this.shootAt(x, y);
      },
      onDragMove: (x, y) => {
        this.aim = { x, y };
        this.shipAngle = Math.atan2(y - this.vp.height / 2, x - this.vp.width / 2);
      },
      onFocusNext: () => this.focusNext(),
      onActivate: () => {
        void this.audio.init();
        this.activateFocus();
      },
      onCancel: () => {
        this.focusedIndex = -1;
        this.hooks.onCancel?.();
      },
      onCommand: (cmd) => this.handleCommand(cmd),
    };
  }

  private frame(t: number): void {
    const dt = Math.min((t - this.lastFrame) / 1000, MAX_DT);
    this.lastFrame = t;

    if (!this.paused && !this.wipe) this.update(dt);
    else updateParticles(this.particles, dt); // keep debris settling during pauses

    this.render(t);
  }

  private update(dt: number): void {
    const cx = this.vp.width / 2;
    const cy = this.vp.height / 2;
    const targetSpeed = this.mobile ? MOBILE_TARGET_SPEED : DESKTOP_TARGET_SPEED;

    for (const p of this.planets) {
      integrate(p, dt);
      wallBounce(p, this.vp.width, this.vp.height);
      bounceOff(p, cx, cy, SHIP_RADIUS);
      clampSpeed(p, targetSpeed);
      p.flash = Math.max(0, p.flash - dt);
      for (const m of p.moons) m.angle += m.speed * dt;
    }
    for (let i = 0; i < this.planets.length; i++) {
      for (let j = i + 1; j < this.planets.length; j++) {
        elasticCollide(this.planets[i], this.planets[j]);
      }
    }

    this.updateBullets(dt);

    advanceAsteroids(this.asteroids, dt, this.vp);
    updateParticles(this.particles, dt);
    updateRings(this.rings, dt);
    this.shake.update(dt);
    this.muzzle = Math.max(0, this.muzzle - dt);

    if (this.wipe) {
      this.wipe.progress += dt * 2.2;
      if (this.wipe.progress >= 1) {
        const done = this.wipe.done;
        this.wipe = null;
        done();
      }
    }

    this.updateHover();
  }

  private updateBullets(dt: number): void {
    outer: for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      for (const planet of this.planets) {
        if (Math.hypot(b.x - planet.x, b.y - planet.y) < planet.radius) {
          this.registerHit(planet, b.x, b.y);
          this.bullets.splice(i, 1);
          continue outer;
        }
      }

      const offscreen =
        b.x < -40 || b.x > this.vp.width + 40 || b.y < -40 || b.y > this.vp.height + 40;
      if (offscreen) this.bullets.splice(i, 1);
    }
  }

  private registerHit(planet: Planet, x: number, y: number): void {
    planet.flash = 0.35;
    burst(this.particles, x, y, planet.color, 14, 4);
    spawnRing(this.rings, x, y, planet.color, planet.radius * 1.8);
    this.shake.kick(0.15);
    this.hooks.onPlanetHit(planet);
  }

  private updateHover(): void {
    let found: Planet | null = null;
    for (let i = this.planets.length - 1; i >= 0; i--) {
      const p = this.planets[i];
      if (Math.hypot(this.aim.x - p.x, this.aim.y - p.y) <= p.radius) {
        found = p;
        break;
      }
    }
    this.focusedIndex = Math.min(this.focusedIndex, this.planets.length - 1);
    this.setHovered(found, this.aim.x, this.aim.y);
  }

  private setHovered(planet: Planet | null, x: number, y: number): void {
    if (planet === this.hovered) return;
    this.hovered = planet;
    this.hooks.onHover(planet, x, y);
  }

  private render(t: number): void {
    const { ctx } = this;
    drawBackground(ctx, this.vp, this.stars, this.asteroids, t, this.aim, this.reducedMotion);

    ctx.save();
    if (!this.reducedMotion) {
      const off = this.shake.offset();
      ctx.translate(off.x, off.y);
    }

    for (const p of this.planets) {
      drawPlanet(ctx, p, p === this.hovered, this.planets.indexOf(p) === this.focusedIndex, t);
    }
    drawRings(ctx, this.rings);
    drawBullets(ctx, this.bullets);
    drawParticles(ctx, this.particles);
    drawShip(ctx, { x: this.vp.width / 2, y: this.vp.height / 2 }, this.shipAngle, this.muzzle);

    ctx.restore();

    if (this.wipe) {
      drawWipe(ctx, this.vp, this.wipe.center, this.wipe.progress, this.wipe.color);
    }
  }
}
