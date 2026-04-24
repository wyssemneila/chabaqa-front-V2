import { cookies } from "next/headers"
import type { User } from "@/lib/api/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("accessToken")

  const headers = new Headers(options.headers || {})
  
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken.value}`)
  }
  
  headers.set("Content-Type", "application/json")

  return fetch(url, {
    ...options,
    headers,
    cache: options.cache || 'no-store'
  })
}

export async function getProfileServer(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")
    const refreshToken = cookieStore.get("refreshToken")

    if (!accessToken && !refreshToken) {
      return null
    }

    // Try with access token first
    if (accessToken) {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${accessToken.value}`,
          "Content-Type": "application/json",
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        return data.data
      }
    }

    // If access token failed, try to refresh
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
        cache: 'no-store'
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const refreshPayload = refreshData?.data || refreshData || {}
        const refreshedAccessToken = refreshPayload.accessToken || refreshPayload.access_token
        
        // Update access token cookie
        if (refreshedAccessToken) {
          const expiresIn = refreshPayload.expires_in || refreshPayload.expiresIn || 2 * 60 * 60
          cookieStore.set('accessToken', refreshedAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiresIn
          })
          
          // Retry getting profile with new token
          const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              "Authorization": `Bearer ${refreshedAccessToken}`,
              "Content-Type": "application/json",
            },
            cache: 'no-store'
          })

          if (profileResponse.ok) {
            const data = await profileResponse.json()
            return data.data
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("Server auth check error:", error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getProfileServer()
  return user !== null
}
