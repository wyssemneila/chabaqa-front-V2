import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from '@/lib/i18n/config'
import { getMessagesForLocale } from '@/lib/i18n/messages'

export default getRequestConfig(async () => {
  const headerStore = await headers()
  const cookieStore = await cookies()
  const headerLocale = headerStore.get('x-app-locale')
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isAppLocale(headerLocale)
    ? headerLocale
    : isAppLocale(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE

  return {
    locale,
    messages: getMessagesForLocale(locale),
  }
})
