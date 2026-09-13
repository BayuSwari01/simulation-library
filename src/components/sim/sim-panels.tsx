'use client'

import { cn } from '@/lib/utils'
import type { Dictionary } from '@/i18n'

export interface LegendItem {
  /** A Tailwind colour utility built from a sim token, e.g. `bg-sim-active`. */
  swatch: string
  label: string
  shape?: 'square' | 'dot' | 'line'
}

export function SimLegend({ items, dict }: { items: LegendItem[]; dict: Dictionary }) {
  return (
    <Panel title={dict.sim.legend}>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {items.map((item) => (
          <li key={item.label} className="text-ink-muted flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className={cn(
                'shrink-0',
                item.shape === 'dot' && 'h-2.5 w-2.5 rounded-full',
                item.shape === 'line' && 'h-0.5 w-4 rounded-full',
                (!item.shape || item.shape === 'square') && 'h-2.5 w-2.5 rounded-[2px]',
                item.swatch,
              )}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export interface MetricItem {
  label: string
  value: string
  hint?: string
}

export function SimMetrics({ items, dict }: { items: MetricItem[]; dict: Dictionary }) {
  return (
    <Panel title={dict.sim.metrics}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-ink-faint truncate text-[0.6875rem] tracking-wide uppercase">
              {item.label}
            </dt>
            <dd className="text-ink-strong tabular mt-0.5 font-mono text-lg leading-tight">
              {item.value}
            </dd>
            {item.hint ? <p className="text-ink-faint mt-0.5 text-[0.6875rem]">{item.hint}</p> : null}
          </div>
        ))}
      </dl>
    </Panel>
  )
}

export function Panel({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-rule-soft border-t pt-4', className)}>
      <h2 className="text-ink-faint mb-3 font-mono text-[0.6875rem] tracking-[0.14em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}
