export interface Vec2 {
  x: number;
  y: number;
}

/** Anything that moves and collides as a circle. Velocities are px/frame @60fps. */
export interface Kinematic {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface PlanetDef {
  id: string;
  label: string;
  color: string;
  /** External URL opened when the planet is hit (resume, socials). */
  url?: string;
}

export interface RingParticle {
  angle: number;
  /** rad/s along the perimeter */
  speed: number;
  size: number;
  alpha: number;
  /** height above the planet surface */
  lift: number;
  phase: number;
}

export interface Planet extends Kinematic {
  defId: string;
  label: string;
  color: string;
  url?: string;
  ringParticles: RingParticle[];
  /** Seconds remaining of the white hit-flash overlay. */
  flash: number;
  /**
   * Warp-in animation clock. Negative = still queued (staggered), 0..1 =
   * scaling in, 1 = fully arrived.
   */
  spawnT: number;
  seed: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  /** px/s */
  vx: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Ring {
  x: number;
  y: number;
  radius: number;
  startRadius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

/**
 * Ambient background dust. Free particles drift and slowly twinkle; those that
 * wander into a planet's gravity well are captured into orbit (see gravity.ts)
 * and later ejected again.
 */
export interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  /** Index into the engine's planet array; -1 while free. */
  capturedBy: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  releaseIn: number;
  cooldown: number;
}

export type PageId = 'main' | 'projects' | 'contact';

export type Screen = { page: PageId } | { page: 'detail'; projectId: string; from: PageId };

export interface Viewport {
  width: number;
  height: number;
}
