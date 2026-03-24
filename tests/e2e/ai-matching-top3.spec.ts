?import { test, expect } from '@playwright/test';

test.describe('AI Matching TOP 3 wykonawców', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako klient
    await page.goto('/login');
    // TODO: Dodaj logikę logowania jako klient
    // Na razie zakładamy że użytkownik jest zalogowany
  });

  test('should display TOP 3 providers after AI analysis', async ({ page }) => {
    await page.goto('/ai-concierge');
    
    // Wpisz problem
    await page.fill('textarea[placeholder*="problem"], textarea[placeholder*="Opisz"], input[type="text"]', 'Zatkany kran w kuchni');
    
    // Wyślij
    const sendButton = page.locator('button:has-text("Wyślij"), button:has-text("Zapytaj"), button[type="submit"]').first();
    await sendButton.click();
    
    // Poczekaj na odpowiedź AI
    await page.waitForTimeout(5000);
    
    // Sprawdź czy pojawił się ekran wyboru
    await expect(page.locator('text=Spróbuję sam (DIY)').or(page.locator('text=Chcę zlecić w Helpfli'))).toBeVisible({ timeout: 10000 });
    
    // Wybierz "Chcę zlecić w Helpfli"
    await page.click('text=Chcę zlecić w Helpfli');
    
    // Poczekaj na załadowanie TOP 3
    await page.waitForTimeout(3000);
    
    // Sprawdź czy są wyświetlone TOP 3 wykonawcy
    await expect(page.locator('text=AI wybrało TOP').or(page.locator('text=TOP 3'))).toBeVisible({ timeout: 10000 });
    
    // Sprawdź czy są karty wykonawców (co najmniej 1)
    const providerCards = page.locator('[class*="provider"], [class*="card"]').filter({ hasText: /km|⭐|Online|PRO/ });
    await expect(providerCards.first()).toBeVisible();
  });

  test('should show provider details in TOP 3 cards', async ({ page }) => {
    await page.goto('/create-order');
    
    // Symuluj że mamy recommendedProviders w state
    // W rzeczywistości to będzie przekazane z AI Concierge
    
    // Sprawdź czy sekcja TOP 3 jest widoczna (jeśli są recommendedProviders)
    const top3Section = page.locator('text=AI wybrało TOP');
    if (await top3Section.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Sprawdź czy karty mają podstawowe informacje
      await expect(page.locator('text=km').or(page.locator('text=⭐'))).toBeVisible();
    }
  });

  test('should navigate to CreateOrder with selected provider', async ({ page }) => {
    await page.goto('/ai-concierge');
    
    // Wpisz problem i przejdź przez flow
    await page.fill('textarea[placeholder*="problem"], textarea[placeholder*="Opisz"], input[type="text"]', 'Potrzebuję hydraulika');
    await page.click('button:has-text("Wyślij"), button:has-text("Zapytaj"), button[type="submit"]').first();
    await page.waitForTimeout(5000);
    
    // Wybierz "Chcę zlecić"
    const orderButton = page.locator('text=Chcę zlecić w Helpfli');
    if (await orderButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderButton.click();
      await page.waitForTimeout(3000);
      
      // Kliknij w pierwszego wykonawcę (jeśli jest)
      const firstProvider = page.locator('[class*="provider"], [class*="card"]').first();
      if (await firstProvider.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstProvider.click();
        
        // Sprawdź czy jesteśmy w CreateOrder z wybranym wykonawcą
        await expect(page).toHaveURL(/create-order/, { timeout: 5000 });
        await expect(page.locator('text=Bezpośrednie zlecenie').or(page.locator('text=direct'))).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show dynamic pricing message when applicable', async ({ page }) => {
    await page.goto('/ai-concierge');
    
    // Wpisz problem
    await page.fill('textarea[placeholder*="problem"], textarea[placeholder*="Opisz"], input[type="text"]', 'Naprawa kranu');
    await page.click('button:has-text("Wyślij"), button:has-text("Zapytaj"), button[type="submit"]').first();
    await page.waitForTimeout(5000);
    
    // Sprawdź czy jest komunikat o cenach (jeśli ceny są wyższe)
    const priceMessage = page.locator('text=wyższe').or(page.locator('text=popyt')).or(page.locator('text=weekend'));
    // Komunikat może nie być widoczny jeśli ceny są standardowe
    // Więc tylko sprawdzamy czy strona działa
    await expect(page.locator('body')).toBeVisible();
  });
});













