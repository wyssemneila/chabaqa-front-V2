export function isUnsupportedImageInputError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /image|vision|unsupported|invalid.*content/i.test(message);
}

export function extractAiProviderErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message || '');
  }
  return String(error || '');
}

export function getUnsupportedImageInputMessage(): string {
  return 'This AI model could not process the provided image. Please try a text-only request or use another image.';
}
