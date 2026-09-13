export const locales = ['en', 'id'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
}

/** Short label for the locale switcher. */
export const localeShortNames: Record<Locale, string> = {
  en: 'EN',
  id: 'ID',
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
