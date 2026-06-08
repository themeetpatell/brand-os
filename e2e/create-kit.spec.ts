import { test, expect } from '@playwright/test'

test('creator builds a media kit and sees a rate card', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('cta').click()

  await page.fill('input[name="handle"]', 'aanya.styles')
  await page.fill('input[name="displayName"]', 'Aanya')
  await page.fill('input[name="email"]', 'aanya@example.com')
  await page.selectOption('select[name="niche"]', 'fashion')
  await page.selectOption('select[name="region"]', 'IN')
  await page.fill('input[name="followerCount"]', '50000')
  await page.fill('input[name="avgLikes"]', '1400')
  await page.fill('input[name="avgComments"]', '100')
  await page.getByRole('button', { name: /build my media kit/i }).click()

  await expect(page).toHaveURL(/\/kit\//)
  await expect(page.getByTestId('rate-card')).toBeVisible()
  await expect(page.getByText(/INR/).first()).toBeVisible()
})
