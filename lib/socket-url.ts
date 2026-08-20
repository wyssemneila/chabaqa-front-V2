const FALLBACK_SOCKET_ORIGIN = "http://localhost:3000"

export function resolveSocketBaseUrl(apiUrl?: string): string {
  const browserFallback =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : FALLBACK_SOCKET_ORIGIN

  const raw = (apiUrl || "").trim()
  if (!raw) return browserFallback

  const withoutApiSuffix = raw.replace(/\/api\/?$/, "")
  if (!withoutApiSuffix || withoutApiSuffix === "http" || withoutApiSuffix === "https") {
    return browserFallback
  }

  try {
    return new URL(withoutApiSuffix).origin
  } catch {
    // Ignore and try the value as a hostname.
  }

  const hostCandidate = withoutApiSuffix.replace(/^\/+|\/+$/g, "")
  if (!hostCandidate) return browserFallback

  try {
    return new URL(`https://${hostCandidate}`).origin
  } catch {
    return browserFallback
  }
}
