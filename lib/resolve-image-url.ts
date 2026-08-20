const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
const API_ORIGIN = API_BASE.replace(/\/api$/, "")

function getSecureApiOrigin(): string {
  const httpsOrigin = API_ORIGIN.replace("http://", "https://")
  // IP hosts usually do not serve valid TLS certs in production; use stable API domain.
  return httpsOrigin.replace(
    /^https?:\/\/\d+\.\d+\.\d+\.\d+(?::\d+)?/,
    "https://api.chabaqa.io",
  )
}

export function resolveImageUrl(value?: string): string | undefined {
  const raw = (value || "").trim()
  if (!raw) return undefined

  if (/^https?:\/\//i.test(raw)) {
    if (raw.startsWith("https://")) return raw

    const path = raw.replace(/^https?:\/\/[^/]+/, "")
    if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(raw)) {
      return `${getSecureApiOrigin()}${path}`
    }
    return raw.replace("http://", "https://")
  }

  if (raw.startsWith("/")) {
    if (raw.startsWith("/uploads") || raw.startsWith("/storage") || raw.startsWith("/images")) {
      return `${getSecureApiOrigin()}${raw}`
    }
    return raw
  }

  if (raw.startsWith("uploads") || raw.startsWith("storage") || raw.startsWith("images")) {
    return `${getSecureApiOrigin()}/${raw.replace(/^\/+/, "")}`
  }

  return `${getSecureApiOrigin()}/uploads/image/${raw}`
}

