export const SUPPORTED_LOCALES = ['en', 'ar'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export const LOCALE_COOKIE = 'NEXT_LOCALE'

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as AppLocale))
}

export function getLocaleDirection(locale: AppLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
