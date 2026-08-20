import { test, expect } from '@playwright/test'

/**
 * E2E Test: Content Moderation Workflow
 * 
 * This test validates the complete content moderation flow including:
 * - Moderation queue display
 * - Content filtering
 * - Content details view
 * - Content approval
 * - Content rejection
 * - Content flagging
 * - Bulk moderation
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

test.describe('Content Moderation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_access_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
    
    // Mock moderation queue API
    await page.route('**/admin/content-moderation/queue**', async (route) => {
      const url = new URL(route.request().url())
      const contentType = url.searchParams.get('contentType')
      const status = url.searchParams.get('status')
      const priority = url.searchParams.get('priority')
      
      let items = [
        {
          _id: '1',
          contentType: 'post',
          contentId: 'p1',
          content: { title: 'Inappropriate Post', body: 'Content here' },
          status: 'pending',
          priority: 'high',
          reportedBy: { _id: 'u1', username: 'reporter1' },
          reportReason: 'Spam',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          _id: '2',
          contentType: 'course',
          contentId: 'c1',
          content: { title: 'Suspicious Course', description: 'Course content' },
          status: 'pending',
          priority: 'medium',
          reportedBy: { _id: 'u2', username: 'reporter2' },
          reportReason: 'Misleading content',
          createdAt: '2024-01-02T00:00:00Z'
        },
        {
          _id: '3',
          contentType: 'comment',
          contentId: 'cm1',
          content: { text: 'Offensive comment' },
          status: 'flagged',
          priority: 'urgent',
          reportedBy: { _id: 'u3', username: 'reporter3' },
          reportReason: 'Harassment',
          createdAt: '2024-01-03T00:00:00Z'
        }
      ]
      
      if (contentType) {
        items = items.filter(i => i.contentType === contentType)
      }
      if (status) {
        items = items.filter(i => i.status === status)
      }
      if (priority) {
        items = items.filter(i => i.priority === priority)
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          total: items.length,
          page: 1,
          pageSize: 10
        })
      })
    })
  })

  test('should display moderation queue', async ({ page }) => {
    await page.goto('/admin/content-moderation')
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /moderation|content moderation/i })).toBeVisible()
    
    // Verify content items are displayed
    await expect(page.getByText('Inappropriate Post')).toBeVisible()
    await expect(page.getByText('Suspicious Course')).toBeVisible()
    await expect(page.getByText('Offensive comment')).toBeVisible()
  })

  test('should filter by content type', async ({ page }) => {
    await page.goto('/admin/content-moderation')
    
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
    }
    
    // Select post content type
    await page.getByLabel(/content type/i).selectOption('post')
    
    // Apply filters
    await page.getByRole('button', { name: /apply/i }).click()
    
    // Verify only posts are shown
    await expect(page.getByText('Inappropriate Post')).toBeVisible()
    await expect(page.getByText('Suspicious Course')).not.toBeVisible()
  })

  test('should filter by priority', async ({ page }) => {
    await page.goto('/admin/content-moderation')
    
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
    }
    
    // Select urgent priority
    await page.getByLabel(/priority/i).selectOption('urgent')
    
    // Apply filters
    await page.getByRole('button', { name: /apply/i }).click()
    
    // Verify only urgent items are shown
    await expect(page.getByText('Offensive comment')).toBeVisible()
    await expect(page.getByText('Inappropriate Post')).not.toBeVisible()
  })

  test('should view content details', async ({ page }) => {
    // Mock content details API
    await page.route('**/admin/content-moderation/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          contentType: 'post',
          contentId: 'p1',
          content: { title: 'Inappropriate Post', body: 'Full content here' },
          status: 'pending',
          priority: 'high',
          reportedBy: { _id: 'u1', username: 'reporter1', email: 'reporter@test.com' },
          reportReason: 'Spam',
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })
    
    await page.goto('/admin/content-moderation')
    
    // Click on content item
    await page.getByText('Inappropriate Post').click()
    
    // Verify content details page
    await expect(page).toHaveURL(/\/admin\/content-moderation\/1/)
    await expect(page.getByText('Full content here')).toBeVisible()
    await expect(page.getByText('reporter1')).toBeVisible()
  })

  test('should approve content', async ({ page }) => {
    // Mock content details API
    await page.route('**/admin/content-moderation/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          contentType: 'post',
          content: { title: 'Inappropriate Post' },
          status: 'pending',
          priority: 'high'
        })
      })
    })
    
    // Mock approve API
    await page.route('**/admin/content-moderation/1/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Content approved' })
      })
    })
    
    await page.goto('/admin/content-moderation/1')
    
    // Click approve button
    await page.getByRole('button', { name: /approve/i }).click()
    
    // Confirm approval
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify success message
    await expect(page.getByText(/approved/i)).toBeVisible()
  })

  test('should reject content with reason', async ({ page }) => {
    // Mock content details API
    await page.route('**/admin/content-moderation/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          contentType: 'post',
          content: { title: 'Inappropriate Post' },
          status: 'pending',
          priority: 'high'
        })
      })
    })
    
    // Mock reject API
    await page.route('**/admin/content-moderation/1/reject', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Content rejected' })
      })
    })
    
    await page.goto('/admin/content-moderation/1')
    
    // Click reject button
    await page.getByRole('button', { name: /reject/i }).click()
    
    // Fill in rejection reason (required)
    await page.getByLabel(/reason/i).fill('Violates community guidelines')
    
    // Confirm rejection
    await page.getByRole('button', { name: /confirm|reject/i }).click()
    
    // Verify success message
    await expect(page.getByText(/rejected/i)).toBeVisible()
  })

  test('should flag content', async ({ page }) => {
    // Mock content details API
    await page.route('**/admin/content-moderation/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          contentType: 'post',
          content: { title: 'Inappropriate Post' },
          status: 'pending',
          priority: 'high'
        })
      })
    })
    
    // Mock flag API
    await page.route('**/admin/content-moderation/1/flag', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Content flagged' })
      })
    })
    
    await page.goto('/admin/content-moderation/1')
    
    // Click flag button
    await page.getByRole('button', { name: /flag/i }).click()
    
    // Optionally hide content
    const hideCheckbox = page.getByLabel(/hide content/i)
    if (await hideCheckbox.isVisible()) {
      await hideCheckbox.check()
    }
    
    // Confirm flagging
    await page.getByRole('button', { name: /confirm|flag/i }).click()
    
    // Verify success message
    await expect(page.getByText(/flagged/i)).toBeVisible()
  })

  test('should perform bulk moderation', async ({ page }) => {
    // Mock bulk approve API
    await page.route('**/admin/content-moderation/bulk-approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Content approved',
          successful: 2,
          failed: 0
        })
      })
    })
    
    await page.goto('/admin/content-moderation')
    
    // Select multiple items
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(1).check() // First item
    await checkboxes.nth(2).check() // Second item
    
    // Click bulk approve button
    await page.getByRole('button', { name: /approve selected|bulk approve/i }).click()
    
    // Confirm bulk approval
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify success message
    await expect(page.getByText(/approved/i)).toBeVisible()
  })

  test('should update content priority', async ({ page }) => {
    // Mock content details API
    await page.route('**/admin/content-moderation/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          contentType: 'post',
          content: { title: 'Inappropriate Post' },
          status: 'pending',
          priority: 'high'
        })
      })
    })
    
    // Mock update priority API
    await page.route('**/admin/content-moderation/1/priority', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Priority updated' })
      })
    })
    
    await page.goto('/admin/content-moderation/1')
    
    // Change priority
    await page.getByLabel(/priority/i).selectOption('urgent')
    
    // Verify success message
    await expect(page.getByText(/updated|saved/i)).toBeVisible()
  })
})
