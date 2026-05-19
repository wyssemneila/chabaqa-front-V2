import { expect, test } from "@playwright/test"

const creatorState = process.env.TEST_CREATOR_STORAGE_STATE || ""
const creatorBase = process.env.TEST_CREATOR_BASE_PATH || "/creator/dashboard"

test.describe("creator visual smoke", () => {
  test.skip(!creatorState, "Set TEST_CREATOR_STORAGE_STATE to run authenticated creator visual smoke")
  test.use({ storageState: creatorState })

  const pages = [
    { name: "dashboard", path: creatorBase, marker: /launch setup|creator launch checklist/i },
    { name: "courses", path: "/creator/courses", marker: /create course/i },
    { name: "products", path: "/creator/products", marker: /create product/i },
    { name: "sessions", path: "/creator/sessions", marker: /create session/i },
    { name: "events", path: "/creator/events", marker: /create event/i },
    { name: "posts", path: "/creator/posts", marker: /create post/i },
    { name: "payouts", path: "/creator/monetization/payouts", marker: /payout|balance|bank/i },
  ]

  for (const pageConfig of pages) {
    test(`${pageConfig.name} desktop screenshot`, async ({ page }) => {
      await page.goto(pageConfig.path)
      await expect(page.getByText(pageConfig.marker).first()).toBeVisible({ timeout: 15000 })
      await page.screenshot({
        path: `test-results/creator-${pageConfig.name}-desktop.png`,
        fullPage: true,
      })
    })
  }

  test("dashboard mobile screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(creatorBase)
    await expect(page.getByText(/launch setup|creator launch checklist/i).first()).toBeVisible({ timeout: 15000 })
    await page.screenshot({
      path: "test-results/creator-dashboard-mobile.png",
      fullPage: true,
    })
  })

  test("create course draft screen has normalized shell actions", async ({ page }) => {
    await page.goto("/creator/courses/new")
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /preview/i })).toBeVisible()
    await page.screenshot({
      path: "test-results/creator-course-create-desktop.png",
      fullPage: true,
    })
  })

  test("create product draft screen has normalized shell actions", async ({ page }) => {
    await page.goto("/creator/products/new")
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /preview/i })).toBeVisible()
    await page.screenshot({
      path: "test-results/creator-product-create-desktop.png",
      fullPage: true,
    })
  })
})
