'use client'

import useSWR, { useSWRConfig } from 'swr'
import { authenticatedFetch } from '@/lib/authenticated-fetch'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.170:3000/api'
const apiOrigin = apiBase.replace(/\/api$/, '')

export function resolveImageUrl(value?: string): string | undefined {
  const v = (value || '').trim()
  if (!v) return undefined

  // If it's already a full URL (http:// or https://)
  if (/^https?:\/\//i.test(v)) {
    // Force HTTPS for production - replace HTTP with HTTPS
    if (v.startsWith('http://')) {
      // Replace IP address with domain if available, or force HTTPS
      const httpsUrl = v.replace('http://', 'https://')
      // If it's an IP address, try to use the API domain instead
      if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(v)) {
        // Use the API base URL's domain instead of IP
        const apiDomain = apiBase.replace(/\/api$/, '').replace(/^http:\/\/[^/]+/, 'https://api.chabaqa.io')
        const path = v.replace(/^https?:\/\/[^/]+/, '')
        return `${apiDomain}${path}`
      }
      return httpsUrl
    }
    return v
  }

  // If it's a root-relative path, prefix backend origin for upload/static paths
  if (v.startsWith('/')) {
    if (v.startsWith('/uploads') || v.startsWith('/storage') || v.startsWith('/images')) {
      // Use HTTPS API domain
      const secureOrigin = apiOrigin.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
      return `${secureOrigin}${v}`
    }
    return v
  }

  // If it's a relative path starting with common upload directories
  if (v.startsWith('uploads') || v.startsWith('storage') || v.startsWith('images')) {
    const secureOrigin = apiOrigin.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
    return `${secureOrigin}/${v.replace(/^\/+/, '')}`
  }

  // If it looks like a filename or path without leading slash, assume it's in uploads/image/
  if (v && !v.includes('://')) {
    const secureOrigin = apiOrigin.replace('http://', 'https://').replace(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+/, 'https://api.chabaqa.io')
    return `${secureOrigin}/uploads/image/${v}`
  }

  return undefined
}

export function normalizeUser(user: any) {
  if (!user) return user
  const rawAvatar =
    user.avatar ||
    user.photo_profil ||
    user.profile_picture ||
    user.photo ||
    user.image
  const normalizedAvatar = resolveImageUrl(rawAvatar)
  const normalizedPhotoProfil = resolveImageUrl(user.photo_profil)
  const normalizedProfilePicture = resolveImageUrl(user.profile_picture)

  return {
    ...user,
    avatar: normalizedAvatar || '/placeholder.svg',
    photo_profil: normalizedPhotoProfil ?? user.photo_profil,
    profile_picture: normalizedProfilePicture ?? user.profile_picture,
  }
}

function normalizePayload(data: any) {
  if (!data) return data
  if (Array.isArray(data)) return data.map(normalizeUser)
  return normalizeUser(data)
}

const fetcher = async (url: string) => {
  const res = await authenticatedFetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json().catch(() => null)
  // normalize common shapes
  const raw = json?.data || json?.user || json
  return normalizePayload(raw)
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(`${apiBase}/auth/me`, fetcher, {
    revalidateOnFocus: false,
  })
  return { user: data, isLoading, error, mutate }
}

export function useUserProfile(handle?: string) {
  const key = handle ? `${apiBase}/user/by-username/${encodeURIComponent(handle)}` : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  })
  return { profile: data, isLoading, error, mutate }
}
