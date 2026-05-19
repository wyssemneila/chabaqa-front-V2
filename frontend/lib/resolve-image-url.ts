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

function getSameOriginUploadPath(path: string): string | undefined {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  if (
    cleanPath.startsWith("/uploads/") ||
    cleanPath.startsWith("/storage/") ||
    cleanPath.startsWith("/images/")
  ) {
    return cleanPath
  }
  return undefined
}

export function resolveImageUrl(value?: string): string | undefined {
  const raw = (value || "").trim()
  if (!raw) return undefined

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      const uploadPath = getSameOriginUploadPath(url.pathname)
      if (uploadPath) {
        return `${uploadPath}${url.search || ""}`
      }
    } catch {
      // Keep the older fallback behavior for malformed absolute values.
    }

    if (raw.startsWith("https://")) return raw

    const path = raw.replace(/^https?:\/\/[^/]+/, "")
    if (/^http:\/\/\d+\.\d+\.\d+\.\d+/.test(raw)) {
      return `${getSecureApiOrigin()}${path}`
    }
    return raw.replace("http://", "https://")
  }

  if (raw.startsWith("/")) {
    const uploadPath = getSameOriginUploadPath(raw)
    if (uploadPath) return uploadPath
    return raw
  }

  const uploadPath = getSameOriginUploadPath(raw)
  if (uploadPath) return uploadPath

  return `${getSecureApiOrigin()}/uploads/image/${raw}`
}
