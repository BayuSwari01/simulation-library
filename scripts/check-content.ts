/**
 * Content checks. Run with `npm run check:content`.
 *
 * Moving content into JSON costs one compile-time guarantee: TypeScript widens
 * JSON string fields, so it can no longer check `category`, `difficulty` and
 * `status` against their unions. This script replaces that guarantee, and adds
 * a few things the compiler never checked in the first place.
 *
 * Whatever this script accepts is what `toSimulationMeta()` in
 * `src/lib/sim/registry.ts` is allowed to assume.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import {
  SIMULATION_CATEGORIES,
  SIMULATION_DIFFICULTIES,
  SIMULATION_STATUSES,
} from '@/lib/sim/types'
import { locales } from '@/i18n'

const SIM_DIR = 'content/simulations'
const UI_DIR = 'content/ui'

let failures = 0

function fail(where: string, message: string) {
  console.log(` FAIL  ${where}: ${message}`)
  failures += 1
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(path, `is not valid JSON — ${(error as Error).message}`)
    return null
  }
}

/** Every leaf path in an object, e.g. "labels.strategies.random". */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

/** Every leaf that is a string, so we can insist none of them are blank. */
function blankLeaves(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return value.trim() === '' ? [prefix] : []
  if (value === null || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => blankLeaves(item, `${prefix}[${index}]`))
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    blankLeaves(child, prefix ? `${prefix}.${key}` : key),
  )
}

function comparePaths(where: string, reference: string[], candidate: string[], label: string) {
  const missing = reference.filter((path) => !candidate.includes(path))
  const extra = candidate.filter((path) => !reference.includes(path))
  if (missing.length > 0) fail(where, `${label} is missing: ${missing.join(', ')}`)
  if (extra.length > 0) fail(where, `${label} has unexpected keys: ${extra.join(', ')}`)
}

/* --- shared UI copy ------------------------------------------------------ */

console.log('\ncontent/ui')

const uiByLocale = new Map<string, unknown>()
for (const locale of locales) {
  const path = join(UI_DIR, `${locale}.json`)
  if (!existsSync(path)) {
    fail(path, 'is missing')
    continue
  }
  const doc = readJson(path)
  if (doc) uiByLocale.set(locale, doc)
}

const uiReference = uiByLocale.get('en')
if (uiReference) {
  const referencePaths = leafPaths(uiReference)
  console.log(`  ok   en.json parsed — ${referencePaths.length} keys`)
  for (const [locale, doc] of uiByLocale) {
    if (locale === 'en') continue
    comparePaths(`${UI_DIR}/${locale}.json`, referencePaths, leafPaths(doc), 'keys vs en.json')
  }
  for (const [locale, doc] of uiByLocale) {
    const blanks = blankLeaves(doc)
    if (blanks.length > 0) fail(`${UI_DIR}/${locale}.json`, `blank strings at ${blanks.join(', ')}`)
  }
}

/* --- simulations --------------------------------------------------------- */

console.log('\ncontent/simulations')

const files = existsSync(SIM_DIR)
  ? readdirSync(SIM_DIR).filter((name) => name.endsWith('.json')).sort()
  : []

if (files.length === 0) fail(SIM_DIR, 'contains no simulation files')

const seenSlugs = new Set<string>()

for (const file of files) {
  const path = join(SIM_DIR, file)
  const doc = readJson(path) as Record<string, unknown> | null
  if (!doc) continue

  const expectedSlug = basename(file, '.json')

  if (doc.slug !== expectedSlug) {
    fail(path, `slug is "${String(doc.slug)}" but the filename says "${expectedSlug}"`)
  }
  if (seenSlugs.has(expectedSlug)) fail(path, `duplicate slug "${expectedSlug}"`)
  seenSlugs.add(expectedSlug)

  const enumChecks = [
    ['category', SIMULATION_CATEGORIES],
    ['difficulty', SIMULATION_DIFFICULTIES],
    ['status', SIMULATION_STATUSES],
  ] as const
  for (const [field, allowed] of enumChecks) {
    const value = doc[field]
    if (!allowed.includes(value as never)) {
      fail(path, `${field} is "${String(value)}" — must be one of ${allowed.join(', ')}`)
    }
  }

  if (!Array.isArray(doc.tags) || doc.tags.length === 0) {
    fail(path, 'tags must be a non-empty array')
  }

  // Locale blocks: English defines the shape, every other locale must match it.
  const reference = doc.en
  if (!reference || typeof reference !== 'object') {
    fail(path, 'is missing the "en" block')
  } else {
    const referencePaths = leafPaths(reference)
    for (const locale of locales) {
      const block = doc[locale]
      if (!block || typeof block !== 'object') {
        fail(path, `is missing the "${locale}" block`)
        continue
      }
      if (locale !== 'en') {
        comparePaths(path, referencePaths, leafPaths(block), `"${locale}" keys vs "en"`)
      }
      const blanks = blankLeaves(block, locale)
      if (blanks.length > 0) fail(path, `blank strings at ${blanks.join(', ')}`)
    }
  }

  // A simulation that claims to be ready must actually have a view to render.
  if (doc.status === 'ready') {
    const viewPath = join('src/simulations', expectedSlug, 'view.tsx')
    if (!existsSync(viewPath)) {
      fail(path, `status is "ready" but ${viewPath} does not exist`)
    }
  }

  console.log(`  ok   ${file}`)
}

console.log(
  failures === 0 ? '\nall content checks passed\n' : `\n${failures} content check(s) failed\n`,
)
process.exit(failures === 0 ? 0 : 1)
