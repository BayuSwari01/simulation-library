'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SimulationCard } from './simulation-card'
import { Button } from '@/components/ui/button'
import { simulations } from '@/lib/sim/registry'
import {
  SIMULATION_CATEGORIES,
  SIMULATION_DIFFICULTIES,
  type SimulationCategory,
  type SimulationDifficulty,
} from '@/lib/sim/types'
import { formatCount, type Dictionary, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

// Order and membership come from the single source of truth in lib/sim/types.
const CATEGORY_ORDER = SIMULATION_CATEGORIES
const DIFFICULTIES = SIMULATION_DIFFICULTIES

function normalise(value: string) {
  return value.toLowerCase().normalize('NFKD')
}

export function LibraryBrowser({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const category = (params.get('cat') ?? '') as SimulationCategory | ''
  const difficulty = (params.get('depth') ?? '') as SimulationDifficulty | ''

  /** Filter state lives in the URL, so a filtered shelf can be shared. */
  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      const search = next.toString()
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )

  const onQueryChange = (value: string) => {
    setQuery(value)
    setParam('q', value)
  }

  const clear = () => {
    setQuery('')
    router.replace(pathname, { scroll: false })
  }

  const matches = useMemo(() => {
    const needle = normalise(query.trim())
    return simulations.filter((simulation) => {
      if (category && simulation.category !== category) return false
      if (difficulty && simulation.difficulty !== difficulty) return false
      if (!needle) return true
      const haystack = normalise(
        [
          simulation.title.en,
          simulation.title.id,
          simulation.blurb[locale],
          dict.categories[simulation.category],
          ...simulation.tags,
        ].join(' '),
      )
      return needle.split(/\s+/).every((token) => haystack.includes(token))
    })
  }, [query, category, difficulty, locale, dict])

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => ({
        key,
        items: matches.filter((simulation) => simulation.category === key),
      })).filter((group) => group.items.length > 0),
    [matches],
  )

  const filtersActive = Boolean(query || category || difficulty)

  return (
    <div className="flex flex-col gap-8">
      {/* --- search & filters --- */}
      <div className="border-rule-soft flex flex-col gap-4 border-y py-5 lg:flex-row lg:items-end lg:gap-6">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="library-search"
            className="text-ink-faint block text-[0.6875rem] tracking-wide uppercase"
          >
            {dict.library.searchLabel}
          </label>
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={dict.library.searchPlaceholder}
            className="border-rule bg-card text-ink-strong placeholder:text-ink-faint hover:border-rule-strong mt-1.5 h-10 w-full rounded-sm border px-3 text-sm transition-colors"
          />
        </div>

        <FilterGroup
          label={dict.library.categoryLabel}
          allLabel={dict.library.allCategories}
          value={category}
          options={CATEGORY_ORDER.map((key) => ({ value: key, label: dict.categories[key] }))}
          onChange={(value) => setParam('cat', value)}
        />

        <FilterGroup
          label={dict.library.difficultyLabel}
          allLabel={dict.library.allDifficulties}
          value={difficulty}
          options={DIFFICULTIES.map((key) => ({ value: key, label: dict.difficulty[key] }))}
          onChange={(value) => setParam('depth', value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <p className="text-ink-faint font-mono text-xs tracking-wide">
          {formatCount(dict.library.resultCountOne, dict.library.resultCountMany, matches.length)}
        </p>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clear}>
            {dict.library.clear}
          </Button>
        )}
      </div>

      {/* --- shelves --- */}
      {grouped.length === 0 ? (
        <div className="border-rule-soft rounded-sm border border-dashed px-6 py-16 text-center">
          <h2 className="font-serif text-ink-strong text-xl">{dict.library.emptyTitle}</h2>
          <p className="text-ink-muted mx-auto mt-2 max-w-sm text-sm">{dict.library.emptyBody}</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.key}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-serif text-ink-strong text-lg">{dict.categories[group.key]}</h2>
              <span className="border-rule-soft h-px flex-1 border-t" />
              <span className="text-ink-faint tabular font-mono text-[0.6875rem]">
                {group.items.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((simulation) => (
                <SimulationCard
                  key={simulation.slug}
                  simulation={simulation}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function FilterGroup<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string
  allLabel: string
  value: T | ''
  options: { value: T; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0">
      <span className="text-ink-faint block text-[0.6875rem] tracking-wide uppercase">{label}</span>
      <div className="ring-rule mt-1.5 flex flex-wrap items-center rounded-sm ring-1">
        {[{ value: '' as T | '', label: allLabel }, ...options].map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                'h-10 px-3 text-xs whitespace-nowrap transition-colors first:rounded-l-sm last:rounded-r-sm',
                active
                  ? 'bg-accent-wash text-accent'
                  : 'text-ink-muted hover:text-ink-strong hover:bg-accent-wash/50',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
