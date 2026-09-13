'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { buttonClass } from '@/components/ui/button'
import { defaultLocale, getDictionary, isLocale, type Locale } from '@/i18n'

/**
 * A not-found rendered under [locale] cannot read route params, so the locale
 * is recovered from the pathname instead. Without this the 404 would always
 * appear in English, whichever language the visitor is browsing in.
 */
export function NotFoundContent() {
  const pathname = usePathname()
  const first = pathname.split('/')[1] ?? ''
  const locale: Locale = isLocale(first) ? first : defaultLocale
  const dict = getDictionary(locale)

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-5 py-28 sm:px-8">
      <p className="text-ink-faint font-mono text-[0.6875rem] tracking-[0.18em] uppercase">404</p>
      <h1 className="font-serif mt-3 text-3xl font-semibold tracking-tight">{dict.notFound.title}</h1>
      <p className="text-ink-muted mt-3">{dict.notFound.body}</p>
      <Link href={`/${locale}/library`} className={buttonClass('outline', 'md', 'mt-8')}>
        {dict.notFound.cta}
      </Link>
    </div>
  )
}
