"use client"

import { authApi } from "@/lib/api"
import type { User } from "@/lib/api/types"
export { authenticatedFetch } from "@/lib/authenticated-fetch"

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
