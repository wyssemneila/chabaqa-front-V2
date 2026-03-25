import { DEFAULT_LOCALE, isAppLocale } from './config'

export function detectLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/')
  return isAppLocale(segments[1]) ? segments[1] : DEFAULT_LOCALE
}

export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/')
  if (!isAppLocale(segments[1])) return pathname
  const stripped = `/${segments.slice(2).join('/')}`.replace(/\/+/g, '/')
  return stripped === '/' ? '/' : stripped.replace(/\/$/, '') || '/'
}

export function localizeHref(pathname: string, href: string): string {
  const locale = detectLocaleFromPath(pathname)
  if (href.startsWith(`/${locale}/`)) return href
  if (href === '/') return `/${locale}`
  return `/${locale}${href.startsWith('/') ? href : `/${href}`}`
}
