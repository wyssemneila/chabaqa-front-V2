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

export type CreatorDiscoverySource = 'instagram_tiktok' | 'search' | 'friend_creator' | 'youtube_podcast' | 'event' | 'other' | 'prefer_not_to_say'

export interface CreatorDashboardOnboardingPayload {
  discoverySource?: CreatorDiscoverySource
  dashboardTourStep?: number
  dashboardTourCompleted?: boolean
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface DeleteAccountPayload {
  currentPassword: string
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
  return json?.success ? json.user || null : null
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

export async function updateCreatorDashboardOnboarding(payload: CreatorDashboardOnboardingPayload): Promise<any> {
  const res = await authenticatedFetch(`${apiBase}/user/creator-dashboard-onboarding`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await readApiError(res, `Failed to save onboarding progress (${res.status})`))
  const json = await res.json().catch(() => null)
  return json?.data?.creatorOnboarding || json?.creatorOnboarding || {}
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
