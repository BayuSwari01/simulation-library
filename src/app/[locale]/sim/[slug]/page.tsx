import { createElement } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { getSimulationMeta, getSimulationView, simulations } from '@/lib/sim/registry'
import { getDictionary, isLocale, locales, type Locale } from '@/i18n'

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    simulations
      .filter((simulation) => simulation.status === 'ready')
      .map((simulation) => ({ locale, slug: simulation.slug })),
  )
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await props.params
  const simulation = getSimulationMeta(slug)
  if (!simulation || !isLocale(locale)) return {}
  return {
    title: simulation.title[locale as Locale],
    description: simulation.blurb[locale as Locale],
  }
}

export default async function SimulationPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await props.params
  if (!isLocale(locale)) notFound()

  const simulation = getSimulationMeta(slug)
  const view = getSimulationView(slug)
  if (!simulation || simulation.status !== 'ready' || !view) notFound()

  const dict = getDictionary(locale as Locale)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href={`/${locale}/library`}
        className="text-ink-faint hover:text-ink-strong inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-wide transition-colors"
      >
        <span aria-hidden>&larr;</span>
        {dict.sim.backToLibrary}
      </Link>

      <header className="mt-6 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">{dict.categories[simulation.category]}</Badge>
          <span className="text-ink-faint font-mono text-[0.6875rem] tracking-wide">
            {dict.difficulty[simulation.difficulty]}
          </span>
        </div>
        <h1 className="font-serif mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {simulation.title[locale as Locale]}
        </h1>
        <p className="text-ink-muted mt-3 max-w-2xl text-base leading-relaxed">
          {simulation.blurb[locale as Locale]}
        </p>
      </header>

      {createElement(view, { dict, locale: locale as Locale })}
    </div>
  )
}
