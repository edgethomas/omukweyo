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
});
