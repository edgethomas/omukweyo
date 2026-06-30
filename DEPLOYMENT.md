# Plesk Deployment

Omukweyo is now deployed as a static React app backed directly by Supabase.

```
Browser -> Plesk static files -> Supabase Auth/Postgres/Storage/Realtime
```

There is no Node/Express runtime backend to configure.

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

## Plesk Document Root

Point the website document root to the built files, or upload the contents of `apps/web/dist` into `httpdocs`.

Recommended final shape:

```text
/httpdocs/
├── index.html
├── assets/
└── omukweyo-widget.js
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

## SPA Fallback

Configure Plesk/Apache/Nginx so unknown routes serve `index.html`. This is required for routes like:

- `/dashboard`
- `/staff`
- `/customer/profile`
- `/c/bank-windhoek`

For Apache, an `.htaccess` fallback like this is enough:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Supabase Checks

Before deploying:

```bash
supabase db push --linked
supabase db lint --linked --fail-on error
supabase db advisors --linked
```

The app expects:

- Supabase Auth demo users to exist.
- RLS policies from `supabase/migrations` to be applied.
- Storage bucket `omukweyo-assets` to exist.
- Storage policies to allow authenticated uploads and public reads.

## Smoke Test

After deployment:

- Open `/`
- Open `/businesses`
- Open `/c/bank-windhoek`
- Log in as `owner@omukweyo.demo` with `demo123`
- Confirm `/dashboard` loads without a server-side API.
