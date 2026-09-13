# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

A public website hosting **animated models of technical concepts** — load balancers,
consensus, distributed systems, networking. Each entry is a small simulation the
visitor **watches**: play, pause, step one tick, change speed, adjust a few
parameters. Nothing is a game and nothing is drag-and-drop.

Two things are non-negotiable:

- **The scope of the code stays small.** Prefer deleting to adding.
- **The visual quality stays high.** Small does not mean plain.

Design direction: light theme is **aged, slightly yellowed paper**; dark theme is
**the same library at night** — deep warm brown-black, parchment ink, lamplight
accents. Never a cold blue-grey dashboard dark.

## Commands

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build
npm run lint        # ESLint (next build does NOT lint — Next 16 removed `next lint`)
npm run typecheck   # tsc --noEmit
npm run check:sim   # headless engine determinism + invariant checks
npm run check:content # validates content/**.json
npm run check       # both check scripts
```

Run `lint`, `typecheck` and `check` before declaring work finished.

## Stack

`next@16` (App Router) · `react@19` · `tailwindcss@4` · `next-themes` ·
`typescript@6`

Runtime dependencies are only: `next`, `react`, `react-dom`, `next-themes`,
`clsx`, `tailwind-merge`. Keep it that way.

**Prohibited dependencies:**
- **React Flow / xyflow**: Use hand-written SVG instead.
- **Chart libraries (Recharts, etc.)**: SVG can draw metrics in a few lines.
- **Global state (Zustand, Redux)**: `useSimulation` holds state in a ref; there is no cross-page state.
- **Full i18n libraries**: Typed dictionary objects are sufficient for the two locales.
- **React Compiler**: Conflicts with the hand-written rAF loop. Leave `reactCompiler` off.
- **Motion / Framer Motion**: The rAF loop and CSS transitions already handle all animations.

## Documentation

`README.md` is the only prose doc — orientation, commands, routes, content layout.

README also has a short, plain-language **"Adding a simulation"** section (3 steps) for
the project owner. The full technical checklist below stays the source of truth. If you
change the steps here — a file added or removed from a simulation folder, a new
registration point — update that README section in the same change.

## Layout of the code

```
content/                     ALL user-facing text. Editable without touching code.
├── ui/{en,id}.json          Shared chrome: nav, buttons, category names.
└── simulations/<slug>.json  Per simulation: metadata + its own labels, both locales.

src/
├── app/[locale]/            Routes. This IS the root layout (html/body live here,
│                            so <html lang> can follow the locale).
├── i18n/                    Locale config + en/id dictionaries.
├── components/
│   ├── layout/              Header, footer, theme toggle, locale switcher, texture.
│   ├── ui/                  Button, Badge, Rule, SelectField, RangeField.
│   ├── library/             Catalogue card + the search/filter browser.
│   └── sim/                 SimStage, SimControls, SimLegend, SimMetrics, Panel.
├── lib/
│   ├── sim/
│   │   ├── types.ts         The SimulationEngine contract + metadata types.
│   │   ├── rng.ts           Seeded PRNG. The only source of randomness.
│   │   ├── use-simulation.ts  The single rAF fixed-timestep runner.
│   │   └── registry.ts      Every simulation's metadata + lazy view loaders.
│   └── utils.ts             cn().
├── simulations/<slug>/      One folder per simulation.
└── scripts/                 Headless engine checks.
```

## Adding a simulation

Follow this order. The reference implementation to copy is
`src/simulations/load-balancer/`.

1. `content/simulations/<slug>.json` — **all** of its text: metadata (category,
   difficulty, status, tags) plus a `title`, `blurb` and `labels` block per locale.
   The filename must equal the `slug` field.
2. `src/simulations/<slug>/config.ts` — the config interface, its defaults, and
   slider limits.
3. `src/simulations/<slug>/engine.ts` — the model. **Framework-free**: no React
   import, no DOM, no `Date.now()`, no `Math.random()`.
4. `src/simulations/<slug>/labels.ts` — the typed accessor over that JSON's
   `labels`. Copy `load-balancer/labels.ts`; the `Record<Locale, typeof content.en>`
   annotation in it is what makes a missing translation a type error.
5. `src/simulations/<slug>/view.tsx` — `'use client'`, default export, props
   `{ dict, locale }`. Calls `useSimulation` and renders into `SimStage`.
6. Register it in `src/lib/sim/registry.ts`: one JSON import added to `contents`,
   one entry added to `views`.
7. Add a section to `scripts/check-simulations.ts`.

Simulation folders contain **code only**. There is no `meta.ts` and no `copy.ts` —
that content lives in `content/simulations/<slug>.json`.

Set `status: 'coming-soon'` for entries you have not built yet — they appear
dimmed on the shelves and are not routable. A `ready` entry without a
`view.tsx` fails `npm run check:content`.

## Rules

### Colour — never write a literal colour

Every colour comes from a semantic token. There are **no** `#hex` values, no
`bg-amber-100`, no `text-gray-900`, no `rgb()` anywhere outside `globals.css`.

- In JSX: `bg-paper`, `text-ink-muted`, `border-rule`, `text-accent`, `bg-sim-warn`, …
- In SVG: `fill="var(--sim-active)"`, `stroke="var(--rule-strong)"`, …

Tokens live in `src/app/globals.css`. Two hard requirements when adding one:

1. Define its raw value in **both** `:root` and `.dark`.
2. Map it inside **`@theme inline`**, not `@theme`. Tailwind v4 resolves a
   non-`inline` token once at `:root`, and the `.dark` override then silently
   does nothing. This is the most common v4 dark-mode bug.

Also note: `@custom-variant dark (&:where(.dark, .dark *));` at the top of
`globals.css` is what makes class-based dark mode work at all. Tailwind v4 has
no `darkMode` config option. Do not remove that line.

Careful with CSS comments: a `*/` inside a comment (e.g. writing `bg-*/text-*`)
terminates it early and breaks the stylesheet.

### Text — never hardcode a user-facing string, and never put text in code

Every user-facing string lives under `content/`, reached through the `@content/*`
alias. Nothing in `src/` should contain prose.

- Shared chrome → `content/ui/{en,id}.json`, read via `getDictionary()`.
- Text owned by one simulation → that simulation's `content/simulations/<slug>.json`.
  The global dictionary is for what **every** page shares; putting a simulation's
  labels there makes it grow with every new entry.

**English defines the shape; every other locale is checked against it.** Both
`src/i18n/index.ts` and each `labels.ts` annotate the locale map as
`Record<Locale, typeof <english block>>`, so a key missing from `id` is a
**compile error**. Keep that annotation when you add a locale block.

**Content must be JSON, and plain data.** Two separate reasons, both load-bearing:

1. A function cannot cross the Server → Client Component boundary — it fails the
   build. For counts and interpolation use a `{n}` placeholder plus
   `formatCount()` from `@/i18n`.
2. `library-browser.tsx` and `not-found-content.tsx` are **Client Components**
   that read this content, so it must be statically importable. Never load
   content with `fs` — that only works on the server and will break them.

**What the compiler cannot check, `npm run check:content` does.** TypeScript
widens JSON strings, so `category`, `difficulty` and `status` are only validated
by that script — along with slug/filename agreement, blank strings, duplicate
slugs, and label-key parity between locales. `toSimulationMeta()` in
`registry.ts` narrows those fields with a cast that is only safe because the
script runs. Run it after touching anything under `content/`.

### Simulations

- The engine never imports React and never touches the DOM.
- **All randomness goes through `Rng` from `@/lib/sim/rng`**, seeded from state.
  Never `Math.random()` inside an engine. This is what makes Reset an exact
  replay and makes bugs reproducible.
- `step(state, dt)` is called with a **fixed** `dt`. It may mutate and return the
  same object — allocating a fresh state 60 times a second is waste — but it must
  be **deterministic**: it may depend on nothing outside `state` and `dt`.
- Never drive an animation with `setInterval` or `setTimeout`. `useSimulation`
  is the only animation loop in the project.
- Speed multiplies how much simulated time a real frame buys. It never changes
  `dt`. That is why 4× produces the same run as 1×.
- Per-frame state belongs in a ref, never `useState`.

`use-simulation.ts` carries a file-level `eslint-disable` for `react-hooks/refs`
and `react-hooks/set-state-in-effect`, with the reasoning written at the top.
**Do not copy that suppression into any other file.**

### Responsive — desktop-first, mobile-correct

Many of these diagrams only make sense laid out horizontally, so:

- Build and check at **1440px first**, then verify **768px** and **390px**.
- Write classes in Tailwind's normal mobile-first style anyway; "desktop-first"
  is about which layout you design for, not about class order.
- **Never squash a stage to fit a phone.** `SimStage` keeps a `minWidth` and
  scrolls horizontally inside its own container. The page body must never scroll
  sideways.
- `SimControls` is sticky at the bottom on small screens so it stays reachable.

### Accessibility & motion

- Respect `prefers-reduced-motion`: `useSimulation` will not autoplay under it,
  and `globals.css` neutralises transitions. Do not add motion that ignores it.
- Every stage passes a `label` to `SimStage`, which becomes the SVG `<title>`.
- Metric numbers use the `.tabular` class so they do not jitter while running.

### Next.js 16 specifics

- `params` and `searchParams` are **Promises**: `const { locale } = await props.params`.
- `useSearchParams()` in a client component needs a `<Suspense>` boundary, or
  prerendering fails.
- Turbopack is the default builder. **Adding a custom webpack config breaks the
  build.** Don't.
- `middleware.ts` is now `proxy.ts`. The `/` → `/en` redirect lives in
  `next.config.ts` instead; keep it there.
- `<html>` needs `suppressHydrationWarning` because next-themes writes the theme
  class onto it before hydration. It is already set — leave it.
- Do not upgrade to `typescript@7`. It drops the JS compiler API and
  `typescript-eslint` rejects it (peer `<6.1.0`).
- ESLint stays on v9. `eslint-plugin-react`, bundled inside `eslint-config-next`,
  still calls the removed `context.getFilename()` API and crashes on ESLint 10.

## Things not to do

- Don't add a dependency without a concrete need the current stack cannot meet.
- Don't abstract until there are **two** real cases.
- Don't hardcode stage pixel sizes in an engine. Geometry belongs in the view.
- Don't put simulation-specific strings in the global dictionary.
- Don't re-read a theme value in JavaScript to pick a colour when a CSS class
  can do it — that is what forces `mounted` guards and hydration mismatches.
