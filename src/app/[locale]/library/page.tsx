import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LibraryBrowser } from '@/components/library/library-browser'
import { getDictionary, isLocale, type Locale } from '@/i18n'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params
  if (!isLocale(locale)) return {}
  const dict = getDictionary(locale as Locale)
  return { title: dict.library.title, description: dict.library.lede }
}

export default async function LibraryPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale as Locale)

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {dict.library.title}
        </h1>
        <p className="text-ink-muted mt-3 text-base">{dict.library.lede}</p>
      </header>

      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="text-ink-faint py-12 font-mono text-xs">…</div>}>
        <LibraryBrowser locale={locale as Locale} dict={dict} />
      </Suspense>
    </div>
  )
}
