import { authenticatedFetch } from '@/lib/authenticated-fetch'
import type { UserSocialLinks } from '@/lib/social-links'

export interface UpdateProfilePayload {
  name?: string
  email?: string
  bio?: string
  ville?: string
  pays?: string
  avatar?: string
  photo_profil?: string
  socialLinks?: UserSocialLinks
  lien_instagram?: string
}

export interface ChangePasswordPayload {
  currentPassword?: string
  newPassword: string
}

export interface DeleteAccountPayload {
  currentPassword?: string
  confirmText: string
}

const apiBase = typeof window !== "undefined"
  ? "/api"
  : (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api")

async function readApiError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.message || body?.error || fallback
}

export async function getMe(): Promise<any | null> {
  const res = await authenticatedFetch(`${apiBase}/auth/me`, { method: "GET" })
  if (!res.ok) return null
  const json = await res.json().catch(() => null)
  return json?.data || json?.user || null
}

export async function getByHandle(handle: string): Promise<any | null> {
  const res = await authenticatedFetch(`${apiBase}/user/by-username/${encodeURIComponent(handle)}`, { method: "GET" })
  if (!res.ok) return null
  const json = await res.json().catch(() => null)
  return json?.user || json?.data || null
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<any> {
  const res = await authenticatedFetch(`${apiBase}/user/update-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to update profile (${res.status})`))
  }
  const json = await res.json().catch(() => null)
  return json?.user || json?.data || json
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const res = await authenticatedFetch(`${apiBase}/user/change-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to change password (${res.status})`))
  }

  const json = await res.json().catch(() => null)
  return { message: json?.message || "Password updated successfully" }
}

export async function deleteAccount(payload: DeleteAccountPayload): Promise<{ message: string }> {
  const res = await authenticatedFetch(`${apiBase}/user/delete-account`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to delete account (${res.status})`))
  }

  const json = await res.json().catch(() => null)
  return { message: json?.message || "Account deleted successfully" }
}

export async function exportUserData(): Promise<Blob> {
  const res = await authenticatedFetch(`${apiBase}/user/export-data`, { method: "GET" })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to export data (${res.status})`))
  }
  return res.blob()
}

export interface AuthSession {
  jti: string
  userAgent?: string
  ip?: string
  createdAt?: string
  expiresAt?: string
}

export async function listAuthSessions(): Promise<AuthSession[]> {
  const res = await authenticatedFetch(`${apiBase}/auth/sessions`, { method: "GET" })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to load sessions (${res.status})`))
  }
  const json = await res.json().catch(() => null)
  const sessions = json?.sessions ?? json?.data?.sessions ?? json?.data ?? json
  return Array.isArray(sessions) ? sessions : []
}

export async function revokeAuthSession(jti: string): Promise<void> {
  const res = await authenticatedFetch(`${apiBase}/auth/sessions/${encodeURIComponent(jti)}/revoke`, {
    method: "POST",
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to revoke session (${res.status})`))
  }
}

export async function setTwoFactorEnabled(enabled: boolean, currentPassword?: string): Promise<{ twoFactorEnabled: boolean }> {
  const endpoint = enabled ? `${apiBase}/auth/2fa/enable` : `${apiBase}/auth/2fa/disable`
  const res = await authenticatedFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to update 2FA (${res.status})`))
  }
  const json = await res.json().catch(() => null)
  return { twoFactorEnabled: json?.twoFactorEnabled ?? enabled }
}
