const SENSITIVE_KEY_PATTERN = /authorization|cookie|password|secret|token|api[_-]?key|private[_-]?key|refresh|credential|otp|code/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi;

export function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value
      .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
      .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
      .slice(0, 4000);
  }

  if (typeof value === 'bigint') return value.toString();
  if (typeof value !== 'object') return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeLogValue(value.message, depth + 1),
      stack: sanitizeLogValue(value.stack, depth + 1),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeLogValue(item, depth + 1));
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? '[REDACTED]'
      : sanitizeLogValue(entry, depth + 1);
  }
  return output;
}

export function writeStructuredLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  event: string,
  payload: Record<string, unknown> = {},
): void {
  const sanitizedPayload = sanitizeLogValue(payload) as Record<string, unknown>;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizedPayload,
  };
  const line = JSON.stringify(entry);

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'debug') console.debug(line);
  else console.log(line);
}
