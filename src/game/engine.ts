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
  drawAimGuide,
  drawBackground,
  drawBeams,
  drawBullets,
  drawDust,
  drawParticles,
  drawPlanet,
  drawRings,
  drawShip,
  drawWipe,
  makeAsteroids,
  makeDust,
  makeStars,
  type Asteroid,
  type Star,
} from './render';
import { applyGrazeImpulse, firstImpact } from './ballistics';
import { seedCaptures, stepDust } from './gravity';
import { spawnPlanets } from './spawn';
import type {
  Beam,
  Bullet,
  Dust,
  Planet,
  PlanetDef,
  Particle,
  Ring,
  Vec2,
  Viewport,
} from './types';

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
  /** Seconds to hold before the wipe paints — lets the ripple land first. */
  delay: number;
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

  private planets: Planet[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private rings: Ring[] = [];
  private stars: Star[] = [];
  private asteroids: Asteroid[] = [];
  private dust: Dust[] = [];
  private beams: Beam[] = [];

  private aim: Vec2 = { x: 0, y: 0 };
  private shipAngle = -Math.PI / 2;
  private muzzle = 0;
  private hovered: Planet | null = null;
  private focusedIndex = -1;
  private shake = new Shake();
  private wipe: WipeState | null = null;

  private lastFrame = 0;
  private rafId: number | null = null;
  /** Blocks player intents (shooting/focusing) without freezing the world. */
  private locked = false;
  private reducedMotion = false;
  /** Seconds of slow-motion remaining after a kill (game juice). */
  private hitStop = 0;
  /** 0..1, eased toward 1 while a wipe runs — drives the star-warp streaks. */
  private warp = 0;
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
    if (import.meta.env.DEV) {
      // Test hook: lets tooling aim at real planet positions.
      (
        window as unknown as { __spacePlanets: () => Array<{ x: number; y: number; r: number }> }
      ).__spacePlanets = () => this.planets.map((p) => ({ x: p.x, y: p.y, r: p.radius }));
    }
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
    this.planets.forEach((p, i) => {
      p.spawnT = -i * 0.14; // staggered warp-in
    });
    seedCaptures(this.dust, this.planets, this.mobile ? 2 : 3);
    this.focusedIndex = -1;
    this.setHovered(null, this.aim.x, this.aim.y);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setLocked(locked: boolean): void {
    this.locked = locked;
  }

  resize(): void {
    this.vp = { width: window.innerWidth, height: window.innerHeight };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.vp.width * dpr;
    this.canvas.height = this.vp.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.stars = makeStars(this.vp, this.mobile ? 150 : 300);
    this.asteroids = makeAsteroids(this.vp, 5);
    this.dust = makeDust(this.vp, this.mobile ? 45 : 90);
  }

  shootAt(x: number, y: number): void {
    if (this.locked || this.wipe) return;
    const dx = x - this.vp.width / 2;
    const dy = y - this.vp.height / 2;
    const angle = Math.atan2(dy, dx);
    this.shipAngle = angle;
    this.muzzle = 0.09;
    this.shake.kick(0.06);
    this.audio.shoot();

    this.bullets.push({
      x: this.vp.width / 2 + Math.cos(angle) * SHIP_RADIUS,
      y: this.vp.height / 2 + Math.sin(angle) * SHIP_RADIUS,
      vx: Math.cos(angle) * BULLET_SPEED,
      vy: Math.sin(angle) * BULLET_SPEED,
    });
  }

  focusNext(): void {
    if (this.locked || this.wipe || this.planets.length === 0) return;
    this.focusedIndex = (this.focusedIndex + 1) % this.planets.length;
  }

  activateFocus(): void {
    if (this.locked || this.wipe || this.focusedIndex < 0) return;
    const planet = this.planets[this.focusedIndex];
    if (!planet) return;

    const from = { x: this.vp.width / 2, y: this.vp.height / 2 };
    this.shipAngle = Math.atan2(planet.y - from.y, planet.x - from.x);
    this.muzzle = 0.09;
    this.beams.push({
      x1: from.x,
      y1: from.y,
      x2: planet.x,
      y2: planet.y,
      life: 0.16,
      maxLife: 0.16,
      color: '#7DF9FF',
    });
    this.audio.shoot();
    this.registerHit(planet, planet.x, planet.y);
  }

  /** Full-screen colour wipe toward `done`; used for page transitions. */
  beginWipe(center: Vec2, color: string, done: () => void): void {
    this.wipe = { center: { ...center }, color, progress: 0, delay: 0.12, done };
    this.audio.explosion();
    burst(this.particles, center.x, center.y, color, 70, 7);
    const far = Math.max(this.vp.width, this.vp.height) * 0.4;
    spawnRing(this.rings, center.x, center.y, color, far, Math.min(far * 0.3, 140));
    this.shake.kick(0.5);
  }

  handleCommand(cmd: Command): void {
    if (cmd === 'mute') {
      this.audio.toggleMute();
      return;
    }
    this.hooks.onUiCommand?.(cmd);
  }

  setMobile(mobile: boolean): void {
    if (this.mobile === mobile) return;
    this.mobile = mobile;
    this.resize();
    this.setPlanets(
      this.planets.map((p) => ({ id: p.defId, label: p.label, color: p.color, url: p.url })),
    );
  }

  // ---- internals ----------------------------------------------------------

  private makeInputHandlers(): GameInput {
    return {
      onPointerMove: (x, y) => {
        this.aim = { x, y };
        if (!this.mobile)
          this.shipAngle = Math.atan2(y - this.vp.height / 2, x - this.vp.width / 2);
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
    let dt = Math.min((t - this.lastFrame) / 1000, MAX_DT);
    this.lastFrame = t;

    // Hit-stop: briefly dip the time scale so kills feel weighty.
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      dt *= 0.12;
    }
    this.warp += ((this.wipe ? 1 : 0) - this.warp) * Math.min(1, dt * 9);

    if (this.wipe) {
      updateParticles(this.particles, dt);
      if (this.wipe.delay > 0) {
        this.wipe.delay -= dt;
      } else {
        this.wipe.progress += dt * 2.4;
      }
      if (this.wipe.progress >= 1) {
        const done = this.wipe.done;
        this.wipe = null;
        done();
      }
    } else {
      this.update(dt);
    }

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
      if (p.spawnT < 1) p.spawnT = Math.min(1, p.spawnT + dt * 2.4);
    }
    for (let i = 0; i < this.planets.length; i++) {
      for (let j = i + 1; j < this.planets.length; j++) {
        elasticCollide(this.planets[i], this.planets[j]);
      }
    }

    this.updateBullets(dt);
    this.updateDust(dt);

    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }

    advanceAsteroids(this.asteroids, dt, this.vp);
    updateParticles(this.particles, dt);
    updateRings(this.rings, dt);
    this.shake.update(dt);
    this.muzzle = Math.max(0, this.muzzle - dt);

    this.updateHover();
  }

  private updateBullets(dt: number): void {
    outer: for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const fromX = b.x;
      const fromY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Continuous collision: sweep the travelled segment. A path through the
      // core kills; a path that only clips the band grazes — regardless of
      // which frame first touches the rim.
      const segLen = Math.hypot(b.x - fromX, b.y - fromY);
      if (segLen > 0) {
        const dir = { x: (b.x - fromX) / segLen, y: (b.y - fromY) / segLen };
        const impact = firstImpact({ x: fromX, y: fromY }, dir, this.planets);
        if (impact && impact.t <= segLen) {
          const hx = fromX + dir.x * impact.t;
          const hy = fromY + dir.y * impact.t;
          if (impact.core) {
            this.registerHit(impact.planet, hx, hy);
          } else {
            // Graze: shove the blocker along the shot and keep playing.
            applyGrazeImpulse(impact.planet, dir);
            burst(this.particles, hx, hy, '#FFFFFF', 6, 3);
            this.shake.kick(0.06);
            this.audio.graze();
          }
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
    // Ripple reads instantly: rings start at the impact site, already wide.
    spawnRing(this.rings, x, y, planet.color, planet.radius * 2.4, planet.radius * 0.8);
    spawnRing(this.rings, x, y, '#FFFFFF', planet.radius * 1.5, planet.radius * 0.45);
    this.shake.kick(0.15);
    if (!this.reducedMotion) this.hitStop = 0.05;
    this.hooks.onPlanetHit(planet);
  }

  /** Drift + gravity capture/release for the ambient dust field. */
  private updateDust(dt: number): void {
    for (const d of this.dust) {
      stepDust(d, this.planets, this.dust, dt);
      if (d.capturedBy === -1) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < -12) d.x = this.vp.width + 12;
        if (d.x > this.vp.width + 12) d.x = -12;
        if (d.y < -12) d.y = this.vp.height + 12;
        if (d.y > this.vp.height + 12) d.y = -12;
      }
    }
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
    drawBackground(
      ctx,
      this.vp,
      this.stars,
      this.asteroids,
      t,
      this.aim,
      this.reducedMotion,
      this.warp,
    );
    drawDust(ctx, this.dust, this.planets, t);

    ctx.save();
    if (!this.reducedMotion) {
      const off = this.shake.offset();
      ctx.translate(off.x, off.y);
    }

    const bobX = this.reducedMotion ? 0 : Math.sin(t * 0.0016) * 3;
    const bobY = this.reducedMotion ? 0 : Math.cos(t * 0.0011) * 2.5;
    const center = { x: this.vp.width / 2 + bobX, y: this.vp.height / 2 + bobY };
    for (const p of this.planets) {
      if (p.spawnT <= 0) continue; // still queued for warp-in
      drawPlanet(
        ctx,
        p,
        p === this.hovered,
        this.planets.indexOf(p) === this.focusedIndex,
        t,
        center,
      );
    }
    drawRings(ctx, this.rings);
    drawBeams(ctx, this.beams);
    drawBullets(ctx, this.bullets);
    drawParticles(ctx, this.particles);

    if (!this.mobile && !this.wipe && !this.locked) {
      drawAimGuide(ctx, center, this.aim, this.planets);
    }
    drawShip(ctx, center, this.shipAngle, this.muzzle, t);

    ctx.restore();

    if (this.wipe) {
      drawWipe(ctx, this.vp, this.wipe.center, this.wipe.progress, this.wipe.color);
    }
  }
}
