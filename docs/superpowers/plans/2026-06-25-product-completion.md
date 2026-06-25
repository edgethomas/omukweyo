# Omukweyo Product Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Omukweyo/InLine build from a good demo into a coherent queue product with complete customer, business, staff, runner, and platform-admin workflows.

**Architecture:** Keep the existing Vite React + Express + Prisma shape and refactor around role-fit workflows instead of replacing the app. The work should split broad demo pages into focused route surfaces, harden backend permissions and records, and keep payment/SMS provider integrations behind adapters or mock providers until real vendors are selected.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind, Express, Zod, Prisma, MySQL in the current repo, Socket.IO, Node test runner through `tsx`.

---

## Evidence Used

- User-provided screenshot: customer profile page with duplicate Profile navigation and duplicate profile card/form meaning.
- Current route shell: `apps/web/src/App.tsx`.
- Current customer shell/profile/directory/reserve/ticket pages:
  - `apps/web/src/components/CustomerShell.tsx`
  - `apps/web/src/pages/CustomerProfile.tsx`
  - `apps/web/src/pages/BusinessDirectory.tsx`
  - `apps/web/src/pages/CompanyPublic.tsx`
  - `apps/web/src/pages/ReserveTicket.tsx`
  - `apps/web/src/pages/Ticket.tsx`
  - `apps/web/src/pages/CustomerHome.tsx`
- Current business/staff/admin/runner pages:
  - `apps/web/src/pages/Dashboard.tsx`
  - `apps/web/src/pages/Staff.tsx`
  - `apps/web/src/pages/BusinessSettings.tsx`
  - `apps/web/src/pages/PlatformAdmin.tsx`
  - `apps/web/src/pages/RunnerWorkspace.tsx`
- Current API surface: `apps/api/src/index.ts`, `apps/api/src/store.ts`, `apps/web/src/lib/api.ts`.
- Current schema/types: `apps/api/prisma/schema.prisma`, `packages/shared/src/index.ts`.
- Product requirements PDF: `InLine_Full_Requirements_PRD_Production_Codex.pdf`.
- Current competitor pattern check:
  - Waitwhile: queue management, appointment scheduling, walk-ins/bookings in one dashboard, analytics, multi-location, messaging, integrations, security. https://waitwhile.com/
  - Qminder: in-person service platform with remote sign-in, visitor website, kiosk, customer messaging, service dashboard, waiting-room TV, analytics. https://www.qminder.com/
  - QLess: queue/appointment platform with SMS/email communication, emergency shutdown, self-service configuration. https://www.qless.com/products/
  - Yelp Guest Manager: waitlist, reservations, table management, live status updates, kiosk, text notifications. https://apps.apple.com/us/app/yelp-guest-manager/id404226510
  - Google Places API (New): use place search/details/photo APIs for live external destination search, with field masks and billing-aware requests, not scraping. https://developers.google.com/maps/documentation/places/web-service/overview
- UX references:
  - NN/g EAS form framework: eliminate, automate, simplify. https://www.nngroup.com/articles/eas-framework-simplify-forms/
  - NN/g destructive actions: confirm serious actions, explain consequences, avoid default destructive confirmation. https://www.nngroup.com/articles/confirmation-dialog/
  - NN/g consequential actions proximity: keep destructive actions away from benign actions. https://www.nngroup.com/articles/proximity-consequential-options/

## Current Verification Baseline

- `npm run --silent build`: passes. Vite reports one large JS chunk warning.
- `npx tsx --test apps/web/test/navigation-contract.test.ts`: 14 tests pass.
- `npx tsx --test apps/api/test/role-flows.test.ts apps/api/test/mysql-system-contract.test.ts`: 8 tests pass.
- `npm run --silent smoke:db`: passes against the current configured database.
- `npm --workspace apps/web run --silent test`: fails because `apps/web/package.json` has no `test` script.
- Root folder is not a git repository at `C:\Users\Thomas Shikulo\Desktop\InLine`.

## Product Decisions

1. Do not rebuild from scratch. The app already has working auth, route gates, Prisma-backed persistence, seeded data, queue operations, reservations, runner jobs, billing mocks, widgets, and contract tests.
2. Do not call this complete while major PRD pages are collapsed into broad demo pages. Split the app into role-fit pages.
3. Keep the customer experience simple:
   - `Find businesses` is discovery.
   - Business public page is the place to join/reserve/share.
   - `Reserve spot` is only the booking flow.
   - `My ticket` is only the active ticket.
   - `History` is tickets/reservations history.
   - `Profile` is account settings and should be reached from the account chip/menu, not duplicated as a top nav tab.
4. Keep QR codes out of business-directory cards. QR codes belong on business public pages, share dialogs, and business admin QR/poster tools.
5. Keep destructive actions in a separate danger zone or confirmation modal. Do not place `Delete account` beside `Save profile`.
6. Use Google Places as a live external destination/search source for runner requests and discovery suggestions, not as a bulk-imported Omukweyo business database unless terms and caching rules are reviewed.
7. Keep current MySQL wiring for this implementation pass. The PDF says PostgreSQL, but the repo and tests are currently MySQL. A database engine migration should be its own decision and plan.

## Pages That Must Exist

### Public And Auth

- `/` marketing home.
- `/how-it-works`.
- `/pricing`.
- `/contact`.
- `/privacy`.
- `/terms`.
- `/login`.
- `/signup` or `/register`.
- `/customer/signup`.
- `/runner/signup`.
- `/onboarding` or `/register/company`.
- `/businesses` public/customer business discovery.

### Public Company And Join

- `/c/:companySlug`.
- `/c/:companySlug/:branchSlug`.
- `/c/:companySlug/:branchSlug/:serviceSlug`.
- `/join/:companySlug`.
- `/join/:companySlug/:branchSlug`.
- `/join/:companySlug/:branchSlug/:serviceSlug`.
- `/ticket/:id`.
- `/reservation/:id`.

### Customer App

- `/customer` overview.
- `/customer/history` tickets and reservations history.
- `/customer/profile` account settings, reached from account menu.
- `/reserve` future reservation booking.
- `/runner/request` unsupported-place runner request.
- `/runner/request/:id` runner request status.

### Business Owner/Manager

- `/dashboard` overview.
- `/dashboard/branches`.
- `/dashboard/services`.
- `/dashboard/staff`.
- `/dashboard/counters`.
- `/dashboard/queues`.
- `/dashboard/customers`.
- `/dashboard/sms`.
- `/dashboard/qr-codes`.
- `/dashboard/embed`.
- `/dashboard/analytics`.
- `/dashboard/reports`.
- `/dashboard/billing`.
- `/dashboard/branding`.
- `/dashboard/settings`.

### Staff

- `/staff` assigned workspace home.
- `/staff/queue`.
- `/staff/ticket/:id`.
- `/staff/kiosk`.
- `/staff/tv`.

### Runner

- `/runner/work`.
- `/runner/jobs/:id`.
- `/runner/profile`.

### Platform Admin

- `/admin`.
- `/admin/companies`.
- `/admin/runners`.
- `/admin/billing`.
- `/admin/support`.
- `/admin/audit-logs`.
- `/admin/settings`.

### Embed

- `/widget/:companySlug`.
- `/widget/:companySlug/:branchSlug`.
- `/embed/:companySlug`.
- `/embed/:companySlug/:branchSlug`.
- `/embed/ticket/:id`.

## Pages Or Patterns To Remove/Merge

- Remove `Profile` from the customer top nav. Keep the account chip, but turn it into an account menu with `Profile`, `History`, `Sign out`.
- Remove the left profile summary panel from `CustomerProfile` as a separate concept. Put identity, contact, avatar, and edit controls in one account settings surface.
- Move `Delete account` into a danger zone with a specific confirmation modal. Move `Sign out` into the account menu and secondary account section.
- Remove large QR panels from `BusinessDirectory`. Use compact business cards/list rows.
- Remove explanatory "How smart booking works" as a dominant panel on `/reserve`. Keep brief helper copy under the form or in a help drawer.
- Remove customer-facing "Demo fee", "mock paid", "sandbox" wording except where a sandbox badge is needed for admin/dev context.
- Remove the phone mockup as the primary ticket view. Use a direct live ticket card.
- Remove hard-coded staff identity/counter behavior from `Staff.tsx`; use session staff/branch/counter data.
- Do not use `/dashboard` as the only business admin page. Keep it as overview and split real tasks into subroutes.

## File Structure Plan

Create focused feature folders under `apps/web/src/features` while keeping existing page entry files small:

- Create `apps/web/src/features/customer/AccountMenu.tsx`
- Create `apps/web/src/features/customer/CustomerProfileForm.tsx`
- Create `apps/web/src/features/customer/CustomerHistory.tsx`
- Create `apps/web/src/features/customer/ActiveTicketCard.tsx`
- Create `apps/web/src/features/business-directory/BusinessSearchPage.tsx`
- Create `apps/web/src/features/business-directory/BusinessResultCard.tsx`
- Create `apps/web/src/features/reservations/ReservationBookingForm.tsx`
- Create `apps/web/src/features/public-company/PublicCompanyPage.tsx`
- Create `apps/web/src/features/business-admin/AdminLayout.tsx`
- Create `apps/web/src/features/business-admin/BranchesPage.tsx`
- Create `apps/web/src/features/business-admin/ServicesPage.tsx`
- Create `apps/web/src/features/business-admin/StaffPage.tsx`
- Create `apps/web/src/features/business-admin/CountersPage.tsx`
- Create `apps/web/src/features/business-admin/QueuesPage.tsx`
- Create `apps/web/src/features/business-admin/SmsPage.tsx`
- Create `apps/web/src/features/business-admin/QrCodesPage.tsx`
- Create `apps/web/src/features/business-admin/AnalyticsPage.tsx`
- Create `apps/web/src/features/staff/StaffQueueConsole.tsx`
- Create `apps/web/src/features/staff/WalkInDrawer.tsx`
- Create `apps/web/src/features/runner/RunnerRequestPage.tsx`
- Create `apps/web/src/features/platform-admin/CompaniesPage.tsx`
- Create `apps/web/src/features/platform-admin/AuditLogsPage.tsx`
- Create `apps/web/src/components/ConfirmDialog.tsx`
- Create `apps/web/src/components/DataTable.tsx`
- Create `apps/web/src/components/EmptyState.tsx`

Modify existing route/page files to import the focused feature components:

- Modify `apps/web/src/App.tsx`.
- Modify `apps/web/src/components/CustomerShell.tsx`.
- Modify `apps/web/src/components/AppShell.tsx`.
- Modify `apps/web/src/pages/CustomerProfile.tsx`.
- Modify `apps/web/src/pages/CustomerHome.tsx`.
- Modify `apps/web/src/pages/BusinessDirectory.tsx`.
- Modify `apps/web/src/pages/CompanyPublic.tsx`.
- Modify `apps/web/src/pages/ReserveTicket.tsx`.
- Modify `apps/web/src/pages/Ticket.tsx`.
- Modify `apps/web/src/pages/Dashboard.tsx`.
- Modify `apps/web/src/pages/Staff.tsx`.
- Modify `apps/web/src/pages/RunnerWorkspace.tsx`.
- Modify `apps/web/src/pages/PlatformAdmin.tsx`.
- Modify `apps/web/src/lib/api.ts`.
- Modify `packages/shared/src/index.ts`.
- Modify `apps/api/prisma/schema.prisma`.
- Modify `apps/api/src/index.ts`.
- Modify `apps/api/src/store.ts`.
- Modify `apps/api/prisma/seed.ts`.
- Modify `apps/web/test/navigation-contract.test.ts`.
- Modify `apps/api/test/role-flows.test.ts`.
- Modify `apps/api/test/mysql-system-contract.test.ts`.
- Modify root `package.json`, `apps/web/package.json`, `apps/api/package.json` to add reliable test scripts.

## Task 1: Test And Route Contract Cleanup

**Files:**
- Modify: `package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/web/test/navigation-contract.test.ts`
- Modify: `apps/api/test/role-flows.test.ts`

- [ ] Add scripts:
  - root: `test`, `test:web`, `test:api`, `test:contracts`.
  - web: `test`.
  - api: `test`.
- [ ] Use `tsx --test`, not raw `node --test`, for TypeScript test files.
- [ ] Add a route inventory assertion that checks the must-exist routes listed above.
- [ ] Add a "must not duplicate customer profile nav" assertion:
  - `CustomerShell.tsx` must not include `Profile` inside the main `customerNav`.
  - `CustomerShell.tsx` must expose an account menu link to `/customer/profile`.
- [ ] Run:
  - `npm run --silent test:web`
  - Expected: all web contract tests pass.
- [ ] Run:
  - `npm run --silent test:api`
  - Expected: all API contract tests pass.
- [ ] Run:
  - `npm run --silent build`
  - Expected: build passes; chunk warning is acceptable until code splitting is added.

## Task 2: Customer Navigation And Profile Reset

**Files:**
- Modify: `apps/web/src/components/CustomerShell.tsx`
- Modify: `apps/web/src/pages/CustomerProfile.tsx`
- Create: `apps/web/src/features/customer/AccountMenu.tsx`
- Create: `apps/web/src/features/customer/CustomerProfileForm.tsx`
- Create: `apps/web/src/components/ConfirmDialog.tsx`

- [ ] Remove `profileNav` from `customerNav`.
- [ ] Add `History` to customer nav after `My ticket`.
- [ ] Convert the top-right customer chip into a menu with:
  - Profile
  - History
  - Sign out
- [ ] Rebuild `/customer/profile` as one account page:
  - Top row: avatar, name, email/phone summary, `Edit photo`.
  - Main form: full name, phone, email, SMS consent, receipt preference.
  - Footer: `Save changes` primary, `Cancel` secondary only when dirty.
  - Separate danger zone: delete account.
- [ ] Replace `window.confirm` with `ConfirmDialog` for account deletion. The modal must say what will be deleted and what history stays.
- [ ] Remove the current side panel of profile facts because it duplicates the form.
- [ ] Run:
  - `npm run --silent test:web`
  - Expected: customer nav/profile assertions pass.
- [ ] Run:
  - `npm run --silent build`

## Task 3: Customer Home, Ticket, And History

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/CustomerHome.tsx`
- Modify: `apps/web/src/pages/Ticket.tsx`
- Create: `apps/web/src/features/customer/CustomerHistory.tsx`
- Create: `apps/web/src/features/customer/ActiveTicketCard.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`

- [ ] Add `/customer/history`.
- [ ] Add API method for customer ticket/reservation history if existing `customerVisit` is not enough.
- [ ] Make `/customer` show only:
  - active ticket summary,
  - next reservation,
  - recent SMS/update feed,
  - primary next actions.
- [ ] Make `/ticket` show the active customer ticket when no `:id` is provided, otherwise the specific ticket.
- [ ] Replace the phone mockup with `ActiveTicketCard`.
- [ ] Keep `On my way`, `Share`, `Cancel ticket`, and `Get directions` as clear ticket actions.
- [ ] Move all old tickets/reservations into `/customer/history`.
- [ ] Run:
  - `npm run --silent test:web`
  - `npm run --silent test:api`
  - `npm run --silent build`

## Task 4: Business Discovery And Public Business Page

**Files:**
- Modify: `apps/web/src/pages/BusinessDirectory.tsx`
- Modify: `apps/web/src/pages/CompanyPublic.tsx`
- Create: `apps/web/src/features/business-directory/BusinessSearchPage.tsx`
- Create: `apps/web/src/features/business-directory/BusinessResultCard.tsx`
- Create: `apps/web/src/features/public-company/PublicCompanyPage.tsx`
- Modify: `apps/web/src/lib/api.ts`

- [ ] Rebuild `/businesses` as compact search/list:
  - Search input.
  - Category/city/open-now filters.
  - Compact cards that can scale from 1 to 100 businesses.
  - Each card: logo/name, industry, branch count, open status, wait time, services count, `Open page`, `Reserve`.
- [ ] Remove QR blocks from directory cards.
- [ ] Put QR/share inside business public page:
  - `Join queue`
  - `Reserve future spot`
  - `Share`
  - `Get directions`
  - `Call`
  - QR section below primary actions or inside share modal.
- [ ] Add route support for `/c/:companySlug/:branchSlug/:serviceSlug`.
- [ ] Use branch/service preselection on join/reserve.
- [ ] Run responsive checks at desktop and mobile width.
- [ ] Run:
  - `npm run --silent test:web`
  - `npm run --silent build`

## Task 5: Reservation Flow Simplification

**Files:**
- Modify: `apps/web/src/pages/ReserveTicket.tsx`
- Modify: `apps/web/src/pages/ReservationStatus.tsx`
- Create: `apps/web/src/features/reservations/ReservationBookingForm.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`

- [ ] Make the booking form the primary surface.
- [ ] Use customer profile data to prefill contact fields.
- [ ] Support selecting business, branch, service, date, time, and arrival window.
- [ ] Make the payment choice compact and honest:
  - "Payment is simulated in this build" may appear in a small muted sandbox note.
  - The primary button should be full-width or clearly sized: `Reserve for N$35`.
- [ ] Move explanation into a collapsed helper panel.
- [ ] On reservation status, show:
  - status,
  - target arrival,
  - smart join time,
  - payment state,
  - live ticket handoff if created,
  - cancel/reserve-another actions.
- [ ] Run:
  - `npm run --silent smoke:db`
  - `npm run --silent test:api`
  - `npm run --silent build`

## Task 6: Business Admin Split

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/AppShell.tsx`
- Modify: `apps/web/src/pages/Dashboard.tsx`
- Modify: `apps/web/src/pages/BusinessSettings.tsx`
- Modify: `apps/web/src/pages/Billing.tsx`
- Modify: `apps/web/src/pages/Embed.tsx`
- Create business-admin feature files listed in File Structure Plan.
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [ ] Keep `/dashboard` as overview only: health, live waiting, active branches, setup checklist, plan/SMS status.
- [ ] Split operational pages:
  - `/dashboard/branches`: create/edit/disable branches.
  - `/dashboard/services`: create/edit/disable services and assign to branches.
  - `/dashboard/staff`: invite, role, branch scope, disable.
  - `/dashboard/counters`: create counters and assign staff.
  - `/dashboard/queues`: live queue management across branches.
  - `/dashboard/customers`: customer history and ratings.
  - `/dashboard/sms`: templates, logs, SMS balance, top-ups.
  - `/dashboard/qr-codes`: generate/download QR posters.
  - `/dashboard/embed`: iframe/JS widget settings.
  - `/dashboard/analytics`: charts and date filters.
  - `/dashboard/reports`: CSV/PDF export controls.
  - `/dashboard/billing`: plan, invoices, SMS credits.
  - `/dashboard/branding`: public page logo/colors/hero.
  - `/dashboard/settings`: queue rules, security, business details.
- [ ] Add missing backend fields/models needed for counters, audit logs, SMS transactions, QR/embed keys, and queue settings.
- [ ] Keep role gates: owner full access, manager limited, staff excluded from billing/settings unless explicitly permitted.
- [ ] Run:
  - `npm run --silent test:api`
  - `npm run --silent test:web`
  - `npm run --silent smoke:db`
  - `npm run --silent build`

## Task 7: Staff Console Rebuild

**Files:**
- Modify: `apps/web/src/pages/Staff.tsx`
- Create: `apps/web/src/features/staff/StaffQueueConsole.tsx`
- Create: `apps/web/src/features/staff/WalkInDrawer.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] Remove hard-coded `Counter 3`, `Tendai Moyo`, and fake activity records from UI behavior.
- [ ] Load staff session, assigned company, assigned branch, and counter.
- [ ] Main staff screen must show:
  - current ticket,
  - next ticket,
  - waiting list,
  - high-reach primary `Call next`,
  - `Start serving`,
  - `Served`,
  - `Missed`,
  - `Hold`,
  - `Transfer`,
  - `Send SMS`,
  - `Add walk-in`.
- [ ] Add `/staff/ticket/:id` for detailed ticket actions/history.
- [ ] Add `/staff/kiosk` and `/staff/tv` as useful MVP modes, even if simple.
- [ ] Add backend audit events for all status-changing staff actions.
- [ ] Run:
  - `npm run --silent test:api`
  - `npm run --silent build`

## Task 8: Runner Marketplace MVP

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/RunnerWorkspace.tsx`
- Create: `apps/web/src/features/runner/RunnerRequestPage.tsx`
- Create: `apps/web/src/features/runner/RunnerJobDetail.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] Add `/runner/request` for customer unsupported-place requests:
  - destination,
  - service/reason,
  - target time,
  - notes,
  - max budget,
  - rules confirmation.
- [ ] Add Google Places-backed destination suggestions behind `GOOGLE_PLACES_API_KEY`.
- [ ] If no key is configured, fall back to manually entered destination.
- [ ] Add backend `ExternalPlace` or `RunnerDestination` cache with minimal allowed fields and source attribution.
- [ ] Add runner job detail page with:
  - accept,
  - check in,
  - update position,
  - upload/send proof note,
  - mark near front,
  - complete handoff.
- [ ] Add safety text and backend status constraints. Runner flow must not imply queue cutting or impersonation.
- [ ] Run:
  - `npm run --silent test:api`
  - `npm run --silent build`

## Task 9: Platform Admin And Support

**Files:**
- Modify: `apps/web/src/pages/PlatformAdmin.tsx`
- Create platform-admin feature files listed in File Structure Plan.
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [ ] Split `/admin` overview from management pages:
  - companies,
  - runners,
  - billing,
  - support,
  - audit logs,
  - settings.
- [ ] Add support-safe company/user/ticket views.
- [ ] Add manual invoice mark-paid path for admin.
- [ ] Add runner approval/rejection path.
- [ ] Add audit logs for billing overrides, staff management, queue state changes, and support access.
- [ ] Run:
  - `npm run --silent test:api`
  - `npm run --silent build`

## Task 10: UI System Cleanup

**Files:**
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/components/UI.tsx`
- Create/modify common components listed in File Structure Plan.

- [ ] Keep app UI quiet, operational, and dense. Avoid giant marketing sections in logged-in workspaces.
- [ ] Standardize:
  - `Button`
  - `IconButton`
  - `LoadingButton`
  - `ConfirmDialog`
  - `Modal`
  - `Drawer`
  - `Toast`
  - `Badge`
  - `DataTable`
  - `MetricCard`
  - `QueueTicketCard`
  - `QRCodeCard`
  - `CopyButton`
  - `EmptyState`
- [ ] Add dirty-form state where needed.
- [ ] Ensure every async button has loading/disabled behavior.
- [ ] Ensure every destructive button has a specific confirmation.
- [ ] Ensure 360px mobile width works for customer and staff flows.
- [ ] Run:
  - `npm run --silent test:web`
  - `npm run --silent build`

## Task 11: QA And Acceptance Pass

**Files:**
- Modify tests as needed under `apps/web/test` and `apps/api/test`.
- Optional create: `test-results/product-completion-checklist.md`.

- [ ] Verify customer flow:
  - Login as customer.
  - Find business.
  - Open business page.
  - Join queue.
  - Track ticket.
  - Reserve future spot.
  - View history.
  - Edit profile.
  - Sign out.
- [ ] Verify business owner flow:
  - Login as owner.
  - Create branch.
  - Create service.
  - Invite staff.
  - Generate QR.
  - View public page.
  - Open embed settings.
  - Check billing/SMS.
- [ ] Verify staff flow:
  - Login as staff.
  - Add walk-in.
  - Call next.
  - Start serving.
  - Mark served.
  - Transfer ticket.
  - Send SMS.
- [ ] Verify runner flow:
  - Customer requests unsupported destination.
  - Runner accepts.
  - Runner checks in.
  - Runner sends proof/update.
  - Runner completes handoff.
- [ ] Verify platform admin flow:
  - View companies.
  - View runners.
  - Approve/reject runner.
  - Mark invoice paid.
  - View audit log.
- [ ] Run final commands:
  - `npm run --silent test`
  - `npm run --silent smoke:db`
  - `npm run --silent build`
- [ ] If a dev server is needed for visual QA, start `npm run dev` and capture customer/business/staff/admin screenshots at desktop and mobile.

## Completion Criteria

The system is not complete until all of these are true:

- No duplicate customer profile entry in main navigation.
- Business directory can display many businesses without huge cards.
- QR codes are on business/admin/share surfaces, not bloating discovery.
- Reserve page has one obvious booking action and no competing explanation panel.
- My ticket is active-ticket focused, and ticket/reservation history has its own page.
- Business admin has real pages for branches, services, staff, counters, queues, SMS, QR, embed, analytics, billing, branding, and settings.
- Staff dashboard is ready to work at a counter and is not hard-coded to one demo person/counter.
- Runner request flow exists for unsupported places and is feature-flagged for external place suggestions.
- Platform admin can manage companies, billing, runner approvals, support, and audit logs.
- Backend enforces permissions for all protected workflows.
- Every destructive action uses a specific confirmation.
- Test scripts are reliable from the root package.
- Build, API tests, web tests, and DB smoke all pass.

## Execution Recommendation

Implement this in phases, not one giant patch:

1. Task 1 through Task 3 first: test wiring, customer nav/profile, ticket/history. This fixes the visible customer basics and creates safer verification.
2. Task 4 through Task 5 next: discovery, public company page, reservation.
3. Task 6 through Task 7 next: business admin and staff operations.
4. Task 8 through Task 9 next: runner and platform admin.
5. Task 10 through Task 11 last: shared UI cleanup and full QA pass.

Recommended execution mode: subagent-driven per task, with main-agent review between tasks. Inline execution is acceptable for Task 1 through Task 3 if speed matters more than parallelism.
