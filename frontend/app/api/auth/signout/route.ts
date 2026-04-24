import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side signout route.
 * Clears ALL auth cookies (including httpOnly ones set by the backend)
 * and redirects to the signin page.
 *
 * This is necessary because httpOnly cookies cannot be cleared via
 * client-side JavaScript (document.cookie).
 */

const AUTH_COOKIE_NAMES = [
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'token',
]

const SAME_SITE_VARIANTS: Array<'lax' | 'strict' | 'none'> = ['lax', 'strict']

function resolveLocale(request: NextRequest): string {
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie === 'ar' || localeCookie === 'en') return localeCookie

  const referer = request.headers.get('referer') || ''
  if (referer.includes('/ar/')) return 'ar'
  return 'en'
}

function clearAllCookies(response: NextResponse): void {
  for (const name of AUTH_COOKIE_NAMES) {
    for (const sameSite of SAME_SITE_VARIANTS) {
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite,
      })
    }
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: false,
      sameSite: 'lax',
    })
  }
}

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request)
  const signinUrl = new URL('/' + locale + '/signin', request.url)
  signinUrl.searchParams.set('message', 'Logged out successfully')

  const response = NextResponse.redirect(signinUrl)
  response.headers.set('Cache-Control', 'private, no-cache')
  clearAllCookies(response)
  return response
}

export async function POST(request: NextRequest) {
  const locale = resolveLocale(request)
  const signinUrl = new URL('/' + locale + '/signin', request.url)
  signinUrl.searchParams.set('message', 'Logged out successfully')

  const response = NextResponse.json(
    { success: true, message: 'Signed out', redirect: signinUrl.toString() },
    { status: 200, headers: { 'Cache-Control': 'private, no-cache' } },
  )
  clearAllCookies(response)
  return response
}
