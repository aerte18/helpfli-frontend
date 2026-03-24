import { test, expect } from '@playwright/test';

test.describe('Subscriptions Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako testowy użytkownik (dostosuj do swoich danych testowych)
    await page.goto('/login');
    // TODO: Dodaj logikę logowania lub użyj testowego tokenu
  });

  test('should display subscription plans for providers', async ({ page }) => {
    await page.goto('/subscriptions?audience=provider');
    
    // Sprawdź czy są wyświetlone plany
    await expect(page.locator('text=PROV_FREE')).toBeVisible();
    await expect(page.locator('text=PROV_STD')).toBeVisible();
    await expect(page.locator('text=PROV_PRO')).toBeVisible();
  });

  test('should display subscription plans for clients', async ({ page }) => {
    await page.goto('/subscriptions?audience=client');
    
    // Sprawdź czy są wyświetlone plany
    await expect(page.locator('text=CLIENT_FREE')).toBeVisible();
    await expect(page.locator('text=CLIENT_STD')).toBeVisible();
    await expect(page.locator('text=CLIENT_PRO')).toBeVisible();
  });

  test('should show current subscription status', async ({ page }) => {
    await page.goto('/account');
    
    // Sprawdź czy jest sekcja z subskrypcją
    await expect(page.locator('text=Twoja subskrypcja')).toBeVisible();
  });

  // TODO: Dodać testy dla:
  // - Wyboru planu i przekierowania do checkout
  // - Mock płatności w dev mode
  // - Aktywacji subskrypcji po płatności
});

