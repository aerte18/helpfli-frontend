import { test, expect } from '@playwright/test';

test.describe('AI Widget', () => {
  test('opens widget and sends message', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Debug: log what's actually in the DOM
    const bodyContent = await page.textContent('body');
    console.log('Body content length:', bodyContent?.length);
    
    // Wait for animations to settle and use data-testid
    await page.waitForTimeout(2000); // Let animations settle
    const floatingButton = page.getByTestId('ai-fab');
    await floatingButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Force click to bypass animation stability issues
    await floatingButton.click({ force: true });

    // Modal/chat visible
    await page.waitForSelector('div[role="dialog"], div[aria-modal="true"], .fixed.inset-0', { state: 'visible', timeout: 15000 });

    // Input present and send a short message
    await page.waitForSelector('[data-testid="ai-input"]', { state: 'visible', timeout: 15000 });
    await page.getByTestId('ai-input').fill('Cześć!');
    await page.getByTestId('ai-input').press('Enter');

    // Expect message to render in the chat list
    const myMsg = page.locator('[data-testid="chat-message-user"]', { hasText: 'Cześć' });
    await expect(myMsg).toBeVisible();
  });
});


