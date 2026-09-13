import { notFound } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'
import { SimulationCard } from '@/components/library/simulation-card'
import { simulations } from '@/lib/sim/registry'
import { getDictionary, isLocale, type Locale } from '@/i18n'

export default async function LandingPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale as Locale)
  const featured = simulations.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      {/* --- hero --- */}
      <section className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-32">
        <div className="max-w-2xl">
          <p className="text-accent font-mono text-[0.6875rem] tracking-[0.18em] uppercase">
            {dict.landing.eyebrow}
          </p>
          <h1 className="font-serif mt-5 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {dict.landing.title}
          </h1>
          <p className="text-ink-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
            {dict.landing.lede}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href={`/${locale}/library`} size="lg">
              {dict.landing.cta}
            </ButtonLink>
            <span className="text-ink-faint text-xs">{dict.landing.ctaHint}</span>
          </div>
        </div>

        <HeroMotif />
      </section>

      {/* --- how it works --- */}
      <section className="border-rule-soft border-t py-16">
        <h2 className="text-ink-faint font-mono text-[0.6875rem] tracking-[0.18em] uppercase">
          {dict.landing.howTitle}
        </h2>
        <ol className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {dict.landing.how.map((item, index) => (
            <li key={item.title}>
              <span className="text-accent tabular font-mono text-xs">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-serif text-ink-strong mt-2 text-lg">{item.title}</h3>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* --- featured --- */}
      <section className="border-rule-soft border-t py-16">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-serif text-ink-strong text-2xl">{dict.landing.featuredTitle}</h2>
          <ButtonLink href={`/${locale}/library`} variant="outline" size="sm">
            {dict.landing.featuredCta}
          </ButtonLink>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((simulation) => (
            <SimulationCard
              key={simulation.slug}
              simulation={simulation}
              locale={locale as Locale}
              dict={dict}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * Decorative only: a still frame of the kind of diagram the library is made
 * of. Hidden below lg, where the column would be too narrow to read.
 */
function HeroMotif() {
  const rows = [58, 104, 150, 196]
  return (
    <svg
      viewBox="0 0 300 254"
      className="hidden h-auto w-[300px] lg:block"
      aria-hidden
      fill="none"
    >
      <rect x="1" y="94" width="44" height="66" rx="4" stroke="var(--rule-strong)" strokeWidth="1.5" />
      <line x1="45" y1="127" x2="96" y2="127" stroke="var(--rule-base)" strokeWidth="1.5" />
      <rect x="96" y="88" width="56" height="78" rx="5" stroke="var(--accent-base)" strokeWidth="2" />
      {rows.map((y) => (
        <path
          key={y}
          d={`M 152 127 C 186 127 194 ${y} 228 ${y}`}
          stroke="var(--rule-base)"
          strokeWidth="1.5"
        />
      ))}
      {rows.map((y, index) => (
        <rect
          key={y}
          x="228"
          y={y - 13}
          width="70"
          height="26"
          rx="4"
          stroke={index === 1 ? 'var(--sim-warn)' : 'var(--rule-strong)'}
          strokeWidth="1.5"
        />
      ))}
      <circle cx="70" cy="127" r="4.5" fill="var(--sim-active)" />
      <circle cx="196" cy="112" r="4.5" fill="var(--sim-active)" />
      <circle cx="212" cy="176" r="4.5" fill="var(--sim-active)" />
    </svg>
  )
}
