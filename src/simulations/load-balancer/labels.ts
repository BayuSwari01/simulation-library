import type { Locale } from '@/i18n'
import content from '@content/simulations/load-balancer.json'
import type { Strategy } from './config'

/**
 * Typed access to this simulation's own labels, which live in
 * `content/simulations/load-balancer.json` alongside its title and blurb.
 *
 * The English block is the source of truth for the shape. The Record annotation
 * below makes TypeScript check the Indonesian block against it, so a label that
 * is never translated fails `npm run typecheck` — the same guard the global
 * dictionary has.
 */
const byLocale: Record<Locale, typeof content.en> = { en: content.en, id: content.id }

type LabelKey = Exclude<keyof typeof content.en.labels, 'strategies'>

export function lbText(key: LabelKey, locale: Locale): string {
  return byLocale[locale].labels[key]
}

export function lbStrategyText(strategy: Strategy, locale: Locale): string {
  return byLocale[locale].labels.strategies[strategy]
}
