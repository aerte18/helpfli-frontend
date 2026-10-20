import { test, expect } from '@playwright/test';

test.describe('Krytyczna ścieżka mobile', () => {
  test('landing i formularz zlecenia nie wychodzą poza ekran', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Helpfli/i);

    const landingOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth
    );
    expect(landingOverflow).toBeLessThanOrEqual(1);

    await page.goto('/create-order?source=mobile_test', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Wyślij zlecenie do wykonawców/i })).toBeVisible();

    const description = page.locator('#order-description');
    await description.focus();
    await description.fill('Potrzebuję pomocy przy naprawie przeciekającego kranu w kuchni.');
    const fontSize = await description.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(16);

    const formOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth
    );
    expect(formOverflow).toBeLessThanOrEqual(1);
  });

  test('landing pozostaje użyteczny przy wolnym API', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Najpierw zobacz mapę wykonawców/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
