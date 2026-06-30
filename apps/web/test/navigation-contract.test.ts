import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(testDir, '..');
const repoRoot = path.resolve(webRoot, '..', '..');
const root = path.join(webRoot, 'src');
const appFile = path.join(root, 'App.tsx');

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return listSourceFiles(full);
    return /\.(tsx|ts)$/.test(entry) ? [full] : [];
  });
}

function lineFor(source: string, index: number) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const routePaths = Array.from(
  readFileSync(appFile, 'utf8').matchAll(/<Route\s+path="([^"]+)"/g),
).map((match) => match[1]);

const mustExistRoutes = [
  '/',
  '/how-it-works',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/signup',
  '/customer/signup',
  '/runner/signup',
  '/onboarding',
  '/businesses',
  '/c/:companySlug',
  '/c/:companySlug/:branchSlug',
  '/c/:companySlug/:branchSlug/:serviceSlug',
  '/join/:companySlug',
  '/join/:companySlug/:branchSlug',
  '/join/:companySlug/:branchSlug/:serviceSlug',
  '/ticket/:id',
  '/reservation/:id',
  '/customer',
  '/customer/history',
  '/customer/profile',
  '/customer/settings',
  '/reserve',
  '/runner/request',
  '/runner/request/:id',
  '/dashboard',
  '/dashboard/branches',
  '/dashboard/services',
  '/dashboard/staff',
  '/dashboard/counters',
  '/dashboard/queues',
  '/dashboard/customers',
  '/dashboard/sms',
  '/dashboard/qr-codes',
  '/dashboard/embed',
  '/dashboard/analytics',
  '/dashboard/reports',
  '/dashboard/billing',
  '/dashboard/branding',
  '/dashboard/settings',
  '/staff',
  '/staff/queue',
  '/staff/ticket/:id',
  '/staff/kiosk',
  '/staff/tv',
  '/runner/work',
  '/runner/jobs/:id',
  '/runner/profile',
  '/admin',
  '/admin/companies',
  '/admin/runners',
  '/admin/billing',
  '/admin/support',
  '/admin/audit-logs',
  '/admin/settings',
  '/widget/:companySlug',
  '/widget/:companySlug/:branchSlug',
  '/embed/:companySlug',
  '/embed/:companySlug/:branchSlug',
  '/embed/ticket/:id',
];

function routeMatches(target: string) {
  if (target === '#') return false;
  return routePaths.some((route) => {
    if (route === target) return true;
    const pattern = route
      .split('/')
      .map((segment) => (segment.startsWith(':') ? '[^/]+' : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      .join('/');
    return new RegExp(`^${pattern}$`).test(target);
  });
}

test('route inventory exposes planned product coverage gaps', () => {
  const missingRoutes = mustExistRoutes.filter((route) => !routePaths.includes(route));

  assert.deepEqual(missingRoutes, []);
});

test('static internal links point at created routes', () => {
  const broken: string[] = [];

  for (const file of listSourceFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\b(?:to|href)\s*[:=]\s*["'](\/[^"']*|#)["']/g)) {
      const target = match[1];
      if (!routeMatches(target)) {
        broken.push(`${path.relative(root, file)}:${lineFor(source, match.index ?? 0)} -> ${target}`);
      }
    }
  }

  assert.deepEqual(broken, []);
});

test('button elements declare a click action or submit behavior', () => {
  const inertButtons: string[] = [];

  for (const file of listSourceFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<button\b[^>]*>/g)) {
      const tag = match[0];
      const hasClick = /\bonClick\s*=/.test(tag);
      const isSubmit = /\btype\s*=\s*["']submit["']/.test(tag);
      if (!hasClick && !isSubmit) {
        inertButtons.push(`${path.relative(root, file)}:${lineFor(source, match.index ?? 0)} ${tag.replace(/\s+/g, ' ')}`);
      }
    }
  }

  assert.deepEqual(inertButtons, []);
});

test('home page exposes business search and directory route', () => {
  const appSource = readFileSync(appFile, 'utf8');
  const homeSource = readFileSync(path.join(root, 'pages', 'Home.tsx'), 'utf8');

  assert.ok(routePaths.includes('/businesses'));
  assert.match(homeSource, /Search businesses/);
  assert.match(homeSource, /\/businesses/);
  assert.match(appSource, /BusinessDirectory/);
});

test('demo accounts are visible and point to real workspaces', () => {
  const homeSource = readFileSync(path.join(root, 'pages', 'Home.tsx'), 'utf8');
  const loginSource = readFileSync(path.join(root, 'pages', 'Login.tsx'), 'utf8');
  const demoSource = readFileSync(path.join(root, 'lib', 'demoAccounts.ts'), 'utf8');

  for (const destination of ['/customer', '/dashboard', '/staff', '/runner/work', '/admin']) {
    assert.ok(routeMatches(destination), `${destination} should be a created route`);
    assert.match(demoSource, new RegExp(`destination: '${destination.replace('/', '\\/')}'`));
  }

  assert.match(homeSource, /Sign up/);
  assert.match(loginSource, /Open a demo workspace/);
  assert.match(demoSource, /customer@omukweyo\.demo/);
  assert.match(demoSource, /runner@omukweyo\.demo/);
});

test('business widget route and loader are present for embed installs', () => {
  const appSource = readFileSync(appFile, 'utf8');
  const embedSource = readFileSync(path.join(root, 'pages', 'Embed.tsx'), 'utf8');
  const apiSource = readFileSync(path.join(root, 'lib', 'api.ts'), 'utf8');

  assert.ok(routePaths.includes('/widget/:companySlug'));
  assert.match(appSource, /Widget/);
  assert.match(embedSource, /widget\.loader/);
  assert.match(apiSource, /omukweyo-widget\.js/);
  assert.doesNotMatch(apiSource, /inline-widget\.js/);
  assert.ok(existsSync(path.join(repoRoot, 'apps/web/public/omukweyo-widget.js')));
  assert.match(apiSource, /\$?\{bundle\.company\.slug\}/);
});

test('public branding uses Omukweyo across launch surfaces', () => {
  const brandedFiles = [
    path.join(repoRoot, 'package.json'),
    path.join(repoRoot, '.env.example'),
    path.join(webRoot, 'index.html'),
    path.join(root, 'components', 'Brand.tsx'),
    path.join(root, 'components', 'Header.tsx'),
    path.join(root, 'components', 'Footer.tsx'),
    path.join(root, 'components', 'BusinessQr.tsx'),
    path.join(root, 'pages', 'Home.tsx'),
    path.join(root, 'pages', 'Login.tsx'),
    path.join(root, 'pages', 'Signup.tsx'),
    path.join(root, 'pages', 'Contact.tsx'),
    path.join(root, 'pages', 'Legal.tsx'),
    path.join(root, 'pages', 'Widget.tsx'),
    path.join(root, 'pages', 'Embed.tsx'),
    path.join(root, 'pages', 'CustomerSignup.tsx'),
    path.join(root, 'pages', 'ForCompanies.tsx'),
    path.join(root, 'pages', 'ForCustomers.tsx'),
    path.join(root, 'pages', 'ForRunners.tsx'),
    path.join(root, 'pages', 'HowItWorks.tsx'),
    path.join(root, 'pages', 'ReserveTicket.tsx'),
    path.join(root, 'pages', 'ReservationStatus.tsx'),
    path.join(root, 'pages', 'BusinessDirectory.tsx'),
    path.join(root, 'pages', 'RunnerSignup.tsx'),
  ];

  const offenders: string[] = [];

  for (const file of brandedFiles) {
    const source = readFileSync(file, 'utf8');
    if (/InLine|inline\.app|@inline\.demo|localhost:3306\/inline/.test(source)) {
      offenders.push(path.relative(repoRoot, file));
    }
  }

  const brandSource = readFileSync(path.join(root, 'components', 'Brand.tsx'), 'utf8');
  const indexSource = readFileSync(path.join(webRoot, 'index.html'), 'utf8');

  assert.deepEqual(offenders, []);
  assert.match(brandSource, /Omukweyo/);
  assert.match(indexSource, /Omukweyo/);
});

test('company public hero keeps tagline readable on image backgrounds', () => {
  const publicSource = readFileSync(path.join(root, 'pages', 'CompanyPublic.tsx'), 'utf8');

  assert.match(publicSource, /from-black\/85 via-black\/65 to-black\/25/);
  assert.match(publicSource, /font-medium text-white drop-shadow-lg/);
  assert.doesNotMatch(publicSource, /text-white\/82/);
});

test('product workspaces are protected by auth and role gates', () => {
  const appSource = readFileSync(appFile, 'utf8');

  assert.match(appSource, /function RequireAuth/);
  assert.match(appSource, /allowedRoles/);
  assert.match(appSource, /<Navigate to="\/login"/);
  assert.doesNotMatch(appSource, /inferRoleFromPath/);
});

test('presentation-critical controls call backend APIs instead of local-only notices', () => {
  const staffSource = readFileSync(path.join(root, 'pages', 'Staff.tsx'), 'utf8');
  const widgetSource = readFileSync(path.join(root, 'pages', 'Widget.tsx'), 'utf8');
  const loginSource = readFileSync(path.join(root, 'pages', 'Login.tsx'), 'utf8');
  const howItWorksSource = readFileSync(path.join(root, 'pages', 'HowItWorks.tsx'), 'utf8');

  assert.match(staffSource, /api\.staffTransfer/);
  assert.match(staffSource, /api\.staffSendSms/);
  assert.match(widgetSource, /source:\s*'EMBED'/);
  assert.match(loginSource, /api\.login/);
  assert.doesNotMatch(howItWorksSource, /coming soon/i);
  assert.match(howItWorksSource, /\/runner\/work/);
});

test('demo sessions drive role-specific app shell navigation and identity', () => {
  const shellSource = readFileSync(path.join(root, 'components', 'AppShell.tsx'), 'utf8');
  const loginSource = readFileSync(path.join(root, 'pages', 'Login.tsx'), 'utf8');

  assert.match(shellSource, /omukweyo_session/);
  assert.match(shellSource, /roleNavGroups/);
  assert.match(shellSource, /session\?\.user\?\.role/);
  assert.match(shellSource, /session\?\.user\?\.name/);
  assert.match(loginSource, /api\.login/);
  assert.match(loginSource, /localStorage\.setItem\(SESSION_KEY/);
});

test('logged-in customer utility routes stay inside the product shell', () => {
  const appSource = readFileSync(appFile, 'utf8');
  const shellSource = readFileSync(path.join(root, 'components', 'AppShell.tsx'), 'utf8');
  const customerShellPath = path.join(root, 'components', 'CustomerShell.tsx');
  const customerProfilePath = path.join(root, 'pages', 'CustomerProfile.tsx');

  assert.match(appSource, /sessionAwarePublicRoutes/);
  assert.match(appSource, /Boolean\(session\?\.user\?\.role\).*sessionAwarePublicRoutes/s);
  assert.match(appSource, /import CustomerShell/);
  assert.match(appSource, /role === 'CUSTOMER'/);
  assert.match(appSource, /<CustomerShell>\{content\}<\/CustomerShell>/);
  assert.match(appSource, /path="\/reserve" element=\{<RequireAuth allowedRoles=\{allRoles\}><ProductPageWrapper title="Reserve arrival window"/);
  assert.match(appSource, /path="\/businesses" element=\{<RequireAuth allowedRoles=\{allRoles\}><ProductPageWrapper title="Find businesses"/);
  assert.match(appSource, /loc\.pathname\.startsWith\('\/c\/'\)/);
  assert.match(appSource, /path="\/c\/:companySlug" element=\{<CompanyPublic \/>}/);
  assert.doesNotMatch(appSource, /ProductPageWrapper title="Public queue page"/);
  assert.match(appSource, /path="\/contact" element=\{<RequireAuth allowedRoles=\{allRoles\}><ProductPageWrapper title="Help"/);
  assert.match(appSource, /path="\/onboarding" element=\{<RequireAuth allowedRoles=\{allRoles\}><ProductPageWrapper title="Business onboarding"/);
  assert.match(appSource, /path="\/runner\/signup" element=\{<RequireAuth allowedRoles=\{allRoles\}><ProductPageWrapper title="Runner profile"/);
  assert.match(appSource, /path="\/customer\/profile" element=\{<RequireAuth allowedRoles=\{\['CUSTOMER', 'SUPER_ADMIN'\]\}><ProductPageWrapper title="Profile"/);
  assert.match(appSource, /path="\/staff\/profile" element=\{<RequireAuth allowedRoles=\{\['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF'\]\}><ProductPageWrapper title="Staff profile"/);
  assert.match(appSource, /path="\/staff\/settings" element=\{<RequireAuth allowedRoles=\{\['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF'\]\}><ProductPageWrapper title="Staff settings"/);
  assert.match(appSource, /path="\/dashboard\/profile" element=\{<RequireAuth allowedRoles=\{\['COMPANY_OWNER', 'COMPANY_MANAGER'\]\}><ProductPageWrapper title="My profile"/);
  assert.match(appSource, /path="\/admin\/profile" element=\{<RequireAuth allowedRoles=\{\['SUPER_ADMIN'\]\}><ProductPageWrapper title="My profile"/);
  assert.match(appSource, /path="\/runner\/settings" element=\{<RequireAuth allowedRoles=\{\['RUNNER', 'SUPER_ADMIN'\]\}><ProductPageWrapper title="Runner settings"/);
  assert.match(shellSource, /const homePath = session\?\.user\?\.destination \?\? fallbackHomeForRole\(currentRole\)/);
  assert.doesNotMatch(shellSource, /<Link to="\/" className="h-14/);
  assert.ok(existsSync(customerShellPath));
  assert.ok(existsSync(customerProfilePath));

  const customerShellSource = readFileSync(customerShellPath, 'utf8');
  assert.match(customerShellSource, /customer-shell/);
  assert.match(customerShellSource, /customer-topbar/);
  assert.match(customerShellSource, /ml-auto flex items-center gap-3 md:ml-0/);
  assert.match(customerShellSource, /to="\/customer\/profile"/);
  assert.match(customerShellSource, /customer-bottom-nav/);
  assert.doesNotMatch(customerShellSource, /Find a business/);
  assert.doesNotMatch(customerShellSource, /to="\/login"/);
  assert.doesNotMatch(customerShellSource, /app-sidebar|app-header|app-nav-section/);

  const customerProfileSource = readFileSync(customerProfilePath, 'utf8');
  const customerSettingsPath = path.join(root, 'pages', 'CustomerSettings.tsx');
  assert.ok(existsSync(customerSettingsPath));
  const customerSettingsSource = readFileSync(customerSettingsPath, 'utf8');

  assert.match(customerProfileSource, /CustomerProfile/);
  assert.match(customerProfileSource, /api\.customerSignup/);
  assert.match(customerProfileSource, /api\.customerUploadAvatar/);
  assert.match(customerProfileSource, /Upload photo/);
  assert.match(customerProfileSource, /Sign out/);
  assert.match(customerProfileSource, /localStorage\.setItem\(CUSTOMER_KEY/);

  assert.match(customerSettingsSource, /CustomerSettings/);
  assert.match(customerSettingsSource, /api\.deleteCustomer/);
  assert.match(customerSettingsSource, /api\.changePassword/);
  assert.match(customerSettingsSource, /api\.forgotPassword/);
  assert.match(customerSettingsSource, /Delete account/);
  assert.match(customerSettingsSource, /Change password/);
  assert.match(customerSettingsSource, /Default payment method/);
  assert.match(customerSettingsSource, /Receipt preference/);
  assert.match(customerSettingsSource, /SMS consent/);
});

test('customer signup can open a real customer session', () => {
  const apiSource = readFileSync(path.join(root, 'lib', 'api.ts'), 'utf8');
  const signupSource = readFileSync(path.join(root, 'pages', 'CustomerSignup.tsx'), 'utf8');

  assert.match(apiSource, /customerSignup:\s*(?:async\s*)?\(body:\s*\{[^}]*password\?:\s*string/s);
  assert.match(apiSource, /signUpAndProfile/);
  assert.match(signupSource, /password:\s*''/);
  assert.match(signupSource, /type="password"/);
  assert.match(signupSource, /localStorage\.setItem\(SESSION_KEY, JSON\.stringify\(session\)\)/);
  assert.match(signupSource, /navigate\('\/customer'\)/);
});

test('business and runner signup open real workspace sessions', () => {
  const apiSource = readFileSync(path.join(root, 'lib', 'api.ts'), 'utf8');
  const onboardingSource = readFileSync(path.join(root, 'pages', 'Onboarding.tsx'), 'utf8');
  const runnerSignupSource = readFileSync(path.join(root, 'pages', 'RunnerSignup.tsx'), 'utf8');

  assert.match(apiSource, /ownerPassword:\s*string/);
  assert.match(apiSource, /Supabase Auth session created/);
  assert.match(onboardingSource, /ownerPassword:\s*''/);
  assert.match(onboardingSource, /localStorage\.setItem\(SESSION_KEY, JSON\.stringify\(payload\.session\)\)/);
  assert.match(onboardingSource, /Field[^>]*name="ownerPassword"[^>]*type="password"/);

  assert.match(apiSource, /runnerApply:\s*(?:async\s*)?\(body:\s*\{[^}]*email:\s*string;[^}]*password:\s*string/s);
  assert.match(apiSource, /RunnerApplication/);
  assert.match(runnerSignupSource, /email:\s*''/);
  assert.match(runnerSignupSource, /password:\s*''/);
  assert.match(runnerSignupSource, /localStorage\.setItem\(SESSION_KEY, JSON\.stringify\(session\)\)/);
  assert.match(runnerSignupSource, /navigate\('\/runner\/work'\)/);
});

test('customer shell keeps profile out of main nav and exposes it through the account menu', () => {
  const customerShellSource = readFileSync(path.join(root, 'components', 'CustomerShell.tsx'), 'utf8');
  const customerNavMatch = customerShellSource.match(/const customerNav: CustomerNavItem\[] = \[([\s\S]*?)\];/);
  const directAccountProfileLink = customerShellSource
    .match(/<Link\b[^>]*to="\/customer\/profile"[^>]*>/)?.[0];
  const accountMenuSources = listSourceFiles(root)
    .filter((file) => /AccountMenu\.(tsx|ts)$/.test(path.basename(file)))
    .map((file) => readFileSync(file, 'utf8'));
  const accountMenuOwnsProfileLink =
    /\bAccountMenu\b/.test(customerShellSource) &&
    accountMenuSources.some((source) => /\/customer\/profile/.test(source));

  assert.ok(customerNavMatch, 'CustomerShell.tsx should declare the main customerNav list');
  assert.doesNotMatch(
    customerNavMatch[1],
    /\bprofileNav\b|label:\s*['"]Profile['"]|to:\s*['"]\/customer\/profile['"]/,
    'customerNav should not duplicate Profile because the account menu owns /customer/profile',
  );
  assert.ok(
    (directAccountProfileLink && /customer-account|account-menu|account-control/.test(directAccountProfileLink)) ||
      accountMenuOwnsProfileLink,
    'CustomerShell.tsx should expose /customer/profile through the account control or AccountMenu',
  );

  const accountMenuSource = accountMenuSources[0];
  assert.match(accountMenuSource, /\/customer\/settings/);
  assert.doesNotMatch(accountMenuSource, /\/customer\/history/);
});

test('customer and company admin workspaces are role-fit, not generic dashboards', () => {
  const appSource = readFileSync(appFile, 'utf8');
  const customerSource = readFileSync(path.join(root, 'pages', 'CustomerHome.tsx'), 'utf8');
  const ticketSource = readFileSync(path.join(root, 'pages', 'Ticket.tsx'), 'utf8');
  const dashboardSource = readFileSync(path.join(root, 'pages', 'Dashboard.tsx'), 'utf8');

  assert.match(appSource, /title="Your visit"/);
  assert.match(appSource, /title="Company admin console"/);
  assert.match(customerSource, /api\.customerVisit/);
  assert.match(customerSource, /SMS updates/);
  assert.match(customerSource, /Track live ticket/);
  assert.doesNotMatch(customerSource, /Current ticket/);
  assert.doesNotMatch(customerSource, /Customer options/);
  assert.match(ticketSource, /customerIdForTicket/);
  assert.match(ticketSource, /api\.customerVisit\(customerId\)/);
  assert.match(ticketSource, /setDemoMode\(false\)[\s\S]*api\.customerVisit\(customerId\)/);
  assert.match(ticketSource, /setDemoMode\(true\)[\s\S]*api\.liveQueue/);
  assert.match(ticketSource, /No active ticket right now/);
  assert.match(dashboardSource, /Access control/);
  assert.match(dashboardSource, /Company users/);
  assert.match(dashboardSource, /Owner|Manager|Operator/);
});

test('every role has a profile page and role-aware settings', () => {
  const appSource = readFileSync(appFile, 'utf8');
  const shellSource = readFileSync(path.join(root, 'components', 'AppShell.tsx'), 'utf8');
  const apiSource = readFileSync(path.join(root, 'lib', 'api.ts'), 'utf8');

  // New page files exist
  const staffProfilePath = path.join(root, 'pages', 'StaffProfile.tsx');
  const staffSettingsPath = path.join(root, 'pages', 'StaffSettings.tsx');
  const businessProfilePath = path.join(root, 'pages', 'BusinessProfile.tsx');
  const adminProfilePath = path.join(root, 'pages', 'AdminProfile.tsx');
  const runnerSettingsPath = path.join(root, 'pages', 'RunnerSettings.tsx');
  for (const file of [staffProfilePath, staffSettingsPath, businessProfilePath, adminProfilePath, runnerSettingsPath]) {
    assert.ok(existsSync(file), `${path.basename(file)} should exist`);
  }

  // Shared profile/settings components exist
  const profilePageSource = readFileSync(path.join(root, 'features', 'profile', 'UserProfilePage.tsx'), 'utf8');
  const settingsPageSource = readFileSync(path.join(root, 'features', 'profile', 'UserSettingsPage.tsx'), 'utf8');
  assert.match(profilePageSource, /api\.updateMyProfile/);
  assert.match(profilePageSource, /api\.uploadMyAvatar/);
  assert.match(profilePageSource, /api\.deleteMyAccount/);
  assert.match(settingsPageSource, /api\.changePassword/);
  assert.match(settingsPageSource, /api\.forgotPassword/);
  assert.match(settingsPageSource, /Delete account/);

  // Each thin wrapper delegates to the shared components
  for (const file of [staffProfilePath, staffSettingsPath, businessProfilePath, adminProfilePath, runnerSettingsPath]) {
    const source = readFileSync(file, 'utf8');
    if (/Profile\.tsx$/.test(file)) {
      assert.match(source, /UserProfilePage/);
    } else {
      assert.match(source, /UserSettingsPage/);
    }
  }

  // API lib has the new methods
  assert.match(apiSource, /updateMyProfile/);
  assert.match(apiSource, /uploadMyAvatar/);
  assert.match(apiSource, /deleteMyAccount/);

  // AppShell sidebar nav has a Profile entry per role
  assert.match(shellSource, /label: 'My profile'/);
  assert.match(shellSource, /to: '\/staff\/profile'/);
  assert.match(shellSource, /to: '\/dashboard\/profile'/);
  assert.match(shellSource, /to: '\/admin\/profile'/);
  assert.match(shellSource, /to: '\/staff\/settings'/);
  assert.match(shellSource, /to: '\/runner\/settings'/);

  // Mobile bottom nav always exposes Profile
  assert.match(shellSource, /label: 'Profile'/);
});

test('pre-login pages avoid hardcoded demo company links and excessive repeated imagery', () => {
  const publicFiles = ['Home.tsx', 'ForCustomers.tsx', 'HowItWorks.tsx', 'BusinessDirectory.tsx', 'Pricing.tsx'];
  const offenders: string[] = [];
  const imageUsage = new Map<string, number>();

  for (const file of publicFiles) {
    const source = readFileSync(path.join(root, 'pages', file), 'utf8');
    for (const match of source.matchAll(/bank-windhoek|Bank Windhoek/g)) {
      offenders.push(`${file}:${lineFor(source, match.index ?? 0)}`);
    }
    for (const match of source.matchAll(/img\.([a-zA-Z0-9]+)/g)) {
      imageUsage.set(match[1], (imageUsage.get(match[1]) ?? 0) + 1);
    }
  }

  assert.deepEqual(offenders, []);
  for (const [asset, count] of imageUsage) {
    assert.ok(count <= 3, `${asset} is reused ${count} times across pre-login pages`);
  }
});

test('pricing comparison table uses fixed aligned desktop columns and mobile comparison cards', () => {
  const pricingSource = readFileSync(path.join(root, 'pages', 'Pricing.tsx'), 'utf8');

  assert.match(pricingSource, /table-fixed/);
  assert.match(pricingSource, /colgroup/);
  assert.match(pricingSource, /min-w-\[860px\]/);
  assert.match(pricingSource, /lg:hidden/);
  assert.match(pricingSource, /FeatureComparisonCards/);
});
