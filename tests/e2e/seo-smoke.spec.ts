import { test, expect } from '@playwright/test';

/**
 * Smoke: public SEO surfaces + core routing (no login required).
 * Run: npm run test:e2e -- seo-smoke
 */
test.describe('SEO smoke', () => {
  test('landing page loads with Helpfli branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root, body', { state: 'attached', timeout: 30000 });
    await expect(page).toHaveTitle(/Helpfli/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('PSEO hub /wykonawcy loads', async ({ page }) => {
    await page.goto('/wykonawcy', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root, body', { state: 'attached', timeout: 30000 });
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await expect(body).toContainText(/wykonawc|Helpfli|usług/i);
  });

  test('poradniki hub loads', async ({ page }) => {
    await page.goto('/poradniki', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root, body', { state: 'attached', timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('search hub /home loads', async ({ page }) => {
    await page.goto('/home', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root, body', { state: 'attached', timeout: 30000 });
    await expect(page).toHaveTitle(/Helpfli|wykonawc/i);
  });

  test('sitemap.xml is reachable and valid XML', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';
    const res = await request.get(`${apiBase}/sitemap.xml`);
    expect(res.status()).toBeLessThan(500);
    const text = await res.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('<urlset');
    expect(text).toContain('helpfli.pl');
  });

  test('robots.txt references sitemap', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';
    const res = await request.get(`${apiBase}/robots.txt`);
    expect(res.status()).toBeLessThan(500);
    const text = await res.text();
    expect(text.toLowerCase()).toContain('sitemap:');
  });
});
