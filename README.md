# Omukweyo

Queueing and virtual-ticketing web app for businesses that do not have a ticket system.

```
inline2/
├── apps/
│   └── web/        # Vite + React + Supabase client
├── packages/
│   └── shared/     # Shared TypeScript types
├── supabase/       # Supabase migrations and project config
├── package.json
└── README.md
```

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The runtime app is now browser direct:

```
React on Plesk/static hosting -> Supabase Auth, Postgres, Storage, Realtime
```

There is no Express API workspace anymore.

## Required Env

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://qagpjtafcokpytqzigfl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_STORAGE_BUCKET=omukweyo-assets
VITE_PUBLIC_SITE_URL=https://omukweyo.com
```

Do not put the Supabase secret key in any `VITE_` variable.

## Scripts

```bash
npm run dev          # Vite dev server
npm run build        # shared types + static React build
npm run test         # web contract tests
npm run test:browser # Playwright browser smoke
npm run db:push      # push Supabase migrations
```

## Stack

- Vite + React 19 + TypeScript
- React Router
- Tailwind CSS
- Supabase Auth
- Supabase Postgres with RLS policies
- Supabase Storage for avatars and business assets
- Supabase Realtime for queue updates
