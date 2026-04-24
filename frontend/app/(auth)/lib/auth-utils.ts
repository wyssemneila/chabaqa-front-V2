"use server"

import { cookies } from "next/headers"

export async function refreshTokenAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value || cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return { success: false, error: "Pas de refresh token disponible" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    })

    const result = await response.json()
    const payload = result?.data || result || {}
    const accessToken = payload.access_token || payload.accessToken

    if (response.ok && accessToken) {
      // Utiliser la vraie durée d'expiration du backend
      const expiresIn = payload.expires_in || payload.expiresIn || 7200 // 2 heures par défaut
      
      cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn // Utiliser la durée réelle du backend
      })

      return { success: true }
    } else {
      return { success: false, error: result.message || "Erreur lors du refresh" }
    }
  } catch (error) {
    return { success: false, error: "Erreur de connexion" }
  }
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('accessToken')?.value || cookieStore.get('access_token')?.value || null
}

// Nouvelle fonction pour vérifier si le token va bientôt expirer
export async function isTokenExpiringSoon(): Promise<boolean> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value || cookieStore.get('access_token')?.value
  
  if (!accessToken) return true
  
  try {
    // Décoder le JWT pour vérifier l'expiration
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const expirationTime = payload.exp * 1000 // Convert to milliseconds
    const currentTime = Date.now()
    const fiveMinutesInMs = 5 * 60 * 1000
    
    // Retourner true si le token expire dans moins de 5 minutes
    return (expirationTime - currentTime) < fiveMinutesInMs
  } catch {
    return true // Si on ne peut pas décoder, considérer comme expiré
  }
}
