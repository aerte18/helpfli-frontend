import { test, expect } from '@playwright/test';

/**
 * Smoke: auth-related public pages and form accessibility.
 * Requires: frontend dev/preview server (baseURL in playwright.config).
 */
test.describe('Auth smoke', () => {
  test.describe.configure({ mode: 'serial' });

  async function dismissCookieBanner(page) {
    const reject = page.getByRole('button', { name: /tylko niezbędne/i });
    if (await reject.isVisible().catch(() => false)) {
      await reject.click();
    }
  }

  test('login page has labeled fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { name: /zaloguj/i })).toBeVisible();
    await expect(main.getByLabel(/^email$/i)).toBeVisible();
    await expect(main.getByLabel(/^hasło$/i)).toBeVisible();
    await expect(main.getByRole('link', { name: /zarejestruj/i })).toBeVisible();
  });

  test('register page has role selector and labels', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { name: /rejestracja/i })).toBeVisible();
    await expect(main.getByRole('radiogroup', { name: /typ konta/i })).toBeVisible();
    await expect(main.getByLabel(/imię i nazwisko/i)).toBeVisible();
    await expect(main.getByLabel(/^email$/i)).toBeVisible();
    await expect(main.getByLabel(/^telefon$/i)).toBeVisible();
    await expect(main.getByLabel(/^hasło$/i)).toBeVisible();
  });

  test('login shows alert on invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Nieprawidłowy email lub hasło' }),
      });
    });
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    const main = page.locator('#main-content');
    await main.getByLabel(/^email$/i).fill('e2e-invalid@helpfli.test');
    await main.getByLabel(/^hasło$/i).fill('wrong-password-123');
    await main.getByRole('button', { name: /zaloguj/i }).click();
    await expect(main.getByRole('alert')).toBeVisible({ timeout: 15_000 });
  });

  test('checkout redirects guests to login with return url', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);
    await expect(page).toHaveURL(/\/login/);
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { name: /zaloguj/i })).toBeVisible();
    await expect(main.getByRole('link', { name: /zarejestruj/i })).toHaveAttribute('href', /next=%2Fcheckout/);
  });
});
