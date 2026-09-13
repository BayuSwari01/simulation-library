import type { Locale } from './config'
import enUi from '@content/ui/en.json'
import idUi from '@content/ui/id.json'

/**
 * Shared UI copy lives in `content/ui/*.json`, not in code, so it can be edited
 * without opening a TypeScript file.
 *
 * The English file is the source of truth for the SHAPE. TypeScript reads the
 * JSON structure, so the annotation below still fails the build if a key is
 * missing from id.json — the same guarantee the old TypeScript dictionaries
 * gave.
 */
export type Dictionary = typeof enUi

const dictionaries: Record<Locale, Dictionary> = { en: enUi, id: idUi }

/** Synchronous and statically imported, so it works in Server and Client Components alike. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}

/**
 * Fills `{n}`-style placeholders. Content must stay plain data — a function in
 * a dictionary cannot cross the Server -> Client boundary.
 */
export function formatCount(one: string, many: string, n: number): string {
  return (n === 1 ? one : many).replace('{n}', String(n))
}

export * from './config'
