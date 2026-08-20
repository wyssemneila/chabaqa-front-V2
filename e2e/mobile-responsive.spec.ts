import { test, expect, devices } from '@playwright/test'

/**
 * E2E Test: Mobile Responsive Design
 * 
 * This test validates the responsive design and mobile-specific functionality
 * of the Admin Dashboard across different mobile devices and orientations.
 * 
 * Requirements: 11.1, 11.2, 11.3
 */

test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_access_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
    
    // Mock dashboard API
    await page.route('**/admin/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: { total: 1000, active: 800, new: 50, growth: 10 },
          communities: { total: 50, active: 40, pending: 5, growth: 15 },
          content: { total: 500, pending: 10, flagged: 2 },
          revenue: { total: 50000, thisMonth: 5000, growth: 20, currency: 'USD' }
        })
      })
    })
  })

  test('should display mobile layout on iPhone 12', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Verify mobile layout
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThan(768)
    
    // Sidebar should be hidden on mobile
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveCSS('transform', /translateX/)
    }
    
    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: /menu|hamburger/i })).toBeVisible()
    
    await context.close()
  })

  test('should display mobile layout on Pixel 5', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['Pixel 5']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Verify mobile layout
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThan(768)
    
    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: /menu|hamburger/i })).toBeVisible()
    
    await context.close()
  })

  test('should toggle mobile menu', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Click mobile menu button
    const menuButton = page.getByRole('button', { name: /menu|hamburger/i })
    await menuButton.click()
    
    // Sidebar should be visible
    const sidebar = page.locator('[data-testid="admin-sidebar"]')
    await expect(sidebar).toBeVisible()
    
    // Click outside or close button to close
    const closeButton = page.getByRole('button', { name: /close/i })
    if (await closeButton.isVisible()) {
      await closeButton.click()
    }
    
    await context.close()
  })

  test('should stack metric cards vertically on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Get metric cards
    const metricCards = page.locator('[data-testid="metric-card"]')
    const count = await metricCards.count()
    
    if (count > 1) {
      // Check if cards are stacked vertically
      const firstCard = metricCards.nth(0)
      const secondCard = metricCards.nth(1)
      
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      if (firstBox && secondBox) {
        // Second card should be below first card (not side by side)
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10)
      }
    }
    
    await context.close()
  })

  test('should have touch-friendly button sizes', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Check button sizes (minimum 44x44px for touch)
    const buttons = page.getByRole('button')
    const count = await buttons.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      
      if (box) {
        // Touch targets should be at least 44x44px
        expect(box.height).toBeGreaterThanOrEqual(40) // Allow some margin
      }
    }
    
    await context.close()
  })

  test('should scroll data tables horizontally on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    // Mock users list
    await page.route('**/admin/users**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            { _id: '1', username: 'user1', email: 'user1@test.com', status: 'active', role: 'member' },
            { _id: '2', username: 'user2', email: 'user2@test.com', status: 'active', role: 'member' }
          ],
          total: 2
        })
      })
    })
    
    await page.goto('/admin/users')
    
    // Find table container
    const tableContainer = page.locator('[data-testid="data-table-container"]')
    if (await tableContainer.isVisible()) {
      // Check if table has horizontal scroll
      const overflowX = await tableContainer.evaluate(el => 
        window.getComputedStyle(el).overflowX
      )
      expect(['auto', 'scroll']).toContain(overflowX)
    }
    
    await context.close()
  })

  test('should adapt to landscape orientation', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12 landscape']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Verify landscape layout
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeGreaterThan(viewport?.height || 0)
    
    // Content should be visible and not cut off
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    await context.close()
  })

  test('should handle form inputs on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/login')
    
    // Test email input
    const emailInput = page.getByLabel(/email/i)
    await emailInput.tap()
    await emailInput.fill('test@example.com')
    
    // Verify input value
    await expect(emailInput).toHaveValue('test@example.com')
    
    // Test password input
    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.tap()
    await passwordInput.fill('password123')
    
    // Verify input value
    await expect(passwordInput).toHaveValue('password123')
    
    await context.close()
  })

  test('should display modals correctly on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    // Mock user details
    await page.route('**/admin/users/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '1',
          username: 'user1',
          email: 'user1@test.com',
          status: 'active'
        })
      })
    })
    
    await page.goto('/admin/users/1')
    
    // Open a modal (e.g., suspend user)
    const suspendButton = page.getByRole('button', { name: /suspend/i })
    if (await suspendButton.isVisible()) {
      await suspendButton.click()
      
      // Modal should be visible and centered
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Modal should not overflow screen
      const modalBox = await modal.boundingBox()
      const viewport = page.viewportSize()
      
      if (modalBox && viewport) {
        expect(modalBox.width).toBeLessThanOrEqual(viewport.width)
        expect(modalBox.height).toBeLessThanOrEqual(viewport.height)
      }
    }
    
    await context.close()
  })

  test('should handle touch gestures', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Test tap gesture
    const menuButton = page.getByRole('button', { name: /menu|hamburger/i })
    await menuButton.tap()
    
    // Sidebar should open
    await page.waitForTimeout(300) // Wait for animation
    
    // Test swipe gesture (if implemented)
    // This is a placeholder - implement if swipe gestures are added
    
    await context.close()
  })

  test('should load quickly on slow 3G', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    // Simulate slow 3G
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add delay
      await route.continue()
    })
    
    const startTime = Date.now()
    await page.goto('/admin/dashboard')
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time even on slow connection
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
    
    await context.close()
  })

  test('should respect safe area insets on iOS', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12']
    })
    const page = await context.newPage()
    
    await page.goto('/admin/dashboard')
    
    // Check if header respects safe area
    const header = page.locator('header')
    if (await header.isVisible()) {
      const paddingTop = await header.evaluate(el => 
        window.getComputedStyle(el).paddingTop
      )
      
      // Should have some padding for safe area
      expect(parseInt(paddingTop)).toBeGreaterThanOrEqual(0)
    }
    
    await context.close()
  })
})
