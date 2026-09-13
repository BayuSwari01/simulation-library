import Link from 'next/link'
import { MainNav } from './main-nav'
import { ThemeToggle } from './theme-toggle'
import { LocaleSwitcher } from './locale-switcher'
import type { Dictionary, Locale } from '@/i18n'

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="border-rule-soft bg-paper/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link href={`/${locale}`} className="group mr-auto flex min-w-0 items-baseline gap-2.5">
          <span className="font-serif text-ink-strong truncate text-lg leading-none font-semibold tracking-tight">
            {dict.brand.name}
          </span>
          <span className="text-ink-faint hidden truncate text-xs lg:inline">{dict.brand.tagline}</span>
        </Link>

        <div className="hidden sm:block">
          <MainNav locale={locale} dict={dict} />
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} dict={dict} />
          <ThemeToggle dict={dict} />
        </div>
      </div>

      <div className="border-rule-soft border-t px-5 pb-1 sm:hidden">
        <MainNav locale={locale} dict={dict} />
      </div>
    </header>
  )
}
