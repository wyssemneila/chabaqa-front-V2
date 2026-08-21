import { DEFAULT_LOCALE, isAppLocale } from "./config"

type DateLike = Date | string | number

export function normalizeLocale(locale?: string | null): string {
  if (isAppLocale(locale)) return locale
  return DEFAULT_LOCALE
}

export function formatNumber(
  value: number,
  locale?: string | null,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(normalizeLocale(locale), options).format(value)
}

export function formatCurrency(
  value: number,
  currency = "TND",
  locale?: string | null,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(normalizeLocale(locale), {
    style: "currency",
    currency,
    ...options,
  }).format(value)
}

export function normalizeCurrencyCode(value?: string | null): "TND" | "USD" | "EUR" {
  const normalized = String(value || "TND").trim().toUpperCase()
  if (normalized === "DT") return "TND"
  if (normalized === "USD" || normalized === "EUR") return normalized
  return "TND"
}

export function formatMoney(value: number, currency?: string | null, locale?: string | null): string {
  return formatCurrency(Number.isFinite(value) ? value : 0, normalizeCurrencyCode(currency), locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatDate(
  value: DateLike,
  locale?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date)
}

export function formatDateTime(
  value: DateLike,
  locale?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(date)
}
