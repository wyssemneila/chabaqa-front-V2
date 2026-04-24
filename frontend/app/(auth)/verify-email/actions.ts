"use server"

import { authApi } from "@/lib/api"

interface VerifyEmailOtpResult {
  success: boolean
  message?: string
  error?: string
}

export async function verifyEmailOtpAction(data: {
  email: string
  verificationCode: string
}): Promise<VerifyEmailOtpResult> {
  try {
    const response: any = await authApi.verifyRegisterOtp({
      email: data.email,
      verificationCode: data.verificationCode,
    })

    const payload = response?.data ?? response

    const success = Boolean(response?.success ?? payload?.success)
    if (success) {
      return {
        success: true,
        message: payload?.message || response?.message || "Email verified successfully",
      }
    }

    return {
      success: false,
      error: payload?.error || payload?.message || "Invalid or expired verification code",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Unable to verify code right now. Please try again.",
    }
  }
}

export async function resendEmailOtpAction(email: string): Promise<VerifyEmailOtpResult> {
  try {
    const response: any = await authApi.resendRegisterOtp(email)
    const payload = response?.data ?? response

    const success = Boolean(response?.success ?? payload?.success)
    if (success) {
      return {
        success: true,
        message: payload?.message || response?.message || "A new verification code has been sent",
      }
    }

    return {
      success: false,
      error: payload?.error || payload?.message || "Unable to resend verification code",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Unable to resend verification code",
    }
  }
}
