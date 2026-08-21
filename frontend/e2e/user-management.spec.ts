import { test, expect } from '@playwright/test'

/**
 * E2E Test: User Management Workflow
 * 
 * This test validates the complete user management flow including:
 * - User list display
 * - Filtering and search
 * - User details view
 * - User suspension
 * - User activation
 * - Password reset
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

test.describe('User Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_access_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
    
    // Mock user list API
    await page.route('**/admin/users**', async (route) => {
      const url = new URL(route.request().url())
      const search = url.searchParams.get('search')
      const status = url.searchParams.get('status')
      
      const users = [
        {
          _id: '1',
          username: 'john_doe',
          email: 'john@example.com',
          status: 'active',
          role: 'member',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z'
        },
        {
          _id: '2',
          username: 'jane_smith',
          email: 'jane@example.com',
          status: 'suspended',
          role: 'creator',
          createdAt: '2024-01-02T00:00:00Z',
          lastLogin: '2024-01-14T00:00:00Z'
        },
        {
          _id: '3',
          username: 'bob_wilson',
          email: 'bob@example.com',
          status: 'active',
          role: 'member',
          createdAt: '2024-01-03T00:00:00Z',
          lastLogin: '2024-01-13T00:00:00Z'
        }
      ]
      
      let filteredUsers = users
      
      if (search) {
        filteredUsers = filteredUsers.filter(u => 
          u.username.includes(search) || u.email.includes(search)
        )
      }
      
      if (status) {
        filteredUsers = filteredUsers.filter(u => u.status === status)
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: filteredUsers,
          total: filteredUsers.length,
          page: 1,
          pageSize: 10
        })
      })
    })
  })

  test('should display user list', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Verify page title
    await expect(page.getByRole('heading', { name: /users|user management/i })).toBeVisible()
    
    // Verify users are displayed
    await expect(page.getByText('john_doe')).toBeVisible()
    await expect(page.getByText('jane_smith')).toBeVisible()
    await expect(page.getByText('bob_wilson')).toBeVisible()
  })

  test('should filter users by status', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Open filter panel
    const filterButton = page.getByRole('button', { name: /filter/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
    }
    
    // Select suspended status
    await page.getByLabel(/status/i).selectOption('suspended')
    
    // Apply filters
    await page.getByRole('button', { name: /apply/i }).click()
    
    // Verify only suspended users are shown
    await expect(page.getByText('jane_smith')).toBeVisible()
    await expect(page.getByText('john_doe')).not.toBeVisible()
  })

  test('should search users', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Enter search query
    await page.getByPlaceholder(/search/i).fill('john')
    
    // Wait for search results
    await page.waitForTimeout(500)
    
    // Verify search results
    await expect(page.getByText('john_doe')).toBeVisible()
    await expect(page.getByText('jane_smith')).not.toBeVisible()
  })

  test('should view user details', async ({ page }) => {
    // Mock user details API
    await page.route('**/admin/users/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          username: 'john_doe',
          email: 'john@example.com',
          status: 'active',
          role: 'member',
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-15T00:00:00Z',
          subscriptions: [],
          communities: [],
          statistics: {
            totalSpent: 100,
            totalCommunities: 2,
            totalCourses: 5,
            accountAge: 30
          }
        })
      })
    })
    
    await page.goto('/admin/users')
    
    // Click on user row
    await page.getByText('john_doe').click()
    
    // Verify user details page
    await expect(page).toHaveURL(/\/admin\/users\/1/)
    await expect(page.getByText('john@example.com')).toBeVisible()
  })

  test('should suspend user', async ({ page }) => {
    // Mock user details API
    await page.route('**/admin/users/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          username: 'john_doe',
          email: 'john@example.com',
          status: 'active',
          role: 'member',
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })
    
    // Mock suspend API
    await page.route('**/admin/users/1/suspend', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User suspended successfully' })
      })
    })
    
    await page.goto('/admin/users/1')
    
    // Click suspend button
    await page.getByRole('button', { name: /suspend/i }).click()
    
    // Fill in suspension reason
    await page.getByLabel(/reason/i).fill('Policy violation')
    
    // Confirm suspension
    await page.getByRole('button', { name: /confirm|suspend/i }).click()
    
    // Verify success message
    await expect(page.getByText(/suspended successfully/i)).toBeVisible()
  })

  test('should activate suspended user', async ({ page }) => {
    // Mock user details API
    await page.route('**/admin/users/2', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '2',
          username: 'jane_smith',
          email: 'jane@example.com',
          status: 'suspended',
          role: 'creator',
          createdAt: '2024-01-02T00:00:00Z'
        })
      })
    })
    
    // Mock activate API
    await page.route('**/admin/users/2/activate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User activated successfully' })
      })
    })
    
    await page.goto('/admin/users/2')
    
    // Click activate button
    await page.getByRole('button', { name: /activate/i }).click()
    
    // Fill in activation reason
    await page.getByLabel(/reason/i).fill('Appeal approved')
    
    // Confirm activation
    await page.getByRole('button', { name: /confirm|activate/i }).click()
    
    // Verify success message
    await expect(page.getByText(/activated successfully/i)).toBeVisible()
  })

  test('should reset user password', async ({ page }) => {
    // Mock user details API
    await page.route('**/admin/users/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          username: 'john_doe',
          email: 'john@example.com',
          status: 'active',
          role: 'member'
        })
      })
    })
    
    // Mock password reset API
    await page.route('**/admin/users/1/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset email sent' })
      })
    })
    
    await page.goto('/admin/users/1')
    
    // Click reset password button
    await page.getByRole('button', { name: /reset password/i }).click()
    
    // Confirm reset
    await page.getByRole('button', { name: /confirm|send/i }).click()
    
    // Verify success message
    await expect(page.getByText(/password reset|email sent/i)).toBeVisible()
  })
})
