import { test, expect } from '@playwright/test'

/**
 * E2E Test: Community Approval Workflow
 * 
 * This test validates the complete community approval flow including:
 * - Pending communities list
 * - Community details view
 * - Community approval
 * - Community rejection
 * - Bulk approval
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

test.describe('Community Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_access_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
    
    // Mock pending communities API
    await page.route('**/admin/communities/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          communities: [
            {
              _id: '1',
              name: 'Fitness Community',
              description: 'A community for fitness enthusiasts',
              creator: { _id: 'c1', username: 'fitness_coach' },
              status: 'pending',
              memberCount: 0,
              contentCount: 0,
              createdAt: '2024-01-01T00:00:00Z'
            },
            {
              _id: '2',
              name: 'Cooking Masters',
              description: 'Learn cooking from experts',
              creator: { _id: 'c2', username: 'chef_master' },
              status: 'pending',
              memberCount: 0,
              contentCount: 0,
              createdAt: '2024-01-02T00:00:00Z'
            }
          ],
          total: 2
        })
      })
    })
  })

  test('should display pending communities', async ({ page }) => {
    await page.goto('/admin/communities/pending')
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /pending|approvals/i })).toBeVisible()
    
    // Verify communities are displayed
    await expect(page.getByText('Fitness Community')).toBeVisible()
    await expect(page.getByText('Cooking Masters')).toBeVisible()
  })

  test('should view community details', async ({ page }) => {
    // Mock community details API
    await page.route('**/admin/communities/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          name: 'Fitness Community',
          description: 'A community for fitness enthusiasts',
          creator: { _id: 'c1', username: 'fitness_coach', email: 'coach@fitness.com' },
          status: 'pending',
          featured: false,
          verified: false,
          memberCount: 0,
          contentCount: 0,
          createdAt: '2024-01-01T00:00:00Z',
          members: [],
          content: []
        })
      })
    })
    
    await page.goto('/admin/communities/pending')
    
    // Click on community
    await page.getByText('Fitness Community').click()
    
    // Verify community details page
    await expect(page).toHaveURL(/\/admin\/communities\/1/)
    await expect(page.getByText('A community for fitness enthusiasts')).toBeVisible()
  })

  test('should approve community', async ({ page }) => {
    // Mock community details API
    await page.route('**/admin/communities/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          name: 'Fitness Community',
          description: 'A community for fitness enthusiasts',
          creator: { _id: 'c1', username: 'fitness_coach' },
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })
    
    // Mock approve API
    await page.route('**/admin/communities/1/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Community approved successfully' })
      })
    })
    
    await page.goto('/admin/communities/1')
    
    // Click approve button
    await page.getByRole('button', { name: /approve/i }).click()
    
    // Add optional notes
    const notesField = page.getByLabel(/notes/i)
    if (await notesField.isVisible()) {
      await notesField.fill('Looks good!')
    }
    
    // Confirm approval
    await page.getByRole('button', { name: /confirm|approve/i }).click()
    
    // Verify success message
    await expect(page.getByText(/approved successfully/i)).toBeVisible()
  })

  test('should reject community with reason', async ({ page }) => {
    // Mock community details API
    await page.route('**/admin/communities/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          name: 'Fitness Community',
          description: 'A community for fitness enthusiasts',
          creator: { _id: 'c1', username: 'fitness_coach' },
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })
    
    // Mock reject API
    await page.route('**/admin/communities/1/reject', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Community rejected' })
      })
    })
    
    await page.goto('/admin/communities/1')
    
    // Click reject button
    await page.getByRole('button', { name: /reject/i }).click()
    
    // Fill in rejection reason (required)
    await page.getByLabel(/reason/i).fill('Does not meet community guidelines')
    
    // Confirm rejection
    await page.getByRole('button', { name: /confirm|reject/i }).click()
    
    // Verify success message
    await expect(page.getByText(/rejected/i)).toBeVisible()
  })

  test('should perform bulk approval', async ({ page }) => {
    // Mock bulk approve API
    await page.route('**/admin/communities/bulk-approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Communities approved',
          successful: 2,
          failed: 0
        })
      })
    })
    
    await page.goto('/admin/communities/pending')
    
    // Select multiple communities
    const checkboxes = page.getByRole('checkbox')
    await checkboxes.nth(1).check() // First community
    await checkboxes.nth(2).check() // Second community
    
    // Click bulk approve button
    await page.getByRole('button', { name: /approve selected|bulk approve/i }).click()
    
    // Confirm bulk approval
    await page.getByRole('button', { name: /confirm/i }).click()
    
    // Verify success message
    await expect(page.getByText(/approved/i)).toBeVisible()
  })

  test('should update community settings', async ({ page }) => {
    // Mock community details API
    await page.route('**/admin/communities/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          name: 'Fitness Community',
          description: 'A community for fitness enthusiasts',
          creator: { _id: 'c1', username: 'fitness_coach' },
          status: 'approved',
          featured: false,
          verified: false,
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })
    
    // Mock update settings API
    await page.route('**/admin/communities/1/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Settings updated' })
      })
    })
    
    await page.goto('/admin/communities/1')
    
    // Toggle featured status
    await page.getByLabel(/featured/i).check()
    
    // Toggle verified status
    await page.getByLabel(/verified/i).check()
    
    // Save settings
    await page.getByRole('button', { name: /save|update/i }).click()
    
    // Verify success message
    await expect(page.getByText(/updated|saved/i)).toBeVisible()
  })
})
