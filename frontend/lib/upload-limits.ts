/** Keep in sync with backend file-validation.service.ts */
export const UPLOAD_LIMITS = {
  imageBytes: 5 * 1024 * 1024,
  documentBytes: 10 * 1024 * 1024,
  videoBytes: 500 * 1024 * 1024,
  productDeliveryBytes: 100 * 1024 * 1024,
  thumbnailBytes: 2 * 1024 * 1024,
} as const

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}
