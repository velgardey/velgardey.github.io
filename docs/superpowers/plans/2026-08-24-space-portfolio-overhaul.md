# Space Portfolio Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild velgardey.github.io on a Canvas 2D game engine with modern tooling, richer immersion, descriptions woven into interactions, and full keyboard/a11y support.

**Architecture:** One `GameEngine` class owns a single rAF loop over plain-object entities; React renders UI chrome only; physics/spawn/navigation are pure, unit-tested modules. See spec: `docs/superpowers/specs/2026-08-24-space-portfolio-overhaul-design.md`.

**Tech Stack:** Vite 8, React 19.2, TypeScript 5.9 (TS 7 blocked: typescript-eslint peers `<6.1.0`), ESLint 10 flat config + typescript-eslint 8.67, Prettier 3.9, Vitest 4, pnpm 11. Node 26 present.

**Spec:** docs/superpowers/specs/2026-08-24-space-portfolio-overhaul-design.md

## Global Constraints

- Package manager: pnpm only. Delete `package-lock.json`. Add `"packageManager": "pnpm@11.22.0"`.
- Versions: `vite ^8.2.2`, `@vitejs/plugin-react ^6.1.0`, `react/react-dom ^19.2.8`, `@types/react ^19.2.18`, `@types/react-dom ^19.2.5`, `typescript ~5.9.3`, `eslint ^10.9.0`, `typescript-eslint ^8.67.0`, `eslint-plugin-react-hooks ^7.1.1`, `prettier ^3.9.6`, `vitest ^4.1.11`.
- Removed deps (dead or replaced): `matter-js`, `@types/matter-js`, `react-transition-group`, `@types/react-transition-group`, `use-sound`, `react-responsive`, `gh-pages`.
- All copy lives in `src/data/content.ts` — never hardcode strings/colors/URLs in game or UI code.
- Velocities are px/frame@60fps for planets (integrated with `dt*60`); bullets are px/s.
- Every task ends green: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (tests exist from Task 2 on).
- `verbatimModuleSyntax`: use `import type { ... }` for type-only imports everywhere from Task 2 onward.
- Commits: conventional commits (`feat:`, `chore:`, `test:`), one commit per task. **Do not push.**

---

### Task 1: Toolchain reset + shell modernization

**Files:**

- Rewrite: `package.json`, `.eslintrc.cjs` → delete, create `eslint.config.js`, create `.prettierrc.json`
- Modify: `tsconfig.app.json` (scrub WSL paths), `index.html`
- Move: `src/assets/space-favicon.svg` → `public/favicon.svg`
- Delete: `src/components/Bullet.tsx`, `src/components/PageTransition.tsx`, `package-lock.json`, `pnpm-workspace.yaml`
- Create: `.gitignore` addition for `coverage/`

**Interfaces:** Produces scripts `dev/build/lint/format/test/typecheck` used by every later task.

- [ ] **Step 1: Rewrite package.json** — keep `name/private/type/homepage`, set version `1.0.0`, add `"packageManager": "pnpm@11.22.0"`. Scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "typecheck": "tsc -b"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.5",
    "@vitejs/plugin-react": "^6.1.0",
    "eslint": "^10.9.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "prettier": "^3.9.6",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.67.0",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

NOTE: old code imports `use-sound`/`react-responsive`; they leave the tree only in Task 10. To stay green now, temporarily keep `"use-sound": "^4.0.3"` and `"react-responsive": "^10.0.0"` in dependencies; remove them in Task 10.

- [ ] **Step 2: Create `eslint.config.js`**

```js
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig({ ignores: ['dist', 'coverage'] }, tseslint.configs.recommended, {
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
});
```

Delete `.eslintrc.cjs`. Create `.prettierrc.json`:

```json
{ "printWidth": 100, "singleQuote": true, "trailingComma": "all" }
```

- [ ] **Step 3: Scrub `tsconfig.app.json`** — remove the two `//wsl.localhost/...` includes; set `"target": "ES2022"`, `"lib": ["ES2022", "DOM", "DOM.Iterable"]`; keep rest. (Defer `verbatimModuleSyntax`/`erasableSyntaxOnly` to Task 10 so old files keep compiling.)

- [ ] **Step 4: Modernize `index.html`** — favicon `/favicon.svg`, meta description/theme-color/OG tags, Google Fonts `Space Mono` with preconnect, `<title>Mriganka Dey — Space Portfolio</title>` (exact markup in spec §SEO/meta).

- [ ] **Step 5:** `git mv src/assets/space-favicon.svg public/favicon.svg`; `git rm src/components/Bullet.tsx src/components/PageTransition.tsm 2>/dev/null || git rm src/components/Bullet.tsx src/components/PageTransition.tsx`; delete `package-lock.json`, `pnpm-workspace.yaml`; append `coverage/` to `.gitignore`.

- [ ] **Step 6: Install + verify**

Run: `pnpm install && pnpm lint && pnpm typecheck && pnpm build`
Expected: install resolves new lockfile; old app still lints/typechecks/builds.

- [ ] **Step 7: Commit** `chore: modernize toolchain (vite8/eslint10/prettier/vitest, pnpm-only)`

---

### Task 2: Content data module (TDD)

**Files:**

- Create: `src/data/content.ts`
- Test: `src/data/content.test.ts`

**Interfaces:**

- Produces: `PROFILE`, `NAV_PLANETS: PlanetDef[]`, `BACK_PLANET: PlanetDef`, `PROJECTS: ProjectInfo[]`, `CONTACT_PLANETS: PlanetDef[]`, `HINT_TEXT: string`, `OG_DESCRIPTION: string`.
- Types exported: `ProjectInfo { id,label,color,url,oneLiner,description,tech:string[] }`. `PlanetDef { id,label,color,url? }` defined locally here (moved to `src/game/types.ts` in Task 3 which re-exports).

Content (verified against live repos):

- Yok: deploy platform from Git — tech Go/Node/Kafka/AWS ECS/ClickHouse, url `https://github.com/velgardey/yok`, color `#FFD166`
- Melior: self-improving coding-agent harness on LangGraph — Python/LangGraph/Agents, `https://github.com/velgardey/melior`, `#00B4D8`
- Find Your Flick: AI social movie companion — Next.js/TS/Firebase/Prisma, `https://github.com/velgardey/find-your-flick`, `#FF6B6B`
- CHET: realtime multi-user chat on AWS — TS/WebSockets/AWS, url stays `http://13.235.103.165/` (user-confirmed), `#3A86FF`
- Chess Rogue: chess with randomized piece roles — React/TS, `https://velgardey.github.io/chess-rogue/`, `#75D34D`
- Resume url: existing Drive link. Contacts: LinkedIn/GitHub/X/Discord/Instagram (existing URLs).

- [ ] **Step 1: Failing test** `src/data/content.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { BACK_PLANET, CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from './content';

const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c);
const valid = (defs: { id: string; label: string; color: string; url?: string }) =>
  defs.every((d) => d.id && d.label.trim() && isHex(d.color) && (!d.url || URL.canParse(d.url)));

describe('content integrity', () => {
  it('all planet sets have unique ids, labels, hex colors, valid urls', () => {
    expect(valid(NAV_PLANETS)).toBe(true);
    expect(valid(CONTACT_PLANETS)).toBe(true);
    expect(valid(PROJECTS)).toBe(true);
    expect(valid([BACK_PLANET])).toBe(true);
  });
  it('project ids are unique', () => {
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length);
  });
  it('every project has copy and tech', () => {
    expect(PROJECTS.every((p) => p.oneLiner && p.description && p.tech.length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2:** Run `pnpm test` → FAIL (module missing).
- [ ] **Step 3:** Implement `content.ts` with the data above (full literals written in file).
- [ ] **Step 4:** `pnpm test` → PASS. `pnpm lint && pnpm typecheck` → green.
- [ ] **Step 5: Commit** `feat(content): centralize portfolio copy with verified project descriptions`

---

### Task 3: Types + physics (TDD)

**Files:**

- Create: `src/game/types.ts`, `src/game/physics.ts`
- Test: `src/game/physics.test.ts`

**Interfaces:**

- Produces (`types.ts`): `Vec2`, `Kinematic {x,y,vx,vy,radius}`, `PlanetDef`, `Moon`, `Planet extends Kinematic {defId,label,color,url?,moons:Moon[],hasRing,flash,seed}`, `Bullet {id,x,y,vx,vy}`, `Particle {x,y,vx,vy,size,life,maxLife,color}`, `Ring {x,y,radius,maxRadius,life,maxLife,color,width}`, `PageId='main'|'projects'|'contact'`, `Screen={page:PageId}|{page:'detail';projectId:string;from:PageId}`, `Viewport {width,height}`.
- Produces (`physics.ts`): `integrate(b,dts)`, `wallBounce(b,w,h)`, `bounceOff(b,cx,cy,cr):boolean`, `elasticCollide(a,b)`, `clampSpeed(b,target)`, `SHIP_RADIUS=26`.

- [ ] **Step 1: Failing tests** — cover: `wallBounce` clamps inside and flips sign; `elasticCollide` head-on equal-mass swap conserves momentum and separates; `bounceOff` reflects inward velocity and ejects to rim; `clampSpeed` rescales; `integrate` uses 60fps scaling (`integrate({x:0,y:0,vx:1,vy:0,radius:1}, 0.5)` → `x≈30`).

```ts
import { describe, expect, it } from 'vitest';
import { bounceOff, clampSpeed, elasticCollide, integrate, wallBounce } from './physics';
import type { Kinematic } from './types';

const body = (o: Partial<Kinematic> = {}): Kinematic => ({
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  ...o,
});

describe('integrate', () => {
  it('scales velocity by dt at 60fps baseline', () => {
    const b = body({ vx: 1 });
    integrate(b, 0.5);
    expect(b.x).toBeCloseTo(30);
  });
});

describe('wallBounce', () => {
  it('reflects and clamps at left/right walls', () => {
    const b = body({ x: 5, vx: -2 });
    wallBounce(b, 800, 600);
    expect(b.x).toBe(10);
    expect(b.vx).toBe(2);
    const c = body({ x: 795, vx: 3 });
    wallBounce(c, 800, 600);
    expect(c.x).toBe(790);
    expect(c.vx).toBe(-3);
  });
});

describe('elasticCollide', () => {
  it('swaps head-on velocities and separates overlapping bodies', () => {
    const a = body({ x: 0, vx: 5 });
    const b = body({ x: 15, vx: -5 });
    elasticCollide(a, b);
    expect(a.vx).toBeCloseTo(-5);
    expect(b.vx).toBeCloseTo(5);
    expect(a.x + b.x).toBeCloseTo(15); // symmetric separation
  });
  it('ignores non-overlapping bodies', () => {
    const a = body({ x: 0, vx: 5 });
    const b = body({ x: 500, vx: 0 });
    elasticCollide(a, b);
    expect(a.vx).toBe(5);
  });
});

describe('bounceOff', () => {
  it('reflects approach and ejects body outside circle', () => {
    const b = body({ x: 60, y: 0, vx: -4 }); // heading toward center circle r=30
    expect(bounceOff(b, 0, 0, 30)).toBe(true);
    expect(Math.hypot(b.x, b.y)).toBeGreaterThanOrEqual(40); // 10+30
    const dot = b.vx * (b.x / Math.hypot(b.x, b.y)) + b.vy * (b.y / Math.hypot(b.x, b.y));
    expect(dot).toBeGreaterThanOrEqual(0); // no longer approaching
  });
});

describe('clampSpeed', () => {
  it('rescales velocity magnitude to target', () => {
    const b = body({ vx: 3, vy: 4 });
    clampSpeed(b, 1);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2:** `pnpm test` → FAIL.
- [ ] **Step 3:** Implement per signatures above (implementations as designed in spec §physics; `integrate` multiplies by `dts*60`).
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5: Commit** `feat(game): pure kinematics module with unit tests`

---

### Task 4: Seeded spawn (TDD)

**Files:**

- Create: `src/game/spawn.ts`
- Test: `src/game/spawn.test.ts`

**Interfaces:**

- Produces: `mulberry32(seed:number):()=>number`, `planetRadius(label:string,mobile:boolean):number`, `spawnPlanets(defs:PlanetDef[], vp:Viewport, mobile:boolean, seed?:number):Planet[]` (default seed = Date.now()).

Rules encoded: inside viewport with `radius` margin; pairwise gap ≥ 28px; outside ship exclusion `radius + SHIP_RADIUS + 48` from center; deterministic given seed; decorative moons (0–2) and ring (rng<0.3); `flash:0`.

- [ ] **Step 1: Failing tests** — loop seeds 0..49 × viewports (1280×720, 390×844): every planet satisfies constraints above; same seed ⇒ identical output (JSON equality); different labels give non-decreasing radius ordering sanity (`planetRadius('Back')<planetRadius('Find Your Flick')` for both modes); moon count ∈ {0,1,2} and moon.distance > planet.radius.

```ts
import { describe, expect, it } from 'vitest';
import { NAV_PLANETS } from '../data/content';
import { mulberry32, planetRadius, spawnPlanets } from './spawn';
import { SHIP_RADIUS } from './physics';
import type { Viewport } from './types';

const vps: Viewport[] = [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];

describe('spawnPlanets', () => {
  it('places planets legally for many seeds/viewports', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const vp of vps) {
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
        for (let i = 0; i < planets.length; i++)
          for (let j = i + 1; j < planets.length; j++) {
            const d = Math.hypot(planets[i].x - planets[j].x, planets[i].y - planets[j].y);
            expect(d).toBeGreaterThanOrEqual(planets[i].radius + planets[j].radius + 28);
          }
      }
    }
  });
  it('is deterministic per seed', () => {
    expect(JSON.stringify(spawnPlanets([...NAV_PLANETS], vps[0], false, 7))).toBe(
      JSON.stringify(spawnPlanets([...NAV_PLANETS], vps[0], false, 7)),
    );
  });
  it('decorates moons sanely', () => {
    const planets = spawnPlanets([...NAV_PLANETS], vps[0], false, 3);
    for (const p of planets) {
      expect(p.moons.length).toBeLessThanOrEqual(2);
      for (const m of p.moons) expect(m.distance).toBeGreaterThan(p.radius);
    }
  });
});

describe('mulberry32', () => {
  it('is deterministic', () => {
    const a = mulberry32(42),
      b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('planetRadius', () => {
  it('grows with label length', () => {
    expect(planetRadius('Back', false)).toBeLessThan(planetRadius('Find Your Flick', false));
    expect(planetRadius('Back', true)).toBeLessThan(planetRadius('Find Your Flick', true));
  });
});
```

- [ ] **Step 2:** FAIL → **Step 3:** implement (mulberry32 standard 32-bit; rejection sampling 200 tries then deterministic grid fallback along edges). → **Step 4:** PASS. → **Step 5: Commit** `feat(game): seeded deterministic planet spawning`

---

### Task 5: Navigation FSM (TDD)

**Files:**

- Create: `src/game/navigation.ts`
- Test: `src/game/navigation.test.ts`

**Interfaces:**

- Produces: `nextScreen(screen:Screen, planetId:string): Screen|null`, `defsForScreen(page:'main'|'projects'|'contact'): PlanetDef[]`, `titleForScreen(screen:Screen):string`.
- Behavior: `back` → `{page: screen.page==='detail'?screen.from:'main'}`; main+projects/contact → that page; any non-detail page + project id → `{page:'detail',projectId,from:currentPage}`; resume/social ids → null (URL opened by caller); detail + project id → null. `defsForScreen('projects')` = PROJECTS mapped to PlanetDef + BACK_PLANET; `'contact'` = CONTACT_PLANETS + BACK_PLANET; `'main'` = NAV_PLANETS.

- [ ] **Step 1: Failing tests** covering: main→projects→detail(yok)→back→projects→back→main; main+resume=null; contact+linkedin=null; unknown id=null; titleForScreen returns 'Projects'/'Contact'/project label/profile name respectively; defsForScreen lengths 3/6/6.

```ts
import { describe, expect, it } from 'vitest';
import { CONTACT_PLANETS, NAV_PLANETS, PROJECTS } from '../data/content';
import { defsForScreen, nextScreen, titleForScreen } from './navigation';
import type { Screen } from './types';

const main: Screen = { page: 'main' };

describe('nextScreen', () => {
  it('walks main → projects → detail → back → projects → back → main', () => {
    const projects = nextScreen(main, 'projects');
    expect(projects).toEqual({ page: 'projects' });
    const detail = nextScreen(projects!, 'yok');
    expect(detail).toEqual({ page: 'detail', projectId: 'yok', from: 'projects' });
    expect(nextScreen(detail!, 'back')).toEqual({ page: 'projects' });
    expect(nextScreen({ page: 'projects' }, 'back')).toEqual({ page: 'main' });
  });
  it('returns null for url planets and unknown ids', () => {
    expect(nextScreen(main, 'resume')).toBeNull();
    expect(nextScreen({ page: 'contact' }, 'linkedin')).toBeNull();
    expect(nextScreen(main, 'nope')).toBeNull();
  });
  it('routes contact page', () => {
    expect(nextScreen(main, 'contact')).toEqual({ page: 'contact' });
  });
});

describe('defsForScreen', () => {
  it('maps pages to planet sets incl. Back', () => {
    expect(defsForScreen('main')).toHaveLength(NAV_PLANETS.length);
    expect(defsForScreen('projects')).toHaveLength(PROJECTS.length + 1);
    expect(defsForScreen('contact')).toHaveLength(CONTACT_PLANETS.length + 1);
    expect(defsForScreen('projects').at(-1)!.id).toBe('back');
  });
});

describe('titleForScreen', () => {
  it('titles each screen', () => {
    expect(titleForScreen(main)).toBe('Home');
    expect(titleForScreen({ page: 'projects' })).toBe('Projects');
    expect(titleForScreen({ page: 'contact' })).toBe('Contact');
    expect(titleForScreen({ page: 'detail', projectId: 'yok', from: 'projects' })).toBe(
      PROJECTS.find((p) => p.id === 'yok')!.label,
    );
  });
});
```

- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS → **Step 5: Commit** `feat(game): tested navigation state machine`

---

### Task 6: Effects math (TDD)

**Files:**

- Create: `src/game/effects.ts`
- Test: `src/game/effects.test.ts`

**Interfaces:**

- Produces: `class Shake { kick(n):void; update(dt):void; offset():Vec2; get level():number }` (trauma clamped 0..1, decays 1.8/s, offset ≤ 14·trauma² per axis); `burst(out:Particle[], x,y,color,count,speed):void`; `updateParticles(ps,dt):void` (life decrements by dt·60, dead culled); `spawnRing(out:Ring[], x,y,color,maxRadius):void`; `updateRings(rs,dt):void` (radius eases toward max, life decays, culled).

- [ ] **Step 1: Failing tests**: shake monotonic decay + bounded offset; burst creates count particles with nonzero velocity and life>0; updateParticles removes expired; rings grow monotonically and cull.

```ts
import { describe, expect, it } from 'vitest';
import { Shake, burst, spawnRing, updateParticles, updateRings } from './effects';
import type { Particle, Ring } from './types';

describe('Shake', () => {
  it('decays monotonically and offsets shrink', () => {
    const s = new Shake();
    s.kick(1);
    let prev = s.level;
    const o1 = Math.hypot(...Object.values(s.offset()));
    for (let i = 0; i < 50; i++) {
      s.update(0.016);
      expect(s.level).toBeLessThanOrEqual(prev);
      prev = s.level;
    }
    expect(s.level).toBe(0);
    const o2 = Math.hypot(...Object.values(s.offset()));
    expect(o2).toBeLessThan(o1);
  });
});

describe('particles', () => {
  it('burst spawns living moving particles; update culls dead', () => {
    const ps: Particle[] = [];
    burst(ps, 10, 10, '#fff', 20, 5);
    expect(ps).toHaveLength(20);
    expect(ps.every((p) => p.life > 0 && (p.vx !== 0 || p.vy !== 0))).toBe(true);
    for (let i = 0; i < 500; i++) updateParticles(ps, 0.016);
    expect(ps).toHaveLength(0);
  });
});

describe('rings', () => {
  it('expand then expire', () => {
    const rs: Ring[] = [];
    spawnRing(rs, 0, 0, '#fff', 100);
    let lastR = 0;
    for (let i = 0; i < 120 && rs.length; i++) {
      updateRings(rs, 0.016);
      if (rs[0]) expect(rs[0].radius).toBeGreaterThanOrEqual(lastR);
      lastR = rs[0]?.radius ?? lastR;
    }
    expect(rs).toHaveLength(0);
  });
});
```

- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS → **Step 5: Commit** `feat(game): juice primitives — shake, bursts, rings`

---

### Task 7: Renderer

**Files:**

- Create: `src/game/render.ts`

**Interfaces:**

- Consumes: types from `types.ts`.
- Produces (all `(ctx: CanvasRenderingContext2D, ...)`): `makeStars(vp,count):Star[]` (local `Star` type: x,y,r,alphaBase,layer0-2,twinklePhase); `makeAsteroids(vp,n):Asteroid[]`; `drawBackground(ctx,vp,stars,asteroids,time,aim,reduced)` — bg gradient, nebula blobs (fixed 5 positions, slow sine drift), 3-layer parallax stars (offset `(aim-center)*k(layer)`), asteroid drift+wrap+polygon stroke; `drawPlanet(ctx,p,hovered,focused,time)` — shadowBlur glow, radial gradient fill, white stroke, optional ellipse ring, orbiting moons, word-wrapped label, white flash overlay when `p.flash>0`, dashed rotating focus ring when focused; `drawShip(ctx,pos,angle,muzzle)` — triangle hull #F35B04, gold core line, muzzle flash radial gradient when `muzzle>0`; `drawBullets/drawParticles/drawRings(ctx,arr)` — gradient streaks / fading dots / stroked circles with globalAlpha easing.
- No unit tests (visual module) — verified by typecheck + Playwright smoke in Task 11. Keep every draw call in this file; engine contains zero ctx code.

- [ ] **Step 1:** Implement file (full code written in-file; ~260 lines, no TODOs).
- [ ] **Step 2:** `pnpm typecheck && pnpm lint` → green.
- [ ] **Step 3: Commit** `feat(game): canvas renderer — parallax cosmos, decorated planets, ship, fx`

---

### Task 8: AudioManager

**Files:**

- Create: `src/game/audio.ts`

**Interfaces:**

- Produces: `class AudioManager { init():Promise<void>; shoot():void; explosion():void; duckMusic():void; toggleMute():boolean; get muted():boolean; destroy():void }`.
- WebAudio: lazily created `AudioContext` inside `init()` (must be called from a user gesture); fetches `shoot.wav`/`explosion.wav` via Vite `?url` imports, decodes to buffers; `shoot()` plays with `playbackRate = 0.9 + Math.random()*0.3`, gain 0.15; `explosion()` gain 0.35. Music: `HTMLAudioElement(loop, volume .12, preload auto)`; `duckMusic()` dips volume to .04 and restores over 700ms; `toggleMute()` persists `localStorage['space-port-muted']`, pauses/resumes music; constructor reads stored mute.

- [ ] **Step 1:** Implement. **Step 2:** `pnpm typecheck` green (audio exercised manually in Task 11 smoke). **Step 3: Commit** `feat(game): webaudio sfx with pitch variation + duckable music`

---

### Task 9: Input controller

**Files:**

- Create: `src/game/input.ts`

**Interfaces:**

- Consumes: none (DOM only).
- Produces: `interface GameInput { onPointerMove(x,y):void; onShoot(x,y):void; onDragMove(x,y):void; onFocusNext():void; onActivate():void; onCancel():void; onCommand(cmd:'mute'|'help'|'home'|'projects'|'contact'):void }` and `attachInput(surface:HTMLElement, h:GameInput):()=>void`.
- Pointer Events only. Logic: `pointerdown` records pos/time/id; `pointermove` (no button or hovering) → `onPointerMove`; drag beyond 12px with primary button/touch → `onDragMove` per move (ship follows); `pointerup` within 12px and <400ms → `onShoot(x,y)`. Window `keydown`: Tab→preventDefault+onFocusNext; Enter/Space→onActivate; Escape→onCancel; `m`→mute; `?`/`h`→help; `1/2/3`→home/projects/contact. Returns unregister fn removing all listeners.

- [ ] **Step 1:** Implement. **Step 2:** typecheck green. **Step 3: Commit** `feat(game): unified pointer/keyboard input controller`

---

### Task 10: Engine orchestration

**Files:**

- Create: `src/game/engine.ts`

**Interfaces:**

- Consumes: everything above.
- Produces: `class GameEngine { constructor(canvas, hooks:{onHover(p:Planet|null,x:number,y:number):void; onPlanetHit(p:Planet):void}); start(); destroy(); setPlanets(defs:PlanetDef[], mobile:boolean); resize(vp:Viewport); setReducedMotion(b:boolean); shootAt(x,y); focusNext(); activateFocus(); cancel(); setPaused(b:boolean); audio:AudioManager; aim:Vec2 }`.
- Loop (rAF): `dt=min((t-last)/1000,.05)`; skip updates while paused (still render); systems: planets integrate/wallBounce/bounceOff(ship)/pairwise elasticCollide/clampSpeed(target .55 or .75 mobile); moons advance `angle+=speed*dt`; `flash-=dt`; bullets integrate (px/s), planet-hit test → remove + `flash=.35` + micro-burst + shake.kick(.12) + hooks.onPlanetHit; offscreen cull; hover = point-in-circle topmost under `aim` (only fine pointers) → hooks.onHover on change; focusedIndex clamped to range; effects update; render via `render.ts` (shake offset translate, dpr-aware transform set in resize: `canvas.width=w*dpr; ctx.setTransform(dpr,0,0,dpr,0,0)`).
- `shootAt(x,y)`: angle from ship pos; bullet speed 900px/s; muzzle=.09; shake.kick(.05); audio.shoot().
- `activateFocus()`: shoots focused planet center (guaranteed hit).
- `cancel()`: clears focus (Esc).
- Asteroids/stars regenerated in resize; planet sets NOT auto-regenerated on resize (planets re-clamped by wallBounce naturally).
- Zero React imports.

- [ ] **Step 1:** Implement. **Step 2:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green (old App still mounted; engine unused yet). **Step 3: Commit** `feat(game): GameEngine — single-loop orchestration of physics, fx, input, audio`

---

### Task 11: React glue + UI chrome

**Files:**

- Create: `src/hooks/usePrefersReducedMotion.ts`, `src/hooks/useGameEngine.ts`, `src/components/{Crosshair,Tooltip,Hud,IntroText,DossierPanel,HelpOverlay,MusicToggle}.tsx`
- Modify: `src/vite-env.d.ts` (ensure `/// <reference types="vite/client" />` for `?url` imports)

**Interfaces:**

- `usePrefersReducedMotion():boolean` — matchMedia('(prefers-reduced-motion: reduce)') + change listener.
- `useGameEngine(canvasRef, hooksRef): GameEngine|null` — constructs once on mount (handlers read through a ref to dodge stale closures), starts, destroys on unmount; exposes engine.
- `Crosshair` — fixed 36px crosshair following `pointermove` via direct `style.transform` (no re-render); CSS hides native cursor only over canvas (`.game-cursor { cursor: none }` applied on fine pointers via media query in index.css).
- `Tooltip({ planet })` — subscribes to window pointermove for position; renders label + one-liner (lookup by defId in PROJECTS/CONTACT_PLANETS/NAV_PLANETS) in styled card near cursor; hidden when planet null.
- `Hud({ screen, shotOnce })` — bottom-center: title (fade-in via key remount + CSS animation) + `HINT_TEXT` until shotOnce; `<p aria-live="polite" className="sr-only">{title}</p>`.
- `IntroText` — types `Hi, I'm Mriganka Dey` then tagline (from PROFILE) with blinking caret; shows only on main page, once per mount; plain DOM text.
- `DossierPanel({ project, onClose })` — `<dialog>`-style overlay: label, oneLiner, description, tech chips, `Open Project ↗` anchor (target `_blank`, `rel="noopener noreferrer"`), Back button + Esc; autofocuses Back on open.
- `HelpOverlay({ onClose })` — controls list (click/tap shoot, Tab target, Enter fire, Esc close, M mute, 1/2/3 navigate, ? help).
- `MusicToggle({ audio }: { audio: AudioManager | null })` — round bottom-right button, inline SVG speaker icon (muted variant), `aria-label="Toggle sound"`, aria-pressed.

- [ ] **Step 1:** Implement all files. **Step 2:** `pnpm lint && pnpm typecheck` green. **Step 3: Commit** `feat(ui): accessible chrome — hud, tooltip, dossier, help, crosshair, sound toggle`

---

### Task 12: Swap — App composition + deletions + dep pruning + tsconfig tightening

**Files:**

- Rewrite: `src/App.tsx` (~170 lines), `src/main.tsx`, `src/index.css`
- Delete: `src/App.css`, `src/components/{AnimatedBullet,TypedText,Planet,Spacecraft,ExplosionTransition,LoadingScreen,ParticleSystem,ParticleTrail,BackgroundMusic}.tsx`
- Modify: `package.json` (drop `use-sound`, `react-responsive`), `tsconfig.app.json` (+ `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`)

**App behavior (composition root):**

- State: `screen: Screen` (init `{page:'main'}`), `hovered`, `shotOnce` (localStorage `space-port-shot`), `helpOpen`.
- `handlePlanetHit(p)`: if `p.url` and defId ∉ {nav,project,back} → `window.open(p.url,'_blank','noopener')` + audio.explosion + return. If defId==='back' or nav planet → engine.explode-style sequence: audio.explosion + `setPaused(true)` + wipe via engine (engine gains `wipe(color, cb)` calling cb at completion; App then `setScreen(next)`, `engine.setPlanets(defsForScreen(...))`, `setPaused(false)`). Project planet → light burst + `setScreen({page:'detail',projectId,from})` (planets keep drifting behind dimmed backdrop).
- Renders: `<canvas>` (ref'd, class `game-cursor`) + `<Crosshair/>` + `<Tooltip/>` + `<IntroText/>` (main only) + `<Hud/>` + conditional `DossierPanel` (project lookup; onClose → `{page:from}`) + `HelpOverlay` + `MusicToggle`.
- `input.attachInput` wired through `useGameEngine` handler-ref to engine commands + App-level commands (help/mute/nav digits: digits call `engine.setPlanets(defsForScreen(...))` + setScreen).
- `usePrefersReducedMotion` → `engine.setReducedMotion`.

**index.css:** `:root` palette vars (#090A0F bg, #EAF2FF text, accent cyan #00FFFF), reset, `body{overflow:hidden;font-family:'Space Mono'}`, `.sr-only`, modal/card styles (backdrop-filter blur, 1px rgba borders, glow shadows), focus-visible outlines (2px solid var(--accent)), `@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}`, keyframes `fade-up`, `pop-in`, caret blink.

- [ ] **Step 1:** Rewrite/delete/prune per above. **Step 2:** `pnpm install` (lockfile prunes) then full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` → all green. **Step 3: Commit** `feat!: swap to engine-driven app — delete legacy components, prune deps`

---

### Task 13: CI/CD + README

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify: `README.md` (short: what/stack/scripts/deploy notes)

**ci.yml** (push/PR → pnpm install --frozen-lockfile → lint → typecheck → test → build, node 22, pnpm cache):

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

**deploy.yml** (push main → same build → `actions/upload-pages-artifact@v3` (path dist) → `actions/deploy-pages@v4`; `permissions: {pages:write, id-token:write, contents:read}`, `environment: github-pages`, concurrency `pages`).

- [ ] **Step 1:** Write files. **Step 2:** Commit `ci: actions ci + pages deployment, retire gh-pages flow`

---

### Task 14: Final verification

- [ ] Full gate locally: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- [ ] `pnpm preview` + Playwright smoke (webapp-testing skill): loads, canvas visible, click fires bullet (canvas pixel change or no console errors), Tab+Enter navigates to Projects, dossier opens on shooting a project planet, Esc closes, help overlay works, no console errors, screenshot review.
- [ ] Grep sweep: no `matter-js`/`use-sound`/`react-responsive`/`gh-pages` references remain; no `TODO`/`FIXME` in src.
- [ ] Report summary to user (do not push — user pushes when ready; Actions deploy on push).
