import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type {
  SimulationCategory,
  SimulationContent,
  SimulationDifficulty,
  SimulationMeta,
} from './types'
import type { Dictionary, Locale } from '@/i18n'
import loadBalancer from '@content/simulations/load-balancer.json'

export interface SimulationViewProps {
  dict: Dictionary
  locale: Locale
}

/**
 * Text and metadata come from `content/simulations/*.json`; only the code lives
 * under `src/simulations/`.
 *
 * Imports are listed explicitly rather than globbed because Turbopack needs
 * static imports to bundle the JSON for Client Components — `library-browser`
 * reads this list in the browser to drive search and filtering.
 */
const contents: SimulationContent[] = [loadBalancer]

/**
 * Narrows the widened JSON strings into the unions the app uses.
 * Safe because `npm run check:content` rejects any value outside them.
 */
function toSimulationMeta(content: SimulationContent): SimulationMeta {
  return {
    slug: content.slug,
    title: { en: content.en.title, id: content.id.title },
    blurb: { en: content.en.blurb, id: content.id.blurb },
    category: content.category as SimulationCategory,
    difficulty: content.difficulty as SimulationDifficulty,
    tags: content.tags,
    status: content.status as SimulationMeta['status'],
  }
}

export const simulations: SimulationMeta[] = contents.map(toSimulationMeta)

/** Lazily loaded views, so a page ships only the simulation it shows. */
const views: Record<string, ComponentType<SimulationViewProps>> = {
  'load-balancer': dynamic(() => import('@/simulations/load-balancer/view')),
}

export function getSimulationMeta(slug: string): SimulationMeta | undefined {
  return simulations.find((simulation) => simulation.slug === slug)
}

export function getSimulationView(slug: string): ComponentType<SimulationViewProps> | undefined {
  return views[slug]
}
