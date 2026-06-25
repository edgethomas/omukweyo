import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('.');

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

test('API exposes strict auth and tenant helpers for protected workspaces', () => {
  const indexSource = read('apps/api/src/index.ts');

  assert.match(indexSource, /async function requireUser/);
  assert.match(indexSource, /async function requireCompanyUser/);
  assert.match(indexSource, /async function requireRole/);
  assert.match(indexSource, /async function requireTicketAccess/);
  assert.doesNotMatch(indexSource, /const fallback = await prisma\.company\.findFirst/);
});

test('business, billing, staff, dashboard, and admin endpoints enforce session scope', () => {
  const indexSource = read('apps/api/src/index.ts');

  for (const endpoint of [
    '/api/business/widget',
    '/api/business/profile',
    '/api/business/assets',
    '/api/business/branches',
    '/api/business/services',
    '/api/business/staff',
    '/api/billing/overview',
    '/api/billing/subscription',
    '/api/billing/sms-credits',
    '/api/dashboard',
    '/api/admin/overview',
  ]) {
    const position = indexSource.indexOf(endpoint);
    assert.notEqual(position, -1, `${endpoint} should exist`);
    const routeBody = indexSource.slice(position, indexSource.indexOf('}));', position) + 4);
    assert.match(routeBody, /require(?:CompanyUser|Role|User)\(/, `${endpoint} must require auth`);
  }
});

test('Prisma-backed store keeps payment and notification state persisted, not runtime arrays', () => {
  const storeSource = read('apps/api/src/store.ts');

  assert.match(storeSource, /prisma\.billingInvoice/);
  assert.match(storeSource, /prisma\.smsCreditPurchase/);
  assert.match(storeSource, /prisma\.notification/);
  assert.match(storeSource, /prisma\.futureReservation/);
  assert.doesNotMatch(storeSource, /export const notifications/);
  assert.doesNotMatch(storeSource, /export const branches/);
  assert.doesNotMatch(storeSource, /export const company/);
});

test('database launch path is documented with env, push, seed, and smoke verification', () => {
  const rootPackage = JSON.parse(read('package.json'));
  const apiPackage = JSON.parse(read('apps/api/package.json'));
  const envExample = read('.env.example');

  assert.match(envExample, /DATABASE_URL="mysql:\/\/USER:PASSWORD@localhost:3306\/omukweyo"/);
  assert.equal(apiPackage.scripts['db:push'], 'prisma db push --schema prisma/schema.prisma');
  assert.equal(apiPackage.scripts['db:seed'], 'tsx prisma/seed.ts');
  assert.equal(rootPackage.scripts['db:push'], 'npm --workspace apps/api run db:push');
  assert.equal(rootPackage.scripts['db:seed'], 'npm --workspace apps/api run db:seed');
  assert.equal(rootPackage.scripts['smoke:db'], 'tsx apps/api/test/db-smoke.ts');
});

test('workspace test scripts run TypeScript contracts through tsx', () => {
  const rootPackage = JSON.parse(read('package.json'));
  const webPackage = JSON.parse(read('apps/web/package.json'));
  const apiPackage = JSON.parse(read('apps/api/package.json'));

  assert.equal(rootPackage.scripts.test, 'npm run test:contracts');
  assert.equal(rootPackage.scripts['test:web'], 'npm --workspace apps/web run test');
  assert.equal(rootPackage.scripts['test:api'], 'npm --workspace apps/api run test');
  assert.equal(rootPackage.scripts['test:contracts'], 'npm run test:web && npm run test:api');
  assert.equal(webPackage.scripts.test, 'tsx --test test/navigation-contract.test.ts');
  assert.match(webPackage.devDependencies?.tsx, /^\^4\./);
  assert.equal(apiPackage.scripts.test, 'cd ../.. && tsx --test apps/api/test/role-flows.test.ts apps/api/test/mysql-system-contract.test.ts');
});
