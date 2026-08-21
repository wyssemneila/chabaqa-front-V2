import { refreshBrowserAccessToken } from '@/lib/auth-refresh'
import { apiClient } from '@/lib/api/client'

function jsonResponse(body: any, status = 200): any {
  const text = JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => name.toLowerCase() === 'content-type' ? 'application/json' : null,
    },
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(text),
  }
}

describe('browser auth token refresh', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'accessToken=; Path=/; Max-Age=0'
    document.cookie = 'chabaqa_csrf=csrf-token; Path=/'
    global.fetch = jest.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('stores the refreshed access token and keeps refresh tokens out of localStorage', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          accessToken: 'fresh-access-token',
        },
      }),
    )

    await expect(refreshBrowserAccessToken('https://chabaqa.io/api')).resolves.toBe('fresh-access-token')

    expect(localStorage.getItem('accessToken')).toBe('fresh-access-token')
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(document.cookie).toContain('accessToken=fresh-access-token')
    expect(global.fetch).toHaveBeenCalledWith('https://chabaqa.io/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-token',
      }),
    }))
  })

  it('skips speculative refresh when there is no browser session hint', async () => {
    document.cookie = 'accessToken=; Path=/; Max-Age=0'
    document.cookie = 'refreshToken=; Path=/; Max-Age=0'
    document.cookie = 'refresh_token=; Path=/; Max-Age=0'

    await expect(
      refreshBrowserAccessToken('https://chabaqa.io/api', { skipWhenNoSessionHint: true }),
    ).resolves.toBeNull()

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('issues a CSRF cookie before refreshing when the browser has none', async () => {
    document.cookie = 'chabaqa_csrf=; Path=/; Max-Age=0'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { csrfToken: 'csrf-token' } }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: {
          accessToken: 'fresh-access-token',
        },
      }))

    await expect(refreshBrowserAccessToken('https://chabaqa.io/api')).resolves.toBe('fresh-access-token')

    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://chabaqa.io/api/auth/csrf', expect.objectContaining({
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    }))
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://chabaqa.io/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
  })

  it('refreshes CSRF and retries once when refresh is forbidden', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'CSRF token is missing or invalid' }, 403))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { csrfToken: 'new-csrf-token' } }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: {
          accessToken: 'fresh-access-token',
        },
      }))

    await expect(refreshBrowserAccessToken('https://chabaqa.io/api')).resolves.toBe('fresh-access-token')

    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://chabaqa.io/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'X-CSRF-Token': 'csrf-token',
      }),
    }))
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://chabaqa.io/api/auth/csrf', expect.objectContaining({
      method: 'GET',
      credentials: 'include',
    }))
    expect(global.fetch).toHaveBeenNthCalledWith(3, 'https://chabaqa.io/api/auth/refresh', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
  })

  it('retries a 401 request with the refreshed bearer token', async () => {
    localStorage.setItem('accessToken', 'expired-access-token')
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { accessToken: 'fresh-access-token' },
      }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }))

    await expect(apiClient.get('/notifications')).resolves.toEqual({
      success: true,
      data: { ok: true },
    })

    const firstHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers
    const retryHeaders = (global.fetch as jest.Mock).mock.calls[2][1].headers

    expect(firstHeaders.Authorization).toBe('Bearer expired-access-token')
    expect(retryHeaders.Authorization).toBe('Bearer fresh-access-token')
    expect(localStorage.getItem('accessToken')).toBe('fresh-access-token')
  })
})
