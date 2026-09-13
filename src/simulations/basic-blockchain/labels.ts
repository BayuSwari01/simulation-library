import type { Locale } from '@/i18n'
import content from '@content/simulations/basic-blockchain.json'

type Labels = typeof content.en.labels

export function bcText(key: keyof Labels, locale: Locale): string {
  const map: Record<Locale, Labels> = {
    en: content.en.labels,
    id: content.id.labels,
  }
  return map[locale][key]
}
