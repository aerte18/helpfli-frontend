import { test, expect } from '@playwright/test';

test.describe('AI Page', () => {
  test('loads /ai and shows chat UI', async ({ page }) => {
    await page.goto('/ai-public', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root, #app, body', { state: 'attached', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Chat input visible
    await page.waitForSelector('[data-testid="ai-input"]', { state: 'visible', timeout: 15000 });
    const input = page.getByTestId('ai-input');

    // Send hello and expect message bubble
    await input.fill('Hello from E2E');
    await input.press('Enter');

    const myMsg = page.locator('[data-testid="chat-message-user"]', { hasText: 'Hello' });
    await expect(myMsg).toBeVisible();
  });
});


