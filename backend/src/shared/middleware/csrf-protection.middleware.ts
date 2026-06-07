import { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  getAllowedCorsOrigins,
  isCorsOriginAllowed,
  isProductionEnvironment,
} from '@/shared/utils/security-config.util';
import { CookieUtil } from '@/shared/utils/cookie.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PATHS = [
  /^\/api\/health(?:\/|$)/,
  /^\/api\/payment\/stripe-link\/webhook$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/register(?:\/|$)/,
  /^\/api\/auth\/forgot-password$/,
  /^\/api\/auth\/reset-password$/,
  /^\/api\/auth\/google(?:\/|$)/,
  /^\/api\/admin\/login$/,
  /^\/api\/admin\/verify-2fa$/,
  /^\/api\/admin\/bootstrap$/,
];

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeRequestPath(req: Request): string {
  const path = req.originalUrl || req.url || '';
  return path.split('?')[0] || '/';
}

function hasCookieAuth(req: Request): boolean {
  const cookies = req.cookies || {};
  return Boolean(
    cookies.accessToken ||
    cookies.refreshToken ||
    cookies.access_token ||
    cookies.refresh_token ||
    cookies.adminAccessToken ||
    cookies.adminRefreshToken ||
    cookies.admin_access_token ||
    cookies.admin_refresh_token,
  );
}

function isExemptPath(path: string): boolean {
  return EXEMPT_PATHS.some((pattern) => pattern.test(path));
}

function getHeaderValue(req: Request, headerName: string): string {
  const value = req.headers[headerName.toLowerCase()];
  if (Array.isArray(value)) return String(value[0] || '').trim();
  return String(value || '').trim();
}

function isTrustedRequestOrigin(req: Request, allowedOrigins: string[]): boolean {
  const origin = getHeaderValue(req, 'origin');
  if (origin) {
    return isCorsOriginAllowed(origin, allowedOrigins);
  }

  const referer = getHeaderValue(req, 'referer');
  if (!referer) {
    return !isProductionEnvironment();
  }

  try {
    const parsed = new URL(referer);
    return isCorsOriginAllowed(`${parsed.protocol}//${parsed.host}`, allowedOrigins);
  } catch {
    return false;
  }
}

export function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (process.env.CSRF_ENABLED === 'false') {
    next();
    return;
  }

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const path = normalizeRequestPath(req);
  if (isExemptPath(path)) {
    next();
    return;
  }

  if (!hasCookieAuth(req)) {
    next();
    return;
  }

  const allowedOrigins = getAllowedCorsOrigins();
  if (!isTrustedRequestOrigin(req, allowedOrigins)) {
    res.status(403).json({
      success: false,
      code: 'CSRF_ORIGIN_DENIED',
      message: 'Request origin is not allowed',
    });
    return;
  }

  const cookieToken = String(req.cookies?.[CookieUtil.CSRF_COOKIE_NAME] || '').trim();
  const headerToken = getHeaderValue(req, CookieUtil.CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    res.status(403).json({
      success: false,
      code: 'CSRF_TOKEN_INVALID',
      message: 'CSRF token is missing or invalid',
    });
    return;
  }

  next();
}
