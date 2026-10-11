# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`, project references in `tsconfig.app.json` / `tsconfig.node.json`) then production build to `dist/`
- `npm run lint` — Oxlint (config in `.oxlintrc.json`: react, typescript, oxc plugins; `rules-of-hooks` is an error)
- `npm run preview` — serve the built `dist/`

There is no test suite. Type-checking is strict about unused locals/parameters (`noUnusedLocals`, `noUnusedParameters`), and `erasableSyntaxOnly` + `verbatimModuleSyntax` are on, so use `import type` for type-only imports and avoid enums/namespaces/parameter properties.

## Architecture

Single-page React 19 + TypeScript app (Vite) that shows upcoming rocket launches on an interactive 3D globe. No router and no state library — all app state lives in `src/App.tsx` (launch list, selected launch, country filter, mobile list-sheet open state) and flows down as props.

**Data flow**
- `src/api/launches.ts` fetches the next 30 launches from The Space Devs Launch Library 2 API (`/2.2.0/launch/upcoming/?mode=detailed`) and normalizes the raw (untyped) response into the `Launch` shape in `src/types.ts` via `mapLaunch`. Launches without valid pad coordinates are dropped; results are sorted by `net` (launch time).
- Responses are cached in `localStorage` (`rlw-launches-v2`, 30-minute TTL — bump the key when the `Launch` shape changes). `App` re-polls every 10 minutes; passing `force=true` (the Retry button) bypasses the cache.
- API base URL comes from `VITE_LL_BASE`. `.env.development` points dev at `lldev.thespacedevs.com` (the rate-limit-friendly dev mirror with stale data); production falls back to `ll.thespacedevs.com`, which is heavily rate-limited for anonymous requests — hence the cache.
- Missing Wikipedia links fall back to a Wikipedia search URL.
- `Launch.images` is an ordered list of candidate pictures (launch → rocket → mission patch → provider → pad map → provider logo). Many API image URLs 404, so `LaunchDetail`'s `Hero` falls through them on `onError` and ends on a CSS-drawn beacon placeholder (`.hero-fallback`). Don't use the rocket emoji anywhere (UI, source, docs).

**Shared helpers**
- `src/useNow.ts` holds more than the `useNow` ticking hook: also `tMinus` (T-/T+ countdown formatting) and `statusColor` (launch status abbrev → color), used by both the globe and the UI panels.
- `src/countries.ts` converts Launch Library's ISO alpha-3 country codes to alpha-2 for flag emoji via a hand-maintained map — add entries there when a new provider country shows up as 🌐.

**Globe (`src/components/LaunchGlobe.tsx`)**
- Wraps `react-globe.gl` (three.js). Launches are grouped into `Pad`s by lat/lng rounded to 2 decimals; clicking a pad selects its earliest launch.
- Pads render as glowing beacons via the objects layer (`makeBeacon`: additive glow sprite + white core + tapered beam with a fading canvas-gradient texture; materials cached per status color). Beam height encodes how soon the launch is; a `requestAnimationFrame` loop makes the next launch's and the selected pad's beacons pulse. `objectThreeObject` must stay referentially stable (`useCallback`) or react-globe.gl rebuilds every object on each render.
- Rings pulse on the next 5 launches plus the selection; arcs are synthetic eastward "ascent" paths for the next 12 (not real trajectories).
- Globe textures are loaded from unpkg (`three-globe` example images), not bundled.
- Camera: intro swoop + auto-rotate on mount; selecting a launch stops auto-rotation and flies the camera to it. The globe is sized to the window, not its container.
- Hover labels are raw HTML strings, styled by `.gl-*` classes in `src/index.css`.

**UI** — `framer-motion` handles entry animations and the `LaunchDetail` modal (`AnimatePresence`). All styling is in `src/index.css`; below 760px the side list becomes a bottom sheet toggled by `.side.open`.
