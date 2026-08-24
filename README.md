# Space Portfolio

A hyper-interactive portfolio: pilot a spacecraft at the centre of the screen and
shoot planets to explore projects, résumé and social links.

Built with **Vite · React 19 · TypeScript · Canvas 2D** — one game engine owns the
render loop; React renders only the UI chrome (HUD, tooltips, project dossiers).

## Scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Dev server                         |
| `pnpm build`     | Typecheck + production build       |
| `pnpm preview`   | Serve the production build locally |
| `pnpm lint`      | ESLint                             |
| `pnpm test`      | Vitest unit tests (pure modules)   |
| `pnpm typecheck` | `tsc -b` only                      |
| `pnpm format`    | Prettier (whole repo)              |

## Architecture

Strict one-way layering — each layer only imports the ones above it:

```
data/content.ts        all copy: projects, links, descriptions
   ↑
game/ (pure logic)     physics · ballistics · gravity · spawn · navigation ·
                       effects — plain functions, unit-tested, no DOM
   ↑
game/engine.ts         the only stateful module: owns the canvas, one rAF
                       loop, all entities; emits hover/hit events
   ↑
hooks/                 React ↔ engine glue (useGameEngine, reduced-motion)
   ↑
components/ + App.tsx  UI chrome only — HUD, tooltip, dossier, help; zero
                       game logic, zero per-frame state
```

Rules of thumb: `game/` never imports React; components never mutate game
state (they call engine commands); all copy lives in `data/content.ts`;
every canvas draw call lives in `render.ts` — the engine holds none.

## Controls

- **Click / tap** — shoot · **drag (touch)** — steer
- **Tab / Enter** — target & fire with the keyboard
- **1 2 3** — Home · Projects · Contact · **M** mute · **?** help

## Deploy

Push to `main`: GitHub Actions builds and deploys to Pages
(`.github/workflows/deploy.yml`). No local deploy step.

## Editing content

All copy — projects, descriptions, tech tags, social URLs, resume link — lives in
[`src/data/content.ts`](src/data/content.ts). Game and UI code never hardcode it.
