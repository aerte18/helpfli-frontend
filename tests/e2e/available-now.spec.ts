import { test, expect } from '@playwright/test';

test.describe('Available Now Feature', () => {
  test('should display "Dostępny teraz" section on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Sprawdź czy jest sekcja "Dostępny teraz"
    await expect(page.locator('text=Potrzebujesz kogoś TERAZ')).toBeVisible();
  });

  test('should filter providers by available now', async ({ page }) => {
    await page.goto('/home');
    
    // Kliknij filtr "Dostępny teraz"
    await page.click('text=⚡ Teraz');
    
    // Sprawdź czy URL zawiera availableNow
    await expect(page).toHaveURL(/availableNow=true/);
  });

  test('should show online badge for available providers', async ({ page }) => {
    await page.goto('/home?availableNow=true');
    
    // Sprawdź czy są providerzy z badge "Dostępny teraz"
    await expect(page.locator('text=Dostępny teraz').first()).toBeVisible();
  });
});

