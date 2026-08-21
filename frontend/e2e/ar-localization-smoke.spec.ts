import { test, expect } from '@playwright/test'

test.describe('Arabic localization smoke', () => {
  test('signin page renders Arabic locale and content', async ({ page }) => {
    await page.goto('/ar/signin')

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.getByText('سجّل الدخول إلى مساحة شبكة الخاصة بك')).toBeVisible()
    await expect(page.getByRole('button', { name: 'تسجيل الدخول' })).toBeVisible()
  })

  test('forgot-password page is localized in Arabic', async ({ page }) => {
    await page.goto('/ar/forgot-password')

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByText('هل نسيت كلمة المرور؟')).toBeVisible()
    await expect(page.getByRole('button', { name: 'إرسال رمز التحقق' })).toBeVisible()
    await expect(page.locator('a[href="/ar/signin"]')).toBeVisible()
  })

  test('reset-password page is localized in Arabic', async ({ page }) => {
    await page.goto('/ar/reset-password?email=test@example.com')

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByText('إعادة تعيين كلمة المرور')).toBeVisible()
    await expect(page.getByRole('button', { name: 'إعادة تعيين كلمة المرور' })).toBeVisible()
  })

  test('verify-email page is localized in Arabic', async ({ page }) => {
    await page.goto('/ar/verify-email?email=test@example.com')

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByText('تأكيد البريد الإلكتروني')).toBeVisible()
    await expect(page.getByRole('button', { name: 'تحقق وأنشئ الحساب' })).toBeVisible()
  })

  test('explore page boots under Arabic locale', async ({ page }) => {
    await page.goto('/ar/explore')

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page).toHaveURL(/\/ar\/explore/)
  })

  test.fixme('community entry smoke requires SSR backend mocking support', async () => {})
})
