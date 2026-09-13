'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Dictionary, Locale } from '@/i18n'

export function MainNav({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname()
  const items = [
    { href: `/${locale}`, label: dict.nav.home, exact: true },
    { href: `/${locale}/library`, label: dict.nav.library, exact: false },
  ]

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              active ? 'text-ink-strong' : 'text-ink-muted hover:text-ink-strong',
            )}
          >
            <span className={cn('pb-0.5', active && 'border-accent border-b-2')}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
