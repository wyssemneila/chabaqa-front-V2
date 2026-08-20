export function slugifyToHandle(value: string): string {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return normalized || 'user';
}

function decodeUriComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getSafeDisplayName(user: any): string {
  if (typeof user?.name === "string" && user.name.trim()) return user.name
  if (typeof user?.fullName === "string" && user.fullName.trim()) return user.fullName

  const firstName = typeof user?.firstName === "string" ? user.firstName.trim() : ""
  const lastName = typeof user?.lastName === "string" ? user.lastName.trim() : ""
  return `${firstName} ${lastName}`.trim()
}

function extractEmbeddedNameSlug(value: string): string {
  return (value.toLowerCase().match(/(?:^|-)name-([a-z0-9-]{2,}?)(?:-email-|$)/i) || [])[1] || ""
}

function looksLikeSerializedUserPayload(value: string): boolean {
  const lower = value.toLowerCase()
  const hasStructuredMarkers = lower.includes("id-") && lower.includes("-name-") && lower.includes("-email-")
  const hasPayloadMarkers =
    lower.includes("[object") ||
    lower.includes("new-objectid") ||
    lower.includes("objectid") ||
    lower.includes("photo-profil") ||
    lower.includes("profile-picture") ||
    lower.includes("https-api-")
  return hasStructuredMarkers || hasPayloadMarkers
}

export function getUserProfileHandle(user: any): string {
  const fallbackHandle = slugifyToHandle(getSafeDisplayName(user) || "user")
  const explicitUsername = typeof user?.username === 'string'
    ? user.username.trim().toLowerCase()
    : typeof user?.userName === "string"
      ? user.userName.trim().toLowerCase()
    : typeof user === 'string'
      ? user.trim().toLowerCase()
      : '';
  if (explicitUsername) {
    const decodedUsername = decodeUriComponentSafe(explicitUsername)
    const embeddedName = extractEmbeddedNameSlug(decodedUsername)
    if (embeddedName) {
      return slugifyToHandle(embeddedName)
    }

    // Keep valid username characters as-is; sanitize malformed usernames (e.g. spaces).
    if (/^[a-z0-9._-]+$/.test(decodedUsername)) {
      return decodedUsername;
    }

    if (!looksLikeSerializedUserPayload(decodedUsername)) {
      return slugifyToHandle(decodedUsername)
    }
  }

  return fallbackHandle
}

export function getUserProfileHref(user: any): string {
  return `/profile/${encodeURIComponent(getUserProfileHandle(user))}`;
}
