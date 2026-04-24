import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Auth Middleware for Next.js
 * Protects routes and handles token validation at the edge
 */

const LOCAL_DEV_JWT_SECRET = 'local-dev-jwt-secret-change-me'
let hasLoggedMissingSecret = false

function resolveJwtSecret(): Uint8Array | null {
  const rawSecret = process.env.JWT_SECRET?.trim()

  if (rawSecret) {
    return new TextEncoder().encode(rawSecret)
  }

  if (process.env.NODE_ENV !== 'production') {
    return new TextEncoder().encode(LOCAL_DEV_JWT_SECRET)
  }

  if (!hasLoggedMissingSecret) {
    console.error('[authMiddleware] JWT_SECRET is missing in production; protected routes will reject auth cookies until runtime env is fixed.')
    hasLoggedMissingSecret = true
  }

  return null
}

// Prefix-protected routes require authentication for all descendants.
const PREFIX_PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/admin',
  '/creator',
]

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/admin/login',
  '/admin/verify-2fa',
  '/',
  '/about',
  '/contact',
]

// Admin only routes
const ADMIN_ROUTES = [
  '/admin',
]
const ADMIN_AUTHORIZED_ROLES = ['admin', 'super_admin', 'moderator', 'content_moderator']
const USER_ACCESS_COOKIE = 'accessToken'
const ADMIN_ACCESS_COOKIE = 'adminAccessToken'
const LOCALE_COOKIE = 'NEXT_LOCALE'
const LOCALE_REWRITE_HEADER = 'x-locale-rewrite'
const DEFAULT_LOCALE = 'en'
const SUPPORTED_LOCALES = ['en', 'ar'] as const
const AUTH_FAILURE_LOG_LIMIT_PER_REASON = 25
const authFailureLogCounts: Record<string, number> = {}

// Creator routes
const CREATOR_ROUTES = [
  '/creator',
]

function extractLocale(pathname: string): {
  locale: string
  normalizedPath: string
  hasLocalePrefix: boolean
} {
  const segments = pathname.split('/')
  const maybeLocale = segments[1]
  const hasLocalePrefix = SUPPORTED_LOCALES.includes(maybeLocale as (typeof SUPPORTED_LOCALES)[number])

  if (!hasLocalePrefix) {
    return {
      locale: DEFAULT_LOCALE,
      normalizedPath: pathname,
      hasLocalePrefix: false,
    }
  }

  const stripped = `/${segments.slice(2).join('/')}`.replace(/\/+/g, '/')
  return {
    locale: maybeLocale,
    normalizedPath: stripped === '/' ? '/' : stripped.replace(/\/$/, '') || '/',
    hasLocalePrefix: true,
  }
}

function withLocale(locale: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return `/${locale}`
  return `/${locale}${normalized}`
}

function getExternalUrl(request: NextRequest): URL {
  const url = request.nextUrl.clone()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')

  if (forwardedProto) {
    url.protocol = `${forwardedProto}:`
  }

  if (forwardedHost) {
    const [hostname, port] = forwardedHost.split(':', 2)
    url.hostname = hostname
    url.port = port || ''
  }

  return url
}

function readCookieValue(request: NextRequest, cookieName: string): string | undefined {
  const parsedCookie = request.cookies.get(cookieName)?.value
  if (parsedCookie) return parsedCookie

  const rawCookieHeader = request.headers.get('cookie') || ''
  const segments = rawCookieHeader.split(';')
  for (const segment of segments) {
    const [rawName, ...rawValueParts] = segment.trim().split('=')
    if (rawName === cookieName) {
      return rawValueParts.join('=')
    }
  }

  return undefined
}

function logAuthFailure(
  reason: 'missing_token' | 'missing_secret' | 'invalid_token' | 'role_mismatch',
  details: Record<string, string | boolean | undefined>,
) {
  const currentCount = authFailureLogCounts[reason] || 0
  if (currentCount >= AUTH_FAILURE_LOG_LIMIT_PER_REASON) {
    return
  }

  authFailureLogCounts[reason] = currentCount + 1
  const payload = {
    reason,
    ...details,
    count: authFailureLogCounts[reason],
  }
  console.warn(`[authMiddleware] auth_failure ${JSON.stringify(payload)}`)
}

function normalizeAuthRedirect(target: string | null, locale: string): string {
  if (!target) return withLocale(locale, '/dashboard')

  let decoded = target
  try {
    decoded = decodeURIComponent(target)
  } catch {
    decoded = target
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return withLocale(locale, '/dashboard')
  }

  if (decoded.startsWith('/en/') || decoded.startsWith('/ar/')) {
    return decoded
  }

  return withLocale(locale, decoded)
}

function isProtectedRoute(path: string): boolean {
  if (PREFIX_PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
    return true
  }

  // Keep own-profile and edit protected, while allowing public profile slugs.
  if (path === '/profile') {
    return true
  }

  if (path.startsWith('/profile/') && path.endsWith('/edit')) {
    return true
  }

  return false
}

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const preferredLocale = readCookieValue(request, LOCALE_COOKIE)
  const isPreferredSupported =
    typeof preferredLocale === 'string' &&
    SUPPORTED_LOCALES.includes(preferredLocale as (typeof SUPPORTED_LOCALES)[number])
  const fallbackLocale = isPreferredSupported ? preferredLocale : DEFAULT_LOCALE
  const extractedLocale = extractLocale(pathname)
  const locale = extractedLocale.hasLocalePrefix ? extractedLocale.locale : fallbackLocale
  const { normalizedPath, hasLocalePrefix } = extractedLocale
  const isInternalLocaleRewrite = request.headers.get(LOCALE_REWRITE_HEADER) === '1'
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (!hasLocalePrefix && !isInternalLocaleRewrite) {
    const localizedUrl = getExternalUrl(request)
    localizedUrl.pathname = withLocale(locale, pathname)
    return NextResponse.redirect(localizedUrl)
  }

  if (!hasLocalePrefix && isInternalLocaleRewrite) {
    const response = NextResponse.next()
    const rewrittenLocale = request.headers.get('x-app-locale') || DEFAULT_LOCALE
    response.cookies.set(LOCALE_COOKIE, rewrittenLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  const continueWithHeaders = (headers?: Headers) => {
    const rewrittenUrl = getExternalUrl(request)
    rewrittenUrl.pathname = normalizedPath

    const requestHeaders = headers ? new Headers(headers) : new Headers(request.headers)
    requestHeaders.set('x-app-locale', locale)
    requestHeaders.set(LOCALE_REWRITE_HEADER, '1')

    const response = NextResponse.rewrite(rewrittenUrl, { request: { headers: requestHeaders } })
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  // Check if route is protected
  const isRouteProtected = isProtectedRoute(normalizedPath)
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    route === '/'
      ? normalizedPath === '/'
      : normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  )
  const isAdminRoute = ADMIN_ROUTES.some(route => normalizedPath.startsWith(route))
  const isCreatorRoute = CREATOR_ROUTES.some(route => normalizedPath.startsWith(route))
  const isAdminAuthPage = normalizedPath === '/admin/login' || normalizedPath === '/admin/verify-2fa'

  const verifyToken = async (token: string | undefined, cookieName: string) => {
    if (!token) {
      return { user: null, isValidToken: false }
    }

    const secret = resolveJwtSecret()
    if (!secret) {
      logAuthFailure('missing_secret', {
        path: normalizedPath,
        cookieName,
      })
      return { user: null, isValidToken: false }
    }

    try {
      const { payload } = await jwtVerify(token, secret)
      return { user: payload, isValidToken: true }
    } catch {
      logAuthFailure('invalid_token', {
        path: normalizedPath,
        cookieName,
      })
      return { user: null, isValidToken: false }
    }
  }

  const userToken = readCookieValue(request, USER_ACCESS_COOKIE)
  const adminToken = readCookieValue(request, ADMIN_ACCESS_COOKIE)
  const { user, isValidToken } = await verifyToken(userToken, USER_ACCESS_COOKIE)
  const { user: adminUser, isValidToken: isValidAdminToken } = await verifyToken(adminToken, ADMIN_ACCESS_COOKIE)

  const userRole = typeof user?.role === 'string' ? user.role : ''
  const adminRole = typeof adminUser?.role === 'string' ? adminUser.role : ''
  const isAdminAuthorizedUser = ADMIN_AUTHORIZED_ROLES.includes(adminRole)
  const hasValidAdminSession = isValidAdminToken && isAdminAuthorizedUser

  // Handle admin auth pages first to avoid cross-routing with regular auth flows.
  if (isAdminAuthPage) {
    if (hasValidAdminSession) {
      return NextResponse.redirect(new URL(withLocale(locale, '/admin/dashboard'), getExternalUrl(request)))
    }
    return continueWithHeaders()
  }

  // Redirect authenticated users away from regular auth pages
  // Skip redirect if they just logged out (message param)
  const logoutMessage = request.nextUrl.searchParams.get('message')
  const isPostLogout = logoutMessage?.toLowerCase().includes('logged out')
  
  if (normalizedPath === '/signin' || normalizedPath === '/signup' || normalizedPath === '/verify-email') {
    if (isPostLogout) {
      // User just logged out - clear the stale cookie and let them stay on signin
      const response = continueWithHeaders()
      response.cookies.set(USER_ACCESS_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' })
      response.cookies.set(USER_ACCESS_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'strict', secure: true })
      response.cookies.set('refreshToken', '', { path: '/', maxAge: 0, sameSite: 'lax' })
      response.cookies.set('refreshToken', '', { path: '/', maxAge: 0, sameSite: 'strict', secure: true })
      return response
    }
    
    if (isValidToken) {
      // User appears authenticated - redirect away from auth pages
      const normalizedRedirect = normalizeAuthRedirect(request.nextUrl.searchParams.get('redirect'), locale)
      return NextResponse.redirect(new URL(normalizedRedirect, getExternalUrl(request)))
    }
    
    // Not authenticated - let them access the auth page
    return continueWithHeaders()
  }

  // Explicit public routes bypass protection checks
  if (isPublicRoute) {
    return continueWithHeaders()
  }

  // Handle admin routes
  if (isAdminRoute && !hasValidAdminSession) {
    const loginUrl = new URL(withLocale(locale, '/admin/login'), getExternalUrl(request))
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute && hasValidAdminSession && adminUser) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', adminUser.sub as string)
    requestHeaders.set('x-user-email', adminUser.email as string)
    requestHeaders.set('x-user-role', adminUser.role as string)

    return continueWithHeaders(requestHeaders)
  }

  // Handle protected routes
  if (isRouteProtected && !isAdminRoute && !isValidToken) {
    logAuthFailure('missing_token', {
      path: normalizedPath,
      cookieName: USER_ACCESS_COOKIE,
    })
    const loginUrl = new URL(withLocale(locale, '/signin'), getExternalUrl(request))
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Handle creator routes
  if (isCreatorRoute && (!isValidToken || (user?.role !== 'creator' && user?.role !== 'admin'))) {
    if (!isValidToken) {
      logAuthFailure('missing_token', {
        path: normalizedPath,
        cookieName: USER_ACCESS_COOKIE,
      })
      const loginUrl = new URL('/signin', getExternalUrl(request))
      loginUrl.pathname = withLocale(locale, '/signin')
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } else {
      // User is authenticated but not creator/admin
      logAuthFailure('role_mismatch', {
        path: normalizedPath,
        requiredRole: 'creator|admin',
        actualRole: userRole || 'unknown',
      })
      return NextResponse.redirect(new URL(withLocale(locale, '/dashboard'), getExternalUrl(request)))
    }
  }

  if (isValidToken && user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.sub as string)
    requestHeaders.set('x-user-email', user.email as string)
    requestHeaders.set('x-user-role', user.role as string)
    
    return continueWithHeaders(requestHeaders)
  }

  return continueWithHeaders()
}

/**
 * Utility function to get user from request headers
 */
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id')
  const userEmail = headers.get('x-user-email')
  const userRole = headers.get('x-user-role')
  
  if (!userId) return null
  
  return {
    id: userId,
    email: userEmail,
    role: userRole,
  }
}
