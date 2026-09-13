import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SimulationMeta } from '@/lib/sim/types'
import type { Dictionary, Locale } from '@/i18n'

/**
 * A catalogue card. Ready entries are links; entries still in preparation are
 * shown dimmed rather than hidden, so the shelf shows where it is heading.
 */
export function SimulationCard({
  simulation,
  locale,
  dict,
}: {
  simulation: SimulationMeta
  locale: Locale
  dict: Dictionary
}) {
  const ready = simulation.status === 'ready'

  const body = (
    <>
      <div className="flex items-center gap-2">
        <Badge tone={ready ? 'accent' : 'quiet'}>{dict.categories[simulation.category]}</Badge>
        <span className="text-ink-faint ml-auto font-mono text-[0.6875rem] tracking-wide">
          {dict.difficulty[simulation.difficulty]}
        </span>
      </div>

      <h3
        className={cn(
          'font-serif mt-3 text-xl leading-snug font-semibold',
          ready && 'group-hover:text-accent transition-colors',
        )}
      >
        {simulation.title[locale]}
      </h3>

      <p className="text-ink-muted mt-2 line-clamp-4 text-sm leading-relaxed">
        {simulation.blurb[locale]}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {simulation.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-ink-faint font-mono text-[0.6875rem]">
            {tag}
          </span>
        ))}
        {!ready && (
          <Badge tone="lamp" className="ml-auto">
            {dict.library.comingSoon}
          </Badge>
        )}
      </div>
    </>
  )

  const shell = cn(
    'relative flex flex-col rounded-sm border p-5 transition-all',
    ready
      ? 'group border-rule bg-card hover:border-accent/50 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-12px_var(--ink-strong)]'
      : 'border-rule-soft border-dashed bg-transparent opacity-70',
  )

  if (!ready) {
    return (
      <article className={shell}>
        {body}
      </article>
    )
  }

  return (
    <Link href={`/${locale}/sim/${simulation.slug}`} className={cn(shell, 'focus-visible:border-accent')}>
      {body}
    </Link>
  )
}
