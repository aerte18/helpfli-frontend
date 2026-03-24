import { test, expect } from '@playwright/test';

test.describe('Direct Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako klient
    await page.goto('/login');
    // TODO: Dodaj logikę logowania
  });

  test('should show order type selector', async ({ page }) => {
    await page.goto('/create-order');
    
    // Sprawdź czy jest przełącznik typu zlecenia
    await expect(page.locator('text=Zapytanie do wielu wykonawców')).toBeVisible();
    await expect(page.locator('text=Bezpośrednie zlecenie')).toBeVisible();
  });

  test('should show provider search in direct mode', async ({ page }) => {
    await page.goto('/create-order');
    
    // Wybierz tryb bezpośredni
    await page.click('text=Bezpośrednie zlecenie');
    
    // Sprawdź czy jest pole wyszukiwania providera
    await expect(page.locator('input[placeholder*="wykonawcę"]')).toBeVisible();
  });

  test('should allow selecting provider from search', async ({ page }) => {
    await page.goto('/create-order');
    
    // Wybierz tryb bezpośredni
    await page.click('text=Bezpośrednie zlecenie');
    
    // Wpisz nazwę providera
    await page.fill('input[placeholder*="wykonawcę"]', 'Test Provider');
    
    // Sprawdź czy pojawiły się wyniki
    await expect(page.locator('text=Test Provider').first()).toBeVisible();
  });
});

