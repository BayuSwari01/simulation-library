# Simulation Library

An open library of animated models of technical concepts.

Simulation Library explains how systems like load balancers, consensus protocols and
network congestion control actually behave. Each entry is a small, watchable
simulation: press play, slow it down, step through it one tick at a time, and change
its parameters to see what happens.

---

## Contents

- [Features](#features)
- [Simulations](#simulations)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Routes](#routes)
- [Project structure](#project-structure)
- [Content management](#content-management)
- [Adding a simulation](#adding-a-simulation)
- [Deployment](#deployment)
- [Further reading](#further-reading)

---

## Features

- **Watchable models.** Every simulation can be played, paused, stepped one tick at a
  time, run at 0.25× to 4× speed, and reconfigured with a few parameters.
- **Deterministic runs.** All randomness comes from a seeded generator, so *Reset*
  replays exactly the same run. What you saw can always be seen again.
- **Bilingual.** Full English and Indonesian versions of every page.
- **Two themes.** A light theme styled as aged paper, and a dark theme styled as the
  same library at night.
- **Fully static.** Every page is prerendered to HTML at build time. Simulations run
  entirely in the browser.
- **Lightweight.** Visuals are hand-drawn SVG. There are no charting or animation
  libraries.
- **Accessible motion.** Simulations do not autoplay when the operating system requests
  reduced motion.

## Simulations

| Simulation | Category | Status |
|---|---|---|
| Load Balancer | Distributed Systems | Available |
| Consistent Hashing | Distributed Systems | Coming soon |
| Proof of Work | Blockchain | Coming soon |
| TCP Congestion Control | Networking | Coming soon |

Entries marked *Coming soon* are listed in the library but cannot be opened yet.

## Tech stack

| Area | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| Language | [TypeScript 6](https://www.typescriptlang.org) |
| Analytics | [Vercel Web Analytics](https://vercel.com/docs/analytics) |

The project has seven runtime dependencies: `next`, `react`, `react-dom`, `next-themes`,
`clsx`, `tailwind-merge` and `@vercel/analytics`.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20.9.0 or later
- npm

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to the
English site at `/en`.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check the project with `tsc` |
| `npm run check:sim` | Verify that simulation engines are deterministic, without a browser |
| `npm run check:content` | Validate every file in `content/` |
| `npm run check` | Run `check:sim` and `check:content` together |

Before considering a change complete, run:

```bash
npm run lint && npm run typecheck && npm run check
```

> `npm run build` does not run the linter. Next.js 16 removed linting from the build,
> so `npm run lint` must be run separately.

## Routes

| Route | Page |
|---|---|
| `/` | Redirects to `/en` |
| `/[locale]` | Landing page |
| `/[locale]/library` | Library, with search and filters |
| `/[locale]/sim/[slug]` | A single simulation |

Supported locales are `en` (English) and `id` (Indonesian).

## Project structure

```
content/                   All visitor-facing text
├── ui/                    Shared interface text, one file per language
└── simulations/           One file per simulation

src/
├── app/[locale]/          Routes and the root layout
├── components/
│   ├── layout/            Header, footer, theme toggle, language switcher
│   ├── library/           Library catalogue cards, search and filters
│   ├── sim/               Simulation stage, controls, legend and metrics
│   └── ui/                Buttons, badges and form controls
├── i18n/                  Locale configuration and dictionary loader
├── lib/sim/               Simulation contract, seeded RNG, animation loop, registry
└── simulations/<slug>/    Code for one simulation

scripts/                   Engine and content checks
```

## Content management

All visitor-facing text lives in `content/`, not in the source code. Text can be added,
edited or translated without changing any TypeScript.

```
content/
├── ui/
│   ├── en.json                 Navigation, buttons, category names
│   └── id.json
└── simulations/
    ├── load-balancer.json      Metadata, title, description and labels
    ├── consistent-hashing.json
    ├── proof-of-work.json
    └── tcp-congestion.json
```

Each simulation file holds its metadata (category, difficulty, status and tags) and a
complete block of text for each language:

```json
{
  "slug": "load-balancer",
  "category": "distributed-systems",
  "difficulty": "intro",
  "status": "ready",
  "tags": ["load balancing", "round robin", "queue"],
  "en": { "title": "Load Balancer", "blurb": "…", "labels": { "…": "…" } },
  "id": { "title": "Load Balancer", "blurb": "…", "labels": { "…": "…" } }
}
```

Two checks keep the content consistent:

| Check | Fails when |
|---|---|
| `npm run typecheck` | A key exists in English but is missing from Indonesian |
| `npm run check:content` | A category, difficulty or status is not recognised; a `slug` does not match its filename; a string is blank; a slug is duplicated; or a simulation is marked `ready` but has no view |

## Adding a simulation

Adding a simulation takes three steps.

### 1. Write the content

Create `content/simulations/<slug>.json` with the title, description and labels in both
English and Indonesian. The filename must match the `slug` field inside the file.

### 2. Write the code

Create a folder at `src/simulations/<slug>/` containing four files:

| File | Purpose |
|---|---|
| `config.ts` | Simulation settings, such as the number of servers |
| `engine.ts` | How the simulation behaves |
| `labels.ts` | Typed access to the labels in the content file |
| `view.tsx` | The drawing and animation |

The simplest way to start is to copy `src/simulations/load-balancer/` and adapt it.

### 3. Register it

Add two lines to `src/lib/sim/registry.ts`: one importing the content file, and one
registering the view.

Then run:

```bash
npm run check
```

Once the checks pass, the simulation appears in the library automatically and gets its
own page in both languages. No routes or menus need to be changed.

> **Coming soon entries.** Consistent Hashing, Proof of Work and TCP Congestion Control
> already have a content file and are already imported in the registry. To finish one,
> create its code folder, register its view, and change its `status` from `coming-soon`
> to `ready`.

The full technical checklist, including the rules every engine must follow, is in the
*Adding a simulation* section of [`CLAUDE.md`](CLAUDE.md).

## Deployment

The project is built for deployment on [Vercel](https://vercel.com). Every page is
statically prerendered, so there is no server runtime to operate.

Visitor analytics use Vercel Web Analytics. Enable it once in the Vercel dashboard
(project → **Analytics** → **Enable**), then redeploy. Nothing is collected in
`npm run dev` — only on Vercel deployments.

To produce and preview a production build locally:

```bash
npm run build
npm run start
```

## Further reading

[`CLAUDE.md`](CLAUDE.md) documents the rules for working in this codebase: colour
tokens, content rules, the simulation engine contract, and known Next.js 16 pitfalls.
