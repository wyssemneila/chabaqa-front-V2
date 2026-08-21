const FALLBACK_SOCKET_ORIGIN = "http://localhost:3000"

export function resolveSocketBaseUrl(apiUrl?: string): string {
  // Browser sockets must stay same-origin so HTTPS pages use wss:// through
  // Nginx rather than a build-time localhost/internal API address.
  if (typeof window !== "undefined") return window.location.origin

  const configuredSocketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || "").trim()
  if (configuredSocketUrl) {
    try {
      return new URL(configuredSocketUrl).origin
    } catch {
      // Fall back to deriving it from the API URL.
    }
  }

  const browserFallback = FALLBACK_SOCKET_ORIGIN

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
