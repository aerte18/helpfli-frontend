import { test, expect } from '@playwright/test';

/**
 * Smoke: public pages render and consent banner appears.
 * Requires: frontend dev/preview server (baseURL in playwright.config).
 */
test.describe('Public smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/Helpfli/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /logowanie|zaloguj/i })).toBeVisible();
  });

  test('privacy policy mentions analytics tools', async ({ page }) => {
    await page.goto('/prywatnosc', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Google Analytics/i)).toBeVisible();
  });
});
