import { test, expect } from '@playwright/test'
import { SignJWT } from 'jose'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

async function createCreatorToken() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'local-dev-jwt-secret-change-me')
  return new SignJWT({ email: 'creator@test.com', role: 'creator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('creator-user-id')
    .setExpirationTime('1h')
    .sign(secret)
}

test.describe('Creator email campaigns smoke', () => {
  test.beforeEach(async ({ context, page }) => {
    const token = await createCreatorToken()
    await context.addCookies([
      {
        name: 'accessToken',
        value: token,
        url: 'http://localhost:8080',
        path: '/',
      },
    ])

    await page.route(`${API_BASE}/email-campaigns/community/**`, async (route) => {
      const url = route.request().url()
      if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalCampaigns: 1,
            totalEmailsSent: 20,
            totalEmailsFailed: 1,
            totalOpens: 10,
            totalClicks: 2,
            averageOpenRate: 50,
            averageClickRate: 10,
            reactivationCampaigns: 0,
            reactivationSuccessRate: 0,
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          campaigns: [
            {
              _id: 'campaign-1',
              title: 'Welcome Campaign',
              subject: 'Welcome',
              content: 'Hello',
              communityId: 'community-1',
              creatorId: { _id: 'creator-user-id', name: 'Creator', email: 'creator@test.com' },
              type: 'announcement',
              status: 'draft',
              recipients: [],
              totalRecipients: 20,
              sentCount: 0,
              failedCount: 0,
              openCount: 0,
              clickCount: 0,
              isHtml: true,
              trackOpens: true,
              trackClicks: true,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      })
    })
  })

  test('loads creator email campaigns page', async ({ page }) => {
    await page.goto('/creator/marketing/emails')
    await expect(page.getByRole('heading', { name: 'Email Campaigns' })).toBeVisible()
    await expect(page.getByText('Welcome Campaign')).toBeVisible()
  })

  test('shows coming soon state for messages and whatsapp', async ({ page }) => {
    await page.goto('/creator/marketing/messages')
    await expect(page.getByText('Coming Soon')).toBeVisible()

    await page.goto('/creator/marketing/whatsapp')
    await expect(page.getByText('Coming Soon')).toBeVisible()
  })
})
