"use server"

import { authApi } from "@/lib/api"

interface ResetPasswordResult {
  success: boolean
  error?: string
  message?: string
}

export async function resetPasswordAction(data: {
  email: string
  verificationCode: string
  newPassword: string
}): Promise<ResetPasswordResult> {
  try {
    const response: any = await authApi.resetPassword({
      email: data.email,
      verificationCode: data.verificationCode,
      newPassword: data.newPassword,
    })
    const result = response?.data ?? response
    const success = Boolean(response?.success ?? result?.success)
    if (success) {
      return { 
        success: true, 
        message: result?.message || response?.message || "Password reset successfully"
      }
    }
    return { success: false, error: result?.error || result?.message || response?.message || "An error occurred" }
  } catch (error) {
    return { success: false, error: "Connection error. Please try again." }
  }
}
