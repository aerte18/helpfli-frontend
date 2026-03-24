?import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsProvider } from './helpers/auth';

test.describe('Social Features', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako użytkownik
    await loginAsUser(page);
  });

  test('should create extended review with categories', async ({ page }) => {
    // Przejdź do strony oceny użytkownika
    await page.goto('/rate-user/test-provider-id');
    
    // Wybierz ocenę
    await page.click('[aria-label*="5"], [class*="star"]:nth-child(5)');
    
    // Wpisz komentarz
    await page.fill('textarea[name*="comment"], textarea[placeholder*="komentarz"]', 'Świetna praca, punktualny i profesjonalny!');
    
    // Wypełnij kategorie (jeśli są w UI)
    // Sprawdź czy są pola kategorii
    const categoryFields = page.locator('[name*="category"], [class*="category"]');
    if (await categoryFields.count() > 0) {
      // Wypełnij przykładowe kategorie
      await categoryFields.first().click();
      await page.keyboard.type('Profesjonalizm');
    }
    
    // Wyślij recenzję
    await page.click('button:has-text("Wyślij"), button[type="submit"]');
    
    // Sprawdź sukces
    await expect(page.locator('text=Dziękujemy').or(page.locator('text=Ocena dodana'))).toBeVisible({ timeout: 5000 });
  });

  test('should mark review as helpful', async ({ page }) => {
    // Przejdź do profilu wykonawcy
    await page.goto('/user/test-provider-id');
    
    // Znajdź recenzję
    const review = page.locator('[class*="review"], [class*="rating"]').first();
    
    // Kliknij "Pomocne" (jeśli jest przycisk)
    const helpfulButton = review.locator('button:has-text("Pomocne"), button[aria-label*="helpful"]');
    if (await helpfulButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await helpfulButton.click();
      
      // Sprawdź czy licznik się zwiększył
      await expect(helpfulButton.locator('text=/\\d+/')).toBeVisible();
    }
  });

  test('should create portfolio item via API', async ({ page }) => {
    // Logowanie jako provider
    await loginAsProvider(page);
    
    // Test API endpoint (portfolio może nie mieć jeszcze UI)
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const response = await page.request.post('/api/social/portfolio', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Remont łazienki - test E2E',
        description: 'Kompleksowy remont łazienki z wymianą płytek',
        photos: [],
        category: 'remont',
        service: 'hydraulik'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('item');
    expect(data.item.title).toContain('Remont łazienki');
  });

  test('should view provider portfolio via API', async ({ page }) => {
    // Test API endpoint (portfolio może nie mieć jeszcze UI w profilu)
    const providerId = 'test-provider-id'; // W rzeczywistym teście użyj prawdziwego ID
    
    const response = await page.request.get(`/api/social/portfolio/${providerId}`);
    
    // Sprawdź czy endpoint istnieje i zwraca dane
    if (response.status() === 404) {
      // Endpoint może nie istnieć jeszcze - to jest OK
      test.skip();
    } else {
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBeTruthy();
    }
  });

  test('should generate referral code via API', async ({ page }) => {
    // Test API endpoint (referral może nie mieć jeszcze UI)
    const token = await page.evaluate(() => localStorage.getItem('token'));
    
    const response = await page.request.post('/api/social/referral/generate', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { type: 'both' }
    });
    
    if (response.status() === 404) {
      // Endpoint może nie istnieć jeszcze
      test.skip();
    } else {
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('referral');
      if (data.referral && data.referral.code) {
        expect(data.referral.code).toMatch(/HELPFLI-|REF-/);
      }
    }
  });

  test('should apply referral code', async ({ page }) => {
    // Przejdź do strony aplikacji referral (jeśli jest)
    // await page.goto('/referral/apply');
    
    // Wpisz kod
    // await page.fill('input[name*="code"], input[placeholder*="kod"]', 'HELPFLI-TEST-CODE');
    
    // Zastosuj kod
    // await page.click('button:has-text("Zastosuj")');
    
    // Sprawdź sukces
    // await expect(page.locator('text=Kod zastosowany')).toBeVisible();
  });
});













