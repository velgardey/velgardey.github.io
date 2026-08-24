# Space Portfolio

A hyper-interactive portfolio: pilot a spacecraft at the centre of the screen and
shoot planets to explore projects, résumé and social links.

Built with **Vite · React 19 · TypeScript · Canvas 2D** — one game engine owns the
render loop; React renders only the UI chrome (HUD, tooltips, project dossiers).

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `pnpm dev`      | Dev server                       |
| `pnpm build`    | Typecheck + production build     |
| `pnpm lint`     | ESLint                           |
| `pnpm test`     | Vitest unit tests (pure modules) |
| `pnpm format`   | Prettier                         |

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
