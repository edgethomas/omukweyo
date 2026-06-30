# Local Setup

## 1. Install

```bash
npm install
```

## 2. Configure Env

Copy `.env.example` to `.env` and set:

```env
VITE_SUPABASE_URL=https://qagpjtafcokpytqzigfl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_STORAGE_BUCKET=omukweyo-assets
VITE_PUBLIC_SITE_URL=https://omukweyo.com
```

Only `VITE_` values are bundled into the browser. Never add `SUPABASE_SECRET_KEY` to the React app.

## 3. Supabase Schema

The project uses SQL migrations in `supabase/migrations`.

```bash
supabase link --project-ref qagpjtafcokpytqzigfl
npm run db:push
```

## 4. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173`.

## 5. Verify

```bash
npm run test
npm run build
npm run test:browser
```

## Demo Accounts

The seeded demo accounts are Supabase Auth users:

- `customer@omukweyo.demo`
- `owner@omukweyo.demo`
- `staff@omukweyo.demo`
- `runner@omukweyo.demo`
- `admin@omukweyo.demo`

Password for all demo accounts: `demo123`

## Architecture

Runtime:

```
React static app -> Supabase Auth/Postgres/Storage/Realtime
```

Node is only used locally or on Plesk to install dependencies and build the static files.
