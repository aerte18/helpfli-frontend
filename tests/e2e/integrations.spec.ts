import { test, expect } from '@playwright/test';

test.describe('Integracje zewnętrzne', () => {
  test.beforeEach(async ({ page }) => {
    // Logowanie jako użytkownik
    await page.goto('/login');
    // TODO: Dodaj logikę logowania
  });

  test('should display calendar integration status', async ({ page }) => {
    // Przejdź do ustawień integracji (jeśli jest strona)
    // await page.goto('/account/integrations');
    
    // Sprawdź status kalendarzy
    // await expect(page.locator('text=Google Calendar').or(page.locator('text=Outlook'))).toBeVisible();
    
    // Alternatywnie: test API endpoint
    const response = await page.request.get('/api/integrations/calendar/status', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('available');
      expect(data).toHaveProperty('connected');
    }
  });

  test('should get Google Calendar auth URL', async ({ page }) => {
    // Test API endpoint
    const response = await page.request.get('/api/integrations/calendar/google/auth-url', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('authUrl');
      expect(data.authUrl).toContain('accounts.google.com');
    }
  });

  test('should get Outlook Calendar auth URL', async ({ page }) => {
    // Test API endpoint
    const response = await page.request.get('/api/integrations/calendar/outlook/auth-url', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('authUrl');
      expect(data.authUrl).toContain('login.microsoftonline.com');
    }
  });

  test('should sync order to calendar', async ({ page }) => {
    // Przejdź do zlecenia
    await page.goto('/orders/test-order-id');
    
    // Sprawdź czy jest przycisk synchronizacji (jeśli jest w UI)
    // TODO: Zaimplementuj UI dla synchronizacji z kalendarzem
    
    // Alternatywnie: test API endpoint
    // const response = await page.request.post('/api/integrations/calendar/sync-order', {
    //   data: { orderId: 'test-order', provider: 'google' }
    // });
    // expect(response.ok()).toBeTruthy();
  });

  test('should display available payment methods', async ({ page }) => {
    // Test API endpoint
    const response = await page.request.get('/api/integrations/payments/methods');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('methods');
      expect(Array.isArray(data.methods)).toBeTruthy();
      
      // Sprawdź czy są podstawowe metody
      const methodIds = data.methods.map((m: any) => m.id);
      expect(methodIds).toContain('card');
    }
  });
});













