import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Spectral, Inter, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { PaperTexture } from '@/components/layout/paper-texture'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { getDictionary, isLocale, locales, type Locale } from '@/i18n'
import '../globals.css'

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-spectral',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    default: 'Simulation Library',
    template: '%s · Simulation Library',
  },
  description: 'Animated models of technical concepts you can pause, step through and replay.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1e9d9' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1712' },
  ],
}

export default async function LocaleLayout(props: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Next 16: params is a Promise.
  const { locale } = await props.params
  if (!isLocale(locale)) notFound()

  const dict = getDictionary(locale as Locale)

  return (
    // suppressHydrationWarning is required: next-themes writes the theme class
    // onto <html> before hydration.
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${spectral.variable} ${inter.variable} ${plexMono.variable} bg-paper text-ink min-h-dvh antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PaperTexture />
          <a
            href="#content"
            className="bg-card text-ink-strong ring-rule sr-only rounded px-4 py-2 shadow-sm ring-1 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
          >
            {dict.nav.skipToContent}
          </a>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader locale={locale as Locale} dict={dict} />
            <main id="content" className="flex-1">
              {props.children}
            </main>
            <SiteFooter dict={dict} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
