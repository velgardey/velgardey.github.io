# Space Portfolio Overhaul — Design Spec

Date: 2026-08-24
Status: Approved (direction A: Canvas 2D game engine)

## Goal

Modernize `velgardey.github.io` (space-port): upgrade the stack to current tooling,
replace the fragile SVG/DOM-per-frame architecture with a Canvas 2D game engine,
keep the shoot-the-planet mechanic, and make the experience noticeably more
immersive, interactive, accessible, and user-friendly.

## Non-goals

- No new audio/image assets (reuse existing wav/mp3/favicon).
- No routing library, no SSR framework, no WebGL.
- Content stays as-is except: project descriptions and an about blurb are added
  (user reviews texts), CHET keeps its IP link (flagged to user).

## Architecture

Principle: **the canvas owns pixels, React owns prose.**

- One `GameEngine` class owns a single `requestAnimationFrame` loop and plain-object
  entity arrays (`planets`, `bullets`, `particles`, `stars`). No React state per frame.
- React renders UI chrome only (HUD, tooltip, dossier panel, help overlay, music
  toggle, crosshair, intro text) and talks to the engine via commands/events:
  - Commands: `shoot(x, y)`, `setPage(page)`, `closeDossier()`, `setMuted(bool)`
  - Events: `hover(planet|null)`, `pageChange(page)`, `dossierOpen(projectId)`,
    `explosionStart`, `muteChange`
- Physics/navigation/spawn are **pure functions** in separate modules — unit-tested
  without DOM or canvas.

### File layout

```
src/
├── main.tsx                 # mount, StrictMode
├── App.tsx                  # composition root: GameCanvas + chrome
├── index.css                # globals, font import, keyframes
├── data/content.ts          # profile blurb, nav planets, projects+descriptions+tech,
│                            #   socials, resume URL — single editable source
├── game/
│   ├── engine.ts            # loop (dt-based, clamped), system pipeline, EventEmitter
│   ├── types.ts             # Planet, Bullet, Particle, StarLayer, PageId, events
│   ├── navigation.ts        # pure FSM: main|projects|contact|detail(projectId)
│   ├── physics.ts           # integrate(dt), wallBounce, elasticCollide (pure)
│   ├── spawn.ts             # non-overlapping placement clear of spacecraft (pure)
│   ├── effects.ts           # Shake, muzzle flash, hit flash rings, particle bursts
│   ├── render.ts            # every ctx draw call: starfield parallax ×3, nebula blobs,
│   │                        #   drifting asteroids, planets (+moons/rings), bullets,
│   │                        #   particles, focus/hover rings
│   ├── audio.ts             # WebAudio manager: buffers from existing assets, pitch
│   │                        #   variation on shoot, music ducking on action
│   └── input.ts             # pointer/touch/keyboard → intents
├── hooks/
│   ├── useGameEngine.ts     # lifecycle + command facade + event subscription
│   └── usePrefersReducedMotion.ts
└── components/
    ├── Hud.tsx              # page title (bottom), contextual control hints
    ├── IntroText.tsx        # typed intro lines (DOM text, timed by page state)
    ├── Tooltip.tsx          # hover: name + one-liner near cursor
    ├── DossierPanel.tsx     # project detail: description, tech chips, Open, Back
    ├── HelpOverlay.tsx      # "?" button → controls modal (Esc closes)
    ├── MusicToggle.tsx      # mute/unmute, persisted in localStorage
    └── Crosshair.tsx        # desktop custom cursor
```

Removed files: `Bullet.tsx`, `AnimatedBullet.tsx`, `PageTransition.tsx`,
`TypedText.tsx`, `ParticleSystem.tsx`, `ParticleTrail.tsx`, `LoadingScreen.tsx`,
`ExplosionTransition.tsx`, `Spacecraft.tsx`, `Planet.tsx`, `BackgroundMusic.tsx`,
`App.css`. Removed deps: `matter-js`, `react-transition-group`, their `@types/*`.

Cut feature (deliberate): per-word text↔planet collision tinting in TypedText
(expensive rect loops, barely visible). Replaced by static neon-glow styling.

## Engine internals

- Loop: `requestAnimationFrame`; dt = clamp(now − last, 0…50 ms); systems run in
  order: input-intents → navigation side-effects → physics(integrate+bounce+
  collide) → effects update → render.
- Entities mutate freely inside the engine (they are not React state).
- Camera shake: magnitude impulse on hits/explosions, exponential decay; applied as
  random-offset `ctx.translate` each frame. Disabled under reduced-motion.
- Parallax starfield: 3 layers (far/mid/near) drifting slowly; slight offset toward
  aim point. Nebula: 4–6 large low-alpha radial gradients drifting. Asteroids: a few
  small irregular polygons wrapping screen edges, decorative only.
- Planets: optional 1–2 orbiting moons and/or ellipse ring (decorative, seeded per
  planet id so layout is stable). Hover: brighter stroke + glow ring; focused
  (keyboard): dashed focus ring.
- Bullets: position integrated per frame, speed ~15 px/frame @60fps scaled by dt;
  trail = gradient line; impact = spark burst + expanding ring; offscreen cull.
- Explosion sequence on nav-planet hit: spark burst + shockwave ring + brief
  full-screen color wipe (faster/subtler than today) → swap planet set → fade HUD.
- Reduced motion (`prefers-reduced-motion`): no shake, no parallax drift, particle
  counts halved, transitions instant.

## Interaction model

Pages (FSM): `main` → {`projects`, `contact`} → `detail(projectId)` → back.

- Desktop: mouse aims (ship stays centered), click shoots. Hover planet ⇒ glow +
  tooltip. Keyboard: Tab cycles planets, Enter/Space shoots focused, Esc closes
  panel/help, digits 1–3 jump between main pages, M toggles sound, ? opens help.
- Mobile/touch: tap = aim+shoot; drag moves ship (existing feel kept, throttle
  removed in favor of tap-vs-drag distance threshold).
- Shooting a **project planet**: explosion → dossier panel (dimmed backdrop) with
  name, description, tech chips, "Open Project ↗" (new tab), Back / Esc. Shooting a
  **nav planet**: Projects/Contact explode into their child planets (current
  behavior, juicier); Resume opens Drive link directly (current behavior).
- Contact planets link out directly (LinkedIn, GitHub, X, Discord, Instagram).
- First-run hint: one-line hint bottom-center ("Click / tap to shoot • Tab to
  target") until first successful shot, stored in localStorage.
- Duplicated "Back" planet retained on Projects/Contact pages (in-world affordance),
  plus keyboard/Esc path.

## Accessibility

- Planets remain reachable without pointer: Tab focus + Enter fires (engine draws
  focus ring); live region announces page changes ("Projects page").
- All chrome is real DOM with focus styles; help/dossier trap focus and close on Esc.
- `cursor: none` only applied once crosshair mounted (desktop, fine-pointer).
- Color contrast: labels white on colored fills ≥ 3:1 (checked against chosen palette).

## SEO / meta

`<title>Mriganka Dey — Space Portfolio</title>`; description; OG tags
(title/description/type/url); theme-color `#090A0F`; favicon moved to `public/`.
OG image deferred (needs a generated asset).

## Tooling & delivery

- pnpm as sole package manager (delete `package-lock.json`, stray
  `pnpm-workspace.yaml`).
- Latest stable at implementation time (verify against registry, not memory):
  Vite, React 19, TypeScript, ESLint 9 flat config + typescript-eslint 8 +
  react-hooks/react-refresh plugins, Prettier (+ eslint-config-prettier), Vitest.
- tsconfig.app.json: drop WSL UNC paths; ES2022 target/lib; strict stays.
- vite.config.ts: base `/` (user page), minimal.
- GitHub Actions: `ci.yml` (pnpm install, lint, typecheck, test, build on PR/push)
  and `deploy.yml` (build + actions/deploy-pages on push to main). Local
  `gh-pages` package removed.
- Scripts: `dev`, `build` (tsc -b && vite build), `lint`, `format`, `test`,
  `typecheck`.

## Testing

Vitest (node env) for pure modules:

- `physics`: wall bounce clamps velocity, elastic collision conserves momentum,
  speed normalization.
- `spawn`: placements inside viewport, outside ship exclusion radius, pairwise
  non-overlap (property-ish loops over seeds).
- `navigation`: full FSM traversal incl. unknown ids, back behavior, detail open/close.
- `content`: every entry has valid URL/hex color/non-empty label; project ids unique.

Verification before completion: lint, typecheck, tests, production build, then a
Playwright smoke pass (loads, shoots, opens dossier) via webapp-testing skill.

## Risks

- Text rendering on canvas for planet labels: solved already by keeping labels on
  canvas (few words) — measure once per resize, cache.
- Audio autoplay policies: music starts muted-off via explicit toggle only.
- GitHub Pages + Actions: repo is `velgardey.github.io` user page; deploy-pages
  artifact flow works for user sites.
