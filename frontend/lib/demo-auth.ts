const DEMO_TOKEN_PREFIX = "demo_"

export function isDemoToken(token: string): boolean {
  return token.startsWith(DEMO_TOKEN_PREFIX)
}

export function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.replace(/^demo_/, "").split(".")
    const payloadPart = parts[1] || parts[0]
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4))
    const decoded = atob(base64 + padding)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function userFromDemoPayload(payload: Record<string, any>) {
  return {
    _id: payload.sub || payload._id || "demo-user",
    name: payload.name || "Demo User",
    username: payload.username || payload.preferred_username || "demo",
    email: payload.email || "demo@chabaqa.io",
    role: payload.role || "creator",
    avatar: payload.avatar || payload.picture || null,
  }
}

export function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
  if (!match) return null
  try {
    return decodeURIComponent(match.split("=")[1]) || null
  } catch {
    return null
  }
}
