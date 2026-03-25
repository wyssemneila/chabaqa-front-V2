"use client"

import { authApi } from "@/lib/api"
import type { User } from "@/lib/api/types"
import { tokenManager } from "@/lib/token-manager"

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = tokenManager.getAccessToken()
  
  const headers = new Headers(options.headers || {})
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  
  headers.set("Content-Type", "application/json")

  return fetch(url, {
    ...options,
    headers,
  })
}

export const getProfile = async (): Promise<User | null> => {
  try {
    const response = await authApi.me();
    return response.data;
  } catch (error) {
    return null;
  }
}

export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}
