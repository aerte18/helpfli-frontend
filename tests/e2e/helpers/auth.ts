?/**
 * Helper functions dla testów E2E - autoryzacja
 */

import { Page } from '@playwright/test';

/**
 * Logowanie użytkownika testowego
 */
export async function loginAsUser(page: Page, email?: string, password?: string) {
  const testEmail = email || process.env.TEST_USER_EMAIL || 'test+client@helpfli.pl';
  const testPassword = password || process.env.TEST_USER_PASSWORD || 'Test123!';
  
  await page.goto('/login');
  
  // Wypełnij formularz logowania
  await page.fill('input[name="email"], input[type="email"]', testEmail);
  await page.fill('input[name="password"], input[type="password"]', testPassword);
  
  // Kliknij przycisk logowania
  await page.click('button[type="submit"], button:has-text("Zaloguj")');
  
  // Czekaj na przekierowanie (sukces) lub błąd
  await page.waitForURL(/\/home|\/account|\/provider-home|\/dashboard/, { timeout: 10000 });
}

/**
 * Logowanie jako provider
 */
export async function loginAsProvider(page: Page) {
  const email = process.env.TEST_PROVIDER_EMAIL || 'test+provider@helpfli.pl';
  const password = process.env.TEST_PROVIDER_PASSWORD || 'Test123!';
  await loginAsUser(page, email, password);
}

/**
 * Logowanie jako admin
 */
export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL || 'test+admin@helpfli.pl';
  const password = process.env.TEST_ADMIN_PASSWORD || 'Test123!';
  await loginAsUser(page, email, password);
}

/**
 * Wylogowanie użytkownika
 */
export async function logout(page: Page) {
  // Kliknij menu użytkownika
  const userMenu = page.locator('[aria-label*="menu"], button:has-text("Wyloguj"), [class*="user-menu"]').first();
  if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userMenu.click();
  }
  
  // Kliknij "Wyloguj"
  await page.click('button:has-text("Wyloguj"), a:has-text("Wyloguj")');
  
  // Czekaj na przekierowanie do strony głównej
  await page.waitForURL(/\/login|\/home|\//, { timeout: 5000 });
}

/**
 * Sprawdź czy użytkownik jest zalogowany
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Sprawdź czy jest token w localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (token) return true;
  
  // Sprawdź czy jest przycisk wylogowania
  const logoutButton = page.locator('button:has-text("Wyloguj"), a:has-text("Wyloguj")');
  return await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
}

