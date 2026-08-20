/**
 * Toast notification utilities for the admin dashboard
 * Uses sonner for toast notifications
 */

import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Display a success toast notification
 */
export function success(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display an error toast notification
 */
export function error(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, {
    description: options?.description,
    duration: options?.duration || 5000,
    action: options?.action,
  })
}

/**
 * Display an info toast notification
 */
export function info(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display a warning toast notification
 */
export function warning(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, {
    description: options?.description,
    duration: options?.duration || 4000,
    action: options?.action,
  })
}

/**
 * Display a loading toast notification
 * Returns a function to dismiss the toast
 */
export function loading(message: string, options?: Omit<ToastOptions, 'action'>) {
  return sonnerToast.loading(message, {
    description: options?.description,
    duration: options?.duration || Infinity,
  })
}

/**
 * Display a promise toast notification
 * Automatically shows loading, success, or error based on promise state
 */
export function promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  }
) {
  return sonnerToast.promise(promise, messages)
}

/**
 * Dismiss a specific toast by ID
 */
export function dismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export function dismissAll() {
  sonnerToast.dismiss()
}

// Export the toast object for direct access to sonner methods
export const toast = {
  success,
  error,
  info,
  warning,
  loading,
  promise,
  dismiss,
  dismissAll,
}
