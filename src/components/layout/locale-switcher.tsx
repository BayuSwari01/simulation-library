'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales, localeShortNames, localeNames, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/i18n'

/** Swaps the leading locale segment, keeping the rest of the path. */
function pathForLocale(pathname: string, target: Locale) {
  const segments = pathname.split('/')
  segments[1] = target
  return segments.join('/') || `/${target}`
}

export function LocaleSwitcher({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()

  return (
    <div
      className="ring-rule flex items-center rounded-sm ring-1"
      role="group"
      aria-label={dict.locale.label}
    >
      {locales.map((l) => {
        const active = l === locale
        return (
          <Link
            key={l}
            href={pathForLocale(pathname, l)}
            hrefLang={l}
            aria-label={localeNames[l]}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'grid h-9 w-9 place-items-center font-mono text-[0.6875rem] tracking-wider transition-colors first:rounded-l-sm last:rounded-r-sm',
              active
                ? 'bg-accent-wash text-accent'
                : 'text-ink-faint hover:text-ink-strong hover:bg-accent-wash/60',
            )}
          >
            {localeShortNames[l]}
          </Link>
        )
      })}
    </div>
  )
}
