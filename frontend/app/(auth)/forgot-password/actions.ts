"use server"

import { authApi } from "@/lib/api"

interface ForgotPasswordResult {
  success: boolean
  error?: string
  message?: string
}

export async function forgotPasswordAction(data: { email: string }): Promise<ForgotPasswordResult> {
  try {
    const response: any = await authApi.forgotPassword({ email: data.email })
    const result = response?.data ?? response
    const success = Boolean(response?.success ?? result?.success)
    if (success) {
      return { 
        success: true, 
        message: result?.message || response?.message || "Verification code sent successfully"
      }
    }
    return { success: false, error: result?.error || result?.message || response?.message || "An error occurred" }
  } catch (error) {
    const message =
      typeof (error as any)?.message === "string"
        ? (error as any).message
        : "Connection error. Please try again."
    return { success: false, error: message }
  }
}
