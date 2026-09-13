import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'accent' | 'lamp' | 'quiet'

const tones: Record<Tone, string> = {
  neutral: 'ring-rule text-ink-muted bg-card',
  accent: 'ring-accent/35 text-accent bg-accent-wash',
  lamp: 'ring-lamp/40 text-lamp bg-lamp-wash',
  quiet: 'ring-rule-soft text-ink-faint bg-transparent',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[0.6875rem] tracking-wide uppercase ring-1',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
