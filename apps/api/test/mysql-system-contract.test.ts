import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('.');
const apiRoot = path.join(root, 'apps', 'api');
const webRoot = path.join(root, 'apps', 'web', 'src');

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

test('API is wired for Prisma and MySQL instead of the runtime in-memory store', () => {
  const apiPackage = JSON.parse(read('apps/api/package.json'));
  const schemaPath = path.join(apiRoot, 'prisma', 'schema.prisma');
  const storeSource = read('apps/api/src/store.ts');
  const indexSource = read('apps/api/src/index.ts');

  assert.match(apiPackage.dependencies['@prisma/client'], /^\^6\./);
  assert.match(apiPackage.devDependencies.prisma, /^\^6\./);
  assert.equal(apiPackage.prisma.seed, 'tsx prisma/seed.ts');
  assert.equal(existsSync(schemaPath), true);
  assert.match(read('apps/api/prisma/schema.prisma'), /provider\s*=\s*"mysql"/);
  assert.doesNotMatch(storeSource, /In-memory store|new Map|seed: one demo company/);
  assert.doesNotMatch(indexSource, /demo heartbeat|simulate someone joining/);
});

test('MySQL implementation exposes schema coverage for the full queue system', () => {
  const schema = read('apps/api/prisma/schema.prisma');
  const requiredModels = [
    'User',
    'Session',
    'Company',
    'CompanyAsset',
    'Branch',
    'Service',
    'StaffMember',
    'Customer',
    'QueueTicket',
    'TicketEvent',
    'FutureReservation',
    'ReservationEvent',
    'Notification',
    'Subscription',
    'BillingInvoice',
    'SmsCreditPurchase',
    'RunnerApplication',
    'RunnerJob',
    'WidgetInstall',
  ];

  for (const model of requiredModels) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`), `missing Prisma model ${model}`);
  }
});

test('public company and widget pages use URL slugs instead of Bank Windhoek literals', () => {
  const companyPublic = read('apps/web/src/pages/CompanyPublic.tsx');
  const widget = read('apps/web/src/pages/Widget.tsx');
  const reserve = read('apps/web/src/pages/ReserveTicket.tsx');

  assert.match(companyPublic, /useParams/);
  assert.match(widget, /useParams/);
  assert.match(reserve, /companySlug|searchParams/);
  assert.doesNotMatch(companyPublic, /api\.company\('bank-windhoek'\)/);
  assert.doesNotMatch(widget, /api\.company\('bank-windhoek'\)/);
  assert.doesNotMatch(reserve, /api\.company\('bank-windhoek'\)/);
});

test('business workspace includes branding settings and uploaded asset API calls', () => {
  const apiClient = read('apps/web/src/lib/api.ts');
  const app = read('apps/web/src/App.tsx');

  assert.match(apiClient, /businessProfile/);
  assert.match(apiClient, /businessUploadAsset/);
  assert.match(app, /BusinessSettings/);
  assert.match(app, /\/settings/);
});
