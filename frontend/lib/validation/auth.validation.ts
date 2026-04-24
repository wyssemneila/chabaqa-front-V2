import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()

/**
 * Password validation schema
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')

/**
 * Weak password schema (for testing/development)
 */
export const weakPasswordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters')

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(val),
    'Invalid phone number format'
  )

/**
 * Date of birth validation schema
 */
export const dateOfBirthSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true
    const date = new Date(val)
    const age = new Date().getFullYear() - date.getFullYear()
    return age >= 13 && age <= 120
  }, 'You must be at least 13 years old')

/**
 * Sign In form schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export type SignInFormData = z.infer<typeof signInSchema>

/**
 * Sign Up form schema
 */
export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  numtel: phoneSchema,
  dateNaissance: dateOfBirthSchema,
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type SignUpFormData = z.infer<typeof signUpSchema>

/**
 * Forgot Password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

/**
 * Reset Password schema
 */
export const resetPasswordSchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('At least 8 characters')

  if (password.length >= 12) score++
  else if (password.length >= 8) feedback.push('Consider using 12+ characters')

  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Add numbers')

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  else feedback.push('Add special characters')

  return { score, feedback }
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score <= 1) return 'Weak'
  if (score <= 2) return 'Fair'
  if (score <= 3) return 'Good'
  if (score <= 4) return 'Strong'
  return 'Very Strong'
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return 'bg-red-500'
  if (score <= 2) return 'bg-orange-500'
  if (score <= 3) return 'bg-yellow-500'
  if (score <= 4) return 'bg-blue-500'
  return 'bg-green-500'
}
