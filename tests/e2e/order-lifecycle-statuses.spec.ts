import { expect, Page, test } from '@playwright/test';

type UserRole = 'client' | 'provider';

async function mockAccount(page: Page, role: UserRole, orders: object[], offers: object[] = []) {
  const user = {
    _id: role === 'client' ? 'client-1' : 'provider-1',
    id: role === 'client' ? 'client-1' : 'provider-1',
    name: role === 'client' ? 'Klient Testowy' : 'Wykonawca Testowy',
    email: `${role}@example.test`,
    emailVerified: true,
    onboardingCompleted: true,
    role,
  };

  await page.addInitScript(({ cachedUser }) => {
    localStorage.setItem('token', 'e2e-token');
    localStorage.setItem('user', JSON.stringify(cachedUser));
  }, { cachedUser: user });

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/auth/me') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) });
    }
    if (url.pathname === '/api/orders/my') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders }) });
    }
    if (url.pathname === '/api/offers/my') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ offers }) });
    }
    if (url.pathname === '/api/provider-stats') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test.describe('account lifecycle status menu', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => console.error(`[browser pageerror] ${error.stack || error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(`[browser console] ${message.text()}`);
    });
  });

  test('client sees payment, realization, dispute and terminal statuses', async ({ page }) => {
    await mockAccount(page, 'client', [
      { _id: 'c-open', client: 'client-1', service: 'Otwarte test', status: 'open' },
      { _id: 'c-offers', client: 'client-1', service: 'Oferty test', status: 'collecting_offers', offers: [{}] },
      { _id: 'c-pay', client: 'client-1', service: 'Płatność test', status: 'accepted', paymentPreference: 'system', paymentStatus: 'unpaid' },
      { _id: 'c-contact', client: 'client-1', service: 'Kontakt test', status: 'accepted', orderMode: 'offers_only', paymentPreference: 'external', contactUnlockStatus: 'unpaid' },
      { _id: 'c-progress', client: 'client-1', service: 'Realizacja test', status: 'in_progress' },
      { _id: 'c-confirm', client: 'client-1', service: 'Odbiór test', status: 'completed', paymentPreference: 'system' },
      { _id: 'c-release', client: 'client-1', service: 'Rozliczenie test', status: 'releasing' },
      { _id: 'c-done', client: 'client-1', service: 'Koniec test', status: 'released' },
      { _id: 'c-dispute', client: 'client-1', service: 'Spór test', status: 'disputed' },
      { _id: 'c-cancel', client: 'client-1', service: 'Anulowanie test', status: 'cancelled' },
    ]);

    await page.goto('/account?tab=orders');
    await expect(page.getByRole('heading', { name: 'Zlecenia', exact: true })).toBeVisible();
    for (const filter of ['Otwarte', 'Oferty złożone', 'Oferta zaakceptowana', 'W realizacji', 'Zakończone', 'Spory', 'Anulowane']) {
      await expect(page.getByRole('button', { name: filter, exact: true })).toBeVisible();
    }
    for (const label of ['Oczekuje na płatność', 'Odblokuj kontakt', 'Do potwierdzenia', 'Rozliczenie w toku', 'Spór w toku', 'Anulowane']) {
      await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
    }
  });

  test('provider sees won, waiting, lost, dispute and terminal statuses without false payment claims', async ({ page }) => {
    const makeOffer = (id: string, order: object, status = 'accepted') => ({
      _id: id,
      providerId: 'provider-1',
      status,
      createdAt: '2026-10-20T10:00:00.000Z',
      orderId: order,
    });
    const offers = [
      makeOffer('p-sent', { _id: 'p-order-sent', service: 'Oferta oczekuje', status: 'collecting_offers' }, 'sent'),
      makeOffer('p-pay', { _id: 'p-order-pay', service: 'Klient płaci', status: 'accepted', acceptedOfferId: 'p-pay', provider: 'provider-1', paymentPreference: 'system', paymentStatus: 'unpaid' }),
      makeOffer('p-external', { _id: 'p-order-external', service: 'Poza platformą', status: 'accepted', acceptedOfferId: 'p-external', provider: 'provider-1', orderMode: 'offers_only', paymentPreference: 'external', contactUnlockStatus: 'succeeded' }),
      makeOffer('p-progress', { _id: 'p-order-progress', service: 'Wykonuję', status: 'in_progress', acceptedOfferId: 'p-progress', provider: 'provider-1' }),
      makeOffer('p-confirm', { _id: 'p-order-confirm', service: 'Czeka na klienta', status: 'completed', acceptedOfferId: 'p-confirm', provider: 'provider-1' }),
      makeOffer('p-dispute', { _id: 'p-order-dispute', service: 'Sprawa', status: 'disputed', acceptedOfferId: 'p-dispute', provider: 'provider-1' }),
      makeOffer('p-cancel', { _id: 'p-order-cancel', service: 'Anulowane zlecenie', status: 'cancelled', acceptedOfferId: 'p-cancel', provider: 'provider-1' }),
      makeOffer('p-lost', { _id: 'p-order-lost', service: 'Wybrano innego', status: 'accepted', acceptedOfferId: 'other-offer', provider: 'other-provider' }, 'rejected'),
      makeOffer('p-expired', { _id: 'p-order-expired', service: 'Wygasła oferta', status: 'collecting_offers' }, 'expired'),
    ];
    await mockAccount(page, 'provider', [], offers);

    await page.goto('/account?tab=orders');
    await expect(page.getByRole('heading', { name: 'Zlecenia', exact: true })).toBeVisible();
    for (const filter of ['Złożone', 'Zaakceptowane', 'W realizacji', 'Zakończone', 'Spory', 'Anulowane', 'Nieaktywne']) {
      await expect(page.getByRole('button', { name: filter, exact: true })).toBeVisible();
    }
    for (const label of ['Oferta złożona', 'Oferta wybrana', 'Gotowe do realizacji', 'Czeka na potwierdzenie klienta', 'Spór w toku', 'Anulowane', 'Klient wybrał innego', 'Oferta wygasła']) {
      await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
    }
    await expect(page.getByText('Zlecenie opłacone', { exact: true })).toHaveCount(0);
  });
});
