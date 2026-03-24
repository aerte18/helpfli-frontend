import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers/auth';

test.describe('Payments Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako testowy użytkownik
    await loginAsUser(page);
  });

  test('should create payment intent for order', async ({ page }) => {
    // Przejdź do zlecenia
    await page.goto('/orders/test-order-id');
    
    // Kliknij "Zapłać"
    await page.click('text=Zapłać');
    
    // Sprawdź czy jest przekierowanie do checkout lub Stripe Elements
    await expect(page).toHaveURL(/checkout|stripe/);
  });

  test('should display payment status after successful payment', async ({ page }) => {
    // Przejdź do strony wyniku płatności (mock)
    await page.goto('/payment-result?success=true&paymentId=test-payment-id');
    
    // Sprawdź komunikat sukcesu
    await expect(page.locator('text=Zapłacono').or(page.locator('text=Płatność zakończona'))).toBeVisible({ timeout: 5000 });
  });

  test('should handle payment error', async ({ page }) => {
    // Przejdź do strony wyniku płatności z błędem
    await page.goto('/payment-result?success=false&error=payment_failed');
    
    // Sprawdź komunikat błędu
    await expect(page.locator('text=Błąd').or(page.locator('text=Płatność nieudana'))).toBeVisible({ timeout: 5000 });
  });

  // Uwaga: Testy webhook i refund wymagają mockowania Stripe API
  // Można je dodać w przyszłości z użyciem MSW (Mock Service Worker) lub podobnego narzędzia
});

