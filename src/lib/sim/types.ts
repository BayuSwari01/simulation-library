import type { Locale } from '@/i18n'

/**
 * The contract every simulation implements.
 *
 * An engine is plain TypeScript: it must NOT import React, touch the DOM, or
 * read the clock. Its only requirement is DETERMINISM — the same
 * (config, seed) must always produce the same sequence of states.
 *
 * `step` is allowed to mutate and return the same state object; we re-render
 * every frame anyway, so allocating a fresh state 60 times a second would be
 * waste. What it may never do is depend on anything outside `state`, `dt` and
 * `state`'s own seeded Rng.
 */
export interface SimulationEngine<TState, TConfig> {
  createInitialState(config: TConfig, seed: number): TState
  /** Advance by exactly `dt` seconds. `dt` is always the same fixed value. */
  step(state: TState, dt: number): TState
  /** Optional: when true, the runner stops and reports the run as finished. */
  isComplete?(state: TState): boolean
}

/**
 * The allowed values, as runtime arrays so that content validation and the
 * library filters share one source of truth. Array order is display order.
 */
export const SIMULATION_CATEGORIES = [
  'distributed-systems',
  'networking',
  'blockchain',
  'algorithms',
] as const

export const SIMULATION_DIFFICULTIES = ['intro', 'intermediate', 'advanced'] as const

export const SIMULATION_STATUSES = ['ready', 'coming-soon'] as const

export type SimulationCategory = (typeof SIMULATION_CATEGORIES)[number]

export type SimulationDifficulty = (typeof SIMULATION_DIFFICULTIES)[number]

export type SimulationStatus = (typeof SIMULATION_STATUSES)[number]

export interface SimulationMeta {
  slug: string
  title: Record<Locale, string>
  /** One or two sentences. Shown on the library card and above the stage. */
  blurb: Record<Locale, string>
  category: SimulationCategory
  difficulty: SimulationDifficulty
  /** Lowercase, language-neutral keywords used by the library search. */
  tags: string[]
  status: SimulationStatus
}

/**
 * Shape of a `content/simulations/<slug>.json` file.
 *
 * `category`, `difficulty` and `status` are plain `string` here on purpose:
 * TypeScript widens JSON string fields, so it cannot check them against the
 * unions above. `npm run check:content` validates them instead — that script is
 * what makes the narrowing in `toSimulationMeta()` safe.
 */
export interface SimulationLocaleContent {
  title: string
  blurb: string
}

export interface SimulationContent {
  slug: string
  category: string
  difficulty: string
  status: string
  tags: string[]
  en: SimulationLocaleContent
  id: SimulationLocaleContent
}
