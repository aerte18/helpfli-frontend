import { test, expect } from '@playwright/test';

test.describe('Promotions Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako provider
    await page.goto('/login');
    // TODO: Dodaj logikę logowania jako provider
  });

  test('should display promotion plans', async ({ page }) => {
    await page.goto('/promote');
    
    // Sprawdź czy są wyświetlone plany promocyjne
    await expect(page.locator('text=24h')).toBeVisible();
    await expect(page.locator('text=7 dni')).toBeVisible();
  });

  test('should apply coupon code', async ({ page }) => {
    await page.goto('/promote');
    
    // Wpisz kod kuponu
    await page.fill('input[placeholder*="kod"]', 'TEST2024');
    
    // Sprawdź czy cena się zaktualizowała
    await expect(page.locator('text=Zniżka')).toBeVisible();
  });

  // TODO: Dodać testy dla:
  // - Zakupu promocji
  // - Aktywacji badge'ów po płatności
  // - Wyświetlania promocji w profilu
});

