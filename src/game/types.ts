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

export interface Moon {
  distance: number;
  radius: number;
  angle: number;
  speed: number;
}

export interface Planet extends Kinematic {
  defId: string;
  label: string;
  color: string;
  url?: string;
  moons: Moon[];
  hasRing: boolean;
  /** Seconds remaining of the white hit-flash overlay. */
  flash: number;
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
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

export type PageId = 'main' | 'projects' | 'contact';

export type Screen = { page: PageId } | { page: 'detail'; projectId: string; from: PageId };

export interface Viewport {
  width: number;
  height: number;
}
