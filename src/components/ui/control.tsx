'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="text-ink-faint block text-[0.6875rem] tracking-wide uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="border-rule bg-card text-ink-strong hover:border-rule-strong mt-1.5 h-9 w-full rounded-sm border px-2 text-sm transition-colors"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
  className,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  format?: (value: number) => string
  onChange: (value: number) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-ink-faint text-[0.6875rem] tracking-wide uppercase">
          {label}
        </label>
        <span className="text-ink-strong tabular font-mono text-xs">
          {format ? format(value) : value}
          {unit ? <span className="text-ink-faint ml-0.5">{unit}</span> : null}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-accent mt-2.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--rule-base)]"
      />
    </div>
  )
}
