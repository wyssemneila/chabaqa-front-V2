import { test, expect } from '@playwright/test'

/**
 * E2E Test: Admin Login Flow with 2FA
 * 
 * This test validates the complete authentication flow including:
 * - Login form rendering
 * - Credential submission
 * - 2FA code handling
 * - Token storage
 * - Redirect to dashboard
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Verify login form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    
    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Verify error message is displayed
    await expect(page.getByText(/invalid credentials|authentication failed/i)).toBeVisible()
  })

  test('should handle login without 2FA', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Mock API response for login without 2FA
    await page.route('**/admin/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requires2FA: false,
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          admin: {
            _id: '123',
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'admin'
          }
        })
      })
    })
    
    // Fill in valid credentials
    await page.getByLabel(/email/i).fill('admin@test.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    
    // Verify tokens are stored
    const accessToken = await page.evaluate(() => localStorage.getItem('admin_access_token'))
    const refreshToken = await page.evaluate(() => localStorage.getItem('admin_refresh_token'))
    
    expect(accessToken).toBeTruthy()
    expect(refreshToken).toBeTruthy()
  })

  test('should handle login with 2FA', async ({ page }) => {
    await page.goto('/admin/login')
    
    // Mock API response for login requiring 2FA
    await page.route('**/admin/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requires2FA: true,
          message: '2FA code sent'
        })
      })
    })
    
    // Mock API response for 2FA verification
    await page.route('**/admin/auth/verify-2fa', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          admin: {
            _id: '123',
            name: 'Test Admin',
            email: 'admin@test.com',
            role: 'admin'
          }
        })
      })
    })
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('admin@test.com')
    await page.getByLabel(/password/i).fill('password123')
    
    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Verify 2FA input is shown
    await expect(page.getByLabel(/2fa code|verification code/i)).toBeVisible()
    
    // Enter 2FA code
    await page.getByLabel(/2fa code|verification code/i).fill('123456')
    
    // Submit 2FA
    await page.getByRole('button', { name: /verify|submit/i }).click()
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/admin/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('should handle logout', async ({ page }) => {
    // Set up authenticated state
    await page.goto('/admin/login')
    await page.evaluate(() => {
      localStorage.setItem('admin_access_token', 'mock_token')
      localStorage.setItem('admin_refresh_token', 'mock_refresh_token')
    })
    
    // Navigate to dashboard
    await page.goto('/admin/dashboard')
    
    // Mock logout API
    await page.route('**/admin/auth/logout', async (route) => {
      await route.fulfill({ status: 200 })
    })
    
    // Click logout button (in header or sidebar)
    await page.getByRole('button', { name: /logout|sign out/i }).click()
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/admin\/login/)
    
    // Verify tokens are cleared
    const accessToken = await page.evaluate(() => localStorage.getItem('admin_access_token'))
    const refreshToken = await page.evaluate(() => localStorage.getItem('admin_refresh_token'))
    
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
  })
})
