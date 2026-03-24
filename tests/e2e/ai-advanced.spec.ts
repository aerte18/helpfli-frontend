import { test, expect } from '@playwright/test';

test.describe('Zaawansowane AI', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako wykonawca (dla AI chat) lub klient (dla innych)
    await page.goto('/login');
    // TODO: Dodaj logikę logowania
  });

  test('should display advanced pricing advice when creating offer', async ({ page }) => {
    // Przejdź do tworzenia oferty
    await page.goto('/orders/test-order-id');
    
    // Kliknij "Złóż ofertę"
    await page.click('button:has-text("Złóż ofertę")');
    
    // Wpisz cenę
    await page.fill('input[type="number"], input[name*="amount"]', '150');
    
    // Wyślij ofertę
    await page.click('button:has-text("Wyślij"), button[type="submit"]');
    
    // Poczekaj na odpowiedź
    await page.waitForTimeout(2000);
    
    // Sprawdź czy pojawiła się porada cenowa
    await expect(
      page.locator('text=Twoja oferta').or(
        page.locator('text=pozycja').or(
          page.locator('text=reasoning').or(
            page.locator('[class*="pricingAdvice"]')
          )
        )
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('should use AI chat for providers', async ({ page }) => {
    // Przejdź do strony zlecenia jako wykonawca
    await page.goto('/orders/test-order-id');
    
    // Sprawdź czy jest dostępny AI chat (jeśli jest UI)
    // TODO: Zaimplementuj UI dla AI chat w ofertach
    
    // Alternatywnie: test API endpoint
    // const response = await page.request.post('/api/ai/advanced/offer-chat', {
    //   data: { orderId: 'test-order', message: 'Jaką cenę zaproponować?' }
    // });
    // expect(response.ok()).toBeTruthy();
  });

  test('should auto-tag order with AI', async ({ page }) => {
    // Utwórz zlecenie
    await page.goto('/create-order');
    
    // Wypełnij formularz
    await page.fill('textarea[name*="description"], textarea[placeholder*="Opisz"]', 'Pilna naprawa hydrauliczna w kuchni');
    
    // Wyślij zlecenie
    await page.click('button:has-text("Utwórz"), button[type="submit"]');
    
    // Poczekaj na utworzenie
    await page.waitForTimeout(2000);
    
    // Sprawdź czy zlecenie ma tagi AI (w szczegółach zlecenia)
    // TODO: Sprawdź czy tagi są widoczne w UI
  });

  test('should predict order success', async ({ page }) => {
    // Przejdź do zlecenia
    await page.goto('/orders/test-order-id');
    
    // Sprawdź czy jest dostępna predykcja sukcesu (jeśli jest UI)
    // TODO: Zaimplementuj UI dla predykcji sukcesu
    
    // Alternatywnie: test API endpoint
    // const response = await page.request.post('/api/ai/advanced/predict-success', {
    //   data: { orderId: 'test-order' }
    // });
    // expect(response.ok()).toBeTruthy();
  });
});













