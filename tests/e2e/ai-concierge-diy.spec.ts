?import { test, expect } from '@playwright/test';

test.describe('AI Concierge DIY vs Order', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako klient
    await page.goto('/login');
    // TODO: Dodaj logikę logowania
  });

  test('should show choice screen after AI analysis', async ({ page }) => {
    await page.goto('/ai-concierge');
    
    // Wpisz problem
    await page.fill('textarea[placeholder*="problem"]', 'Zepsuła się pralka');
    
    // Wyślij
    await page.click('button:has-text("Wyślij")');
    
    // Poczekaj na odpowiedź
    await page.waitForTimeout(3000);
    
    // Sprawdź czy pojawił się ekran wyboru
    await expect(page.locator('text=Spróbuję sam (DIY)')).toBeVisible();
    await expect(page.locator('text=Chcę zlecić w Helpfli')).toBeVisible();
  });

  test('should show DIY steps when choosing DIY', async ({ page }) => {
    await page.goto('/create-order');
    
    // Symuluj tryb DIY (jeśli jest w state)
    // TODO: Przekaż state z mode: 'diy'
    
    // Sprawdź czy są wyświetlone kroki
    await expect(page.locator('text=Kroki naprawy DIY')).toBeVisible();
  });

  test('should show price hints when choosing order', async ({ page }) => {
    await page.goto('/ai-concierge');
    
    // Wpisz problem i wyślij
    await page.fill('textarea[placeholder*="problem"]', 'Zepsuła się pralka');
    await page.click('button:has-text("Wyślij")');
    await page.waitForTimeout(3000);
    
    // Wybierz "Chcę zlecić"
    await page.click('text=Chcę zlecić w Helpfli');
    
    // Sprawdź czy są widełki cenowe
    await expect(page.locator('text=Orientacyjna cena')).toBeVisible();
  });
});

