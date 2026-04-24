/** @jest-environment node */

import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { authMiddleware } from '../auth.middleware'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'local-dev-jwt-secret-change-me')
}

async function createToken(role: string) {
  return new SignJWT({ role, email: `${role}@example.com` })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(`${role}-user-id`)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getSecret())
}

function makeRequest(pathname: string, cookieHeader?: string) {
  return new NextRequest(`http://localhost:8080${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  })
}

describe('authMiddleware admin routing', () => {
  const originalJwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = 'local-dev-jwt-secret-change-me'
  })

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret
  })

  it('allows logged out visitors to reach /admin/login', async () => {
    const response = await authMiddleware(makeRequest('/admin/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/en/admin/login')
  })

  it('allows regular signed-in users to reach /admin/login', async () => {
    const userToken = await createToken('user')
    const response = await authMiddleware(
      makeRequest('/admin/login', `accessToken=${userToken}`),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/en/admin/login')
  })

  it('redirects signed-in admins from /admin/login to /admin/dashboard', async () => {
    const adminToken = await createToken('admin')
    const response = await authMiddleware(
      makeRequest('/en/admin/login', `adminAccessToken=${adminToken}`),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/en/admin/dashboard')
  })

  it('redirects invalid admin cookies on /admin/dashboard to /admin/login', async () => {
    const response = await authMiddleware(
      makeRequest('/en/admin/dashboard', 'adminAccessToken=invalid-token'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/en/admin/login?redirect=%2Fen%2Fadmin%2Fdashboard')
  })

  it('prefers admin auth over a regular user cookie on protected admin routes', async () => {
    const userToken = await createToken('user')
    const adminToken = await createToken('admin')
    const response = await authMiddleware(
      makeRequest(
        '/admin/dashboard',
        `accessToken=${userToken}; adminAccessToken=${adminToken}`,
      ),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/en/admin/dashboard')
  })

  it('respects NEXT_LOCALE cookie on unprefixed routes', async () => {
    const response = await authMiddleware(
      makeRequest('/signin', 'NEXT_LOCALE=ar'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:8080/ar/signin')
  })

  it('allows authenticated users to access /en/profile', async () => {
    const userToken = await createToken('user')
    const response = await authMiddleware(
      makeRequest('/en/profile', `accessToken=${userToken}`),
    )

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:8080/profile')
  })

  it('allows logged out visitors to access /en/profile/:slug', async () => {
    const response = await authMiddleware(makeRequest('/en/profile/karim-bouzid'))

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:8080/profile/karim-bouzid')
  })

  it('allows authenticated users to access /en/dashboard/create-community', async () => {
    const userToken = await createToken('user')
    const response = await authMiddleware(
      makeRequest('/en/dashboard/create-community', `accessToken=${userToken}`),
    )

    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:8080/dashboard/create-community')
  })

  it('redirects logged out visitors from /en/profile/:slug/edit to signin', async () => {
    const response = await authMiddleware(makeRequest('/en/profile/karim-bouzid/edit'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:8080/en/signin?redirect=%2Fen%2Fprofile%2Fkarim-bouzid%2Fedit',
    )
  })

  it('redirects logged out users from /en/dashboard/create-community to signin', async () => {
    const response = await authMiddleware(makeRequest('/en/dashboard/create-community'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:8080/en/signin?redirect=%2Fen%2Fdashboard%2Fcreate-community',
    )
  })

  it('redirects invalid user cookies on /en/profile to signin', async () => {
    const response = await authMiddleware(
      makeRequest('/en/profile', 'accessToken=invalid-token'),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:8080/en/signin?redirect=%2Fen%2Fprofile',
    )
  })
})
