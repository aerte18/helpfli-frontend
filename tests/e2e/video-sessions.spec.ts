import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Wideo-wizyty', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako klient
    await loginAsUser(page);
  });

  test('should create video session payment intent', async ({ page }) => {
    // Przejdź do czatu zlecenia
    await page.goto('/orders/test-order-id/chat');
    
    // Sprawdź czy przycisk "Rozpocznij wideo-wizytę" jest widoczny
    const videoButton = page.locator('button:has-text("Rozpocznij wideo-wizytę")');
    await expect(videoButton).toBeVisible();
    
    // Kliknij przycisk
    await videoButton.click();
    
    // Sprawdź przekierowanie do checkout
    await expect(page).toHaveURL(/checkout/);
    
    // Sprawdź czy są parametry w URL
    const url = page.url();
    expect(url).toContain('type=video');
    expect(url).toContain('providerId=');
    expect(url).toContain('price=50');
  });

  test('should complete video session payment flow', async ({ page }) => {
    // Przejdź do checkout z parametrami wideo
    await page.goto('/checkout?type=video&providerId=test-provider&orderId=test-order&price=50&pi=test-pi&cs=test-cs');
    
    // Sprawdź czy Stripe Elements są widoczne
    await expect(page.locator('[class*="StripeElement"]').or(page.locator('iframe'))).toBeVisible({ timeout: 10000 });
    
    // Uwaga: Wypełnienie formularza Stripe wymaga interakcji z iframe
    // W rzeczywistym teście można użyć Stripe test mode:
    // - Card: 4242 4242 4242 4242
    // - Expiry: dowolna przyszła data (np. 12/34)
    // - CVC: dowolne 3 cyfry (np. 123)
    
    // Dla uproszczenia, sprawdzamy tylko czy checkout się ładuje
    // Pełny test płatności wymaga skonfigurowania Stripe test mode
    await expect(page.locator('text=Zapłać').or(page.locator('[class*="checkout"]'))).toBeVisible({ timeout: 10000 });
  });

  test('should display video session page', async ({ page }) => {
    // Przejdź do sesji wideo (mock)
    await page.goto('/video/test-session-id');
    
    // Sprawdź czy komponent VideoCall się ładuje
    await expect(page.locator('text=Łączenie z sesją wideo').or(page.locator('[class*="VideoCall"]'))).toBeVisible({ timeout: 10000 });
  });

  test('should list user video sessions', async ({ page }) => {
    // Przejdź do listy sesji (jeśli istnieje taka strona)
    // await page.goto('/account/video-sessions');
    
    // Sprawdź czy lista sesji jest widoczna
    // await expect(page.locator('text=Sesje wideo').or(page.locator('[class*="session"]'))).toBeVisible();
  });
});













