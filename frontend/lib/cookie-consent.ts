export const COOKIE_CONSENT_KEY = "chabaqa_cookie_consent"
export const COOKIE_CONSENT_VERSION = "1" as const
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const LOCAL_STORAGE_FALLBACK_KEY = COOKIE_CONSENT_KEY

export type CookieConsentV1 = {
  version: "1"
  timestamp: string
  essential: true
  analytics: boolean
}

export type CookieConsentPreferences = {
  analytics: boolean
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function parseConsent(raw: string | null | undefined): CookieConsentV1 | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as Partial<CookieConsentV1>
    if (
      parsed?.version === COOKIE_CONSENT_VERSION &&
      parsed?.essential === true &&
      typeof parsed?.analytics === "boolean" &&
      typeof parsed?.timestamp === "string"
    ) {
      return parsed as CookieConsentV1
    }
  } catch {
    return null
  }
  return null
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null
  const prefix = `${name}=`
  const parts = document.cookie.split(";").map((part) => part.trim())
  const match = parts.find((part) => part.startsWith(prefix))
  return match ? match.slice(prefix.length) : null
}

function writeCookie(name: string, value: string): void {
  if (!isBrowser()) return
  const secure =
    window.location.protocol === "https:" || process.env.NODE_ENV === "production"
      ? "; Secure"
      : ""
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

function writeLocalStorage(value: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, value)
  } catch {
    // ignore storage failures
  }
}

function readLocalStorage(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY)
  } catch {
    return null
  }
}

export function getStoredConsent(): CookieConsentV1 | null {
  const cookieConsent = parseConsent(readCookie(COOKIE_CONSENT_KEY))
  if (cookieConsent) return cookieConsent

  const localStorageConsent = parseConsent(readLocalStorage())
  return localStorageConsent
}

export function saveConsent(preferences: CookieConsentPreferences): CookieConsentV1 | null {
  if (!isBrowser()) return null
  const consent: CookieConsentV1 = {
    version: COOKIE_CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    essential: true,
    analytics: Boolean(preferences.analytics),
  }

  const serialized = JSON.stringify(consent)
  writeCookie(COOKIE_CONSENT_KEY, serialized)
  writeLocalStorage(serialized)

  return consent
}

export function hasAnalyticsConsent(): boolean {
  const consent = getStoredConsent()
  return Boolean(consent?.analytics)
}

export function isConsentRequired(): boolean {
  return getStoredConsent() === null
}
