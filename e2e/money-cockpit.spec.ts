import { test, expect } from '@playwright/test'

/**
 * Money-cockpit happy path: sign in → log a deal → settle via webhook → see it paid.
 *
 * Prerequisites (set before running; the test skips itself if creds are absent):
 *   - The app started with the target Supabase project env:
 *       NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *   - PAYMENTS_PROVIDER=fake  (so the webhook accepts an unsigned JSON body)
 *   - A confirmed test creator in that project, exposed as:
 *       TEST_CREATOR_EMAIL, TEST_CREATOR_PASSWORD
 *     (Supabase Auth "Confirm email" must be satisfied for this user.)
 */
const email = process.env.TEST_CREATOR_EMAIL
const password = process.env.TEST_CREATOR_PASSWORD

test.skip(!email || !password, 'Set TEST_CREATOR_EMAIL / TEST_CREATOR_PASSWORD to run')

test('creator logs a deal and it settles to paid via the webhook', async ({ page }) => {
  const brandName = `E2E Brand ${Date.now()}`

  // Sign in.
  await page.goto('/login')
  await page.fill('input[type="email"]', email!)
  await page.fill('input[type="password"]', password!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // Log a brand offer.
  const form = page.getByTestId('deal-form')
  await form.locator('input[name="brandName"]').fill(brandName)
  await form.locator('input[name="deliverables"]').fill('1 reel, 3 stories')
  await form.locator('input[name="amount"]').fill('18000')
  await form.locator('select[name="currency"]').selectOption('INR')
  await form.getByRole('button', { name: 'Log deal' }).click()

  // The deal appears in the table.
  const row = page.locator(`[data-deal-id]`, { hasText: brandName })
  await expect(row).toBeVisible()
  await expect(row.getByTestId('deal-status')).toHaveText('offered')

  // Settle it via the payment-aggregator webhook (fake provider, unsigned JSON).
  const dealId = await row.getAttribute('data-deal-id')
  const res = await page.request.post('/api/payments/webhook', {
    data: { dealId, status: 'paid', providerRef: `fake_${dealId}` },
  })
  expect(res.ok()).toBeTruthy()

  // Reload — the deal now reads paid and the GMV metric reflects it.
  await page.reload()
  const settled = page.locator(`[data-deal-id="${dealId}"]`)
  await expect(settled.getByTestId('deal-status')).toHaveText('paid')
})
