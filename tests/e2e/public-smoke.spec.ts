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

  test('landing map CTA opens Home directly in map view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /Najpierw zobacz mapę wykonawców/i }).click();

    await expect(page).toHaveURL(/\/home\?view=map&source=landing_map/);
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /logowanie|zaloguj/i })).toBeVisible();
  });

  test('privacy policy mentions analytics tools', async ({ page }) => {
    await page.goto('/prywatnosc', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Google Analytics/i)).toBeVisible();
  });

  test('guest can open and start the order form without a login redirect', async ({ page }) => {
    await page.goto('/create-order?source=landing_hero', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/create-order/);
    await expect(page.getByText(/Najpierw opisz zadanie — bez logowania/i)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('order registration asks for one password and keeps the return path', async ({ page }) => {
    await page.goto('/register?role=client&intent=order&next=%2Fcreate-order%3Fresume%3D1', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByRole('heading', { name: /Potwierdź dane i wyślij zlecenie/i })).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.locator('#reg-confirm-password')).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: /Typ konta/i })).toHaveCount(0);
    await expect(page.locator('#main-content').getByRole('link', { name: /Zaloguj się/i })).toHaveAttribute(
      'href',
      /next=%2Fcreate-order/
    );
  });
});
