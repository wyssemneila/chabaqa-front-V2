import { expect, test } from '@playwright/test'

const stripeSession = process.env.TEST_STRIPE_SESSION || ''
const communitySlug = process.env.TEST_COMMUNITY_SLUG || 'growth-operators-network'
const courseUrl = process.env.TEST_COURSE_URL || ''
const creatorDashboardPath = process.env.TEST_CREATOR_DASHBOARD_PATH || ''

test.describe('reliability smoke', () => {
  test('production-style payment verify route returns normalized Stripe response', async ({ request }) => {
    test.skip(!stripeSession, 'Set TEST_STRIPE_SESSION to run live Stripe verification smoke')

    const response = await request.get(`/api/payments/verify?sessionId=${encodeURIComponent(stripeSession)}`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const payload = body.data || body
    expect(body.success ?? payload.success).toBeTruthy()
    expect(payload.status).toBe('paid')
    expect(payload.provider).toBe('stripe')
    expect(payload.orderId).toBeTruthy()
  })

  test('community API exposes normalized media URLs', async ({ request }) => {
    const response = await request.get(`/api/communities/${communitySlug}`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const community = body.data || body
    expect(community.logoUrl).toBeTruthy()
    expect(community.coverUrl).toBeTruthy()
    expect(community.thumbnailUrl).toBeTruthy()
  })

  test('community header renders an image logo instead of initials fallback', async ({ page }) => {
    await page.goto(`/en/youssef-bouallegue/${communitySlug}/home`)
    const logo = page.getByAltText(/logo/i).first()
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute('src', /.+/)
  })

  test('member home shows launch-readiness recommendations', async ({ page }) => {
    await page.route('**/api/community-aff-crea-join/growth-operators-network', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'community-1',
            _id: 'community-1',
            slug: communitySlug,
            name: 'Growth Operators Network',
            description: 'A test community for launch readiness.',
            logoUrl: '/Logos/PNG/frensh1.png',
            coverUrl: '/banners-community/community-3-fitness.png',
            thumbnailUrl: '/Logos/PNG/frensh1.png',
            membersCount: 12,
            creator: { id: 'creator-1', name: 'Youssef Bouallegue', avatar: '/placeholder.svg' },
          },
        }),
      })
    })
    await page.route('**/api/communities/growth-operators-network', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'community-1',
            _id: 'community-1',
            slug: communitySlug,
            name: 'Growth Operators Network',
            description: 'A test community for launch readiness.',
            logoUrl: '/Logos/PNG/frensh1.png',
            coverUrl: '/banners-community/community-3-fitness.png',
            thumbnailUrl: '/Logos/PNG/frensh1.png',
            membersCount: 12,
            creator: { id: 'creator-1', name: 'Youssef Bouallegue', avatar: '/placeholder.svg' },
          },
        }),
      })
    })
    await page.route('**/api/posts/community/community-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'post-1',
              title: 'Welcome to the community',
              content: 'Start here and introduce yourself.',
              communityId: 'community-1',
              authorId: 'creator-1',
              author: { id: 'creator-1', name: 'Youssef Bouallegue' },
              isPinned: true,
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      })
    })
    await page.route('**/api/challenges/community/growth-operators-network**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'challenge-1', title: '7 Day Sprint', description: 'Complete one task per day.', endDate: '2099-01-01T00:00:00.000Z', participants: [] }],
        }),
      })
    })
    await page.route('**/api/cours/community/growth-operators-network**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { courses: [{ id: 'course-1', title: 'Growth Basics', description: 'Continue your first lesson.', enrollmentCount: 3 }] },
        }),
      })
    })
    await page.route('**/api/auth/me**', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthenticated' }) })
    })
    await page.route('**/api/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/api/community-aff-crea-join/growth-operators-network') || url.includes('/api/communities/growth-operators-network')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'community-1',
              _id: 'community-1',
              slug: communitySlug,
              name: 'Growth Operators Network',
              description: 'A test community for launch readiness.',
              logoUrl: '/Logos/PNG/frensh1.png',
              coverUrl: '/banners-community/community-3-fitness.png',
              thumbnailUrl: '/Logos/PNG/frensh1.png',
              membersCount: 12,
              creator: { id: 'creator-1', name: 'Youssef Bouallegue', avatar: '/placeholder.svg' },
            },
          }),
        })
        return
      }
      if (url.includes('/api/posts/community/community-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'post-1',
                title: 'Welcome to the community',
                content: 'Start here and introduce yourself.',
                communityId: 'community-1',
                authorId: 'creator-1',
                author: { id: 'creator-1', name: 'Youssef Bouallegue' },
                isPinned: true,
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        })
        return
      }
      if (url.includes('/api/challenges/community/growth-operators-network')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'challenge-1', title: '7 Day Sprint', description: 'Complete one task per day.', endDate: '2099-01-01T00:00:00.000Z', participants: [] }],
          }),
        })
        return
      }
      if (url.includes('/api/cours/community/growth-operators-network')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { courses: [{ id: 'course-1', title: 'Growth Basics', description: 'Continue your first lesson.', enrollmentCount: 3 }] },
          }),
        })
        return
      }
      if (url.includes('/api/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
        })
        return
      }
      await route.continue()
    })

    await page.goto(`/en/youssef-bouallegue/${communitySlug}/home`)
    await expect(page.getByText(/what should i do next/i)).toBeVisible()
    await expect(page.getByText(/continue where you left off/i)).toBeVisible()
  })

  test('creator dashboard exposes setup checklist when authenticated fixture is available', async ({ page }) => {
    test.skip(!creatorDashboardPath, 'Set TEST_CREATOR_DASHBOARD_PATH with an authenticated storage state to run creator dashboard smoke')

    await page.goto(creatorDashboardPath)
    await expect(page.getByText(/creator launch checklist/i)).toBeVisible()
    await expect(page.getByText(/preview as member/i)).toBeVisible()
  })

  test('locked course chapter cannot be opened directly before sequence access', async ({ page }) => {
    test.skip(!courseUrl, 'Set TEST_COURSE_URL to run course access smoke')

    await page.goto(courseUrl)
    await expect(page.getByText(/finish this chapter to unlock the next one/i)).toBeVisible()
    await expect(page.getByText(/preview/i)).toHaveCount(0)
  })
})
