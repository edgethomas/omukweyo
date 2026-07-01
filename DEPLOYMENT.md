# Plesk Deployment

Omukweyo is a static React app backed directly by Supabase.

```text
Browser -> Plesk -> Supabase Auth/Postgres/Storage/Realtime
```

There is no Node/Express API backend to configure. Plesk can serve the built files either as a pure static site or through the included Node.js static server.

## Build

On the server or locally before upload:

```bash
npm install
npm run build
```

The static site output is:

```text
apps/web/dist/
```

## Static Plesk Mode

Point the website document root to the built files, or upload the contents of `apps/web/dist` into `httpdocs`.

Recommended final shape:

```text
/httpdocs/
  index.html
  .htaccess
  assets/
  omukweyo-widget.js
```

The file `apps/web/public/.htaccess` is copied into `apps/web/dist` during `npm run build`. It makes direct refreshes like `/how-it-works`, `/dashboard`, and `/customer/profile` serve `index.html` instead of failing.

## Plesk Node.js App Mode

If the domain is configured under Plesk's Node.js feature, set the application startup file to:

```text
app.js
```

The root `app.js` serves `apps/web/dist` and falls back to `index.html` for React routes. This prevents Passenger from crashing when a user refreshes a client-side route.

The package start command is:

```bash
npm start
```

## Environment Variables

Only browser-safe Vite variables are required at build time:

```env
VITE_SUPABASE_URL=https://qagpjtafcokpytqzigfl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_SUPABASE_STORAGE_BUCKET=omukweyo-assets
VITE_PUBLIC_SITE_URL=https://omukweyo.com
```

Do not put `SUPABASE_SECRET_KEY` in Plesk web env for this React app.

## Supabase Checks

Before deploying:

```bash
supabase db push --linked
supabase db lint --linked --fail-on error
supabase db advisors --linked
```

The app expects:

- Supabase Auth users and app `User` rows to be created through the auth trigger.
- RLS policies from `supabase/migrations` to be applied.
- Storage bucket `omukweyo-assets` to exist.
- Storage policies to allow authenticated uploads and public reads.

## Smoke Test

After deployment:

- Open `/`
- Open `/how-it-works`, refresh, and confirm the page still loads.
- Open `/businesses`
- Open `/c/bank-windhoek`
- Log in as `owner@omukweyo.demo` with `demo123`
- Confirm `/dashboard` loads without a server-side API.
