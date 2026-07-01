import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

type Role = 'Customer' | 'Business owner' | 'Staff' | 'Runner' | 'Platform admin';

function attachConsole(page: Page) {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function loginAs(page: Page, role: Role) {
  const creds: Record<Role, { email: string; password: string; path: string }> = {
    Customer: { email: 'customer@omukweyo.demo', password: 'demo123', path: '/customer' },
    'Business owner': { email: 'owner@omukweyo.demo', password: 'demo123', path: '/dashboard' },
    Staff: { email: 'staff@omukweyo.demo', password: 'demo123', path: '/staff' },
    Runner: { email: 'runner@omukweyo.demo', password: 'demo123', path: '/runner/work' },
    'Platform admin': { email: 'admin@omukweyo.demo', password: 'demo123', path: '/admin' },
  };
  const account = creds[role];
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/Email/i).fill(account.email);
  await page.getByLabel(/Password/i).fill(account.password);
  await page.getByRole('button', { name: /^Log in$/ }).click();
  await page.waitForURL((url) => url.pathname.startsWith(account.path), { timeout: 15_000 });
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
}

async function expectCleanRoute(page: Page, errors: string[], path: string) {
  errors.splice(0);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
  await expect(page.getByText(/This page hit a snag/i)).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveText('');
  expect(errors, `console/page errors at ${path}: ${errors.join('\n')}`).toEqual([]);
}

test.describe('Supabase direct runtime', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('public routes render from Supabase data', async ({ page }) => {
    const errors = attachConsole(page);
    for (const route of ['/', '/businesses', '/c/bank-windhoek', '/reserve?company=bank-windhoek', '/widget/bank-windhoek']) {
      await expectCleanRoute(page, errors, route);
    }
  });

  for (const role of ['Customer', 'Business owner', 'Staff', 'Runner', 'Platform admin'] as const) {
    test(`${role} demo login reaches the right workspace`, async ({ page }) => {
      const errors = attachConsole(page);
      await loginAs(page, role);
      await expect(page.getByText(/This page hit a snag/i)).not.toBeVisible();
      expect(errors, `console errors for ${role}: ${errors.join('\n')}`).toEqual([]);
    });
  }

  test('session-aware polish routes stay clear inside a business session', async ({ page }) => {
    const errors = attachConsole(page);
    await loginAs(page, 'Business owner');

    await page.goto('/customer/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Create customer account' })).toBeVisible();
    await expect(page.locator('.app-sidebar')).toHaveCount(0);

    await page.goto('/dashboard/branding', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Store page' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open TV display/i })).toBeVisible();
    await expect(page.getByLabel('Upload storefront image')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Open TV display/i })).toHaveAttribute('href', '/staff/tv');

    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i })).toHaveCount(0);
    await expect(page.getByText(/Need more options/i)).toHaveCount(0);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'User credentials' })).toBeVisible();
    expect(errors, `console errors for polish routes: ${errors.join('\n')}`).toEqual([]);
  });

  test('public ticket can be served from the staff ticket detail workflow', async ({ page }) => {
    const errors = attachConsole(page);
    const customerName = `E2E Visitor ${Date.now()}`;
    const phone = `+264811${String(Date.now()).slice(-6)}`;

    await page.goto('/c/bank-windhoek', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Join queue$/ }).click();
    await page.getByLabel('Your name').fill(customerName);
    await page.getByLabel('Phone for SMS updates').fill(phone);
    await page.getByRole('button', { name: /Get my ticket/i }).click();
    await expect(page.getByText(/Ticket .* created/i)).toBeVisible({ timeout: 15_000 });

    const ticketHref = await page.getByRole('link', { name: /^Open$/ }).getAttribute('href');
    expect(ticketHref, 'ticket link should point to the created ticket').toMatch(/^\/ticket\/.+/);
    const ticketId = ticketHref!.replace('/ticket/', '');

    await loginAs(page, 'Staff');
    await page.goto(`/staff/ticket/${ticketId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.locator('.chip-wait').filter({ hasText: 'WAITING' })).toBeVisible();

    await page.getByRole('button', { name: /Start serving/i }).click();
    await expect(page.locator('.chip-serve').filter({ hasText: 'SERVING' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /^Served$/i }).click();
    await expect(page.locator('.chip-done').filter({ hasText: 'SERVED' })).toBeVisible({ timeout: 15_000 });
    expect(errors, `console errors for ticket serve flow: ${errors.join('\n')}`).toEqual([]);
  });
});
