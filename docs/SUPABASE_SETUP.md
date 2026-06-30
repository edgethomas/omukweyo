# Supabase Setup

Project ref: `qagpjtafcokpytqzigfl`

Project URL: `https://qagpjtafcokpytqzigfl.supabase.co`

## Runtime Architecture

The app is browser direct:

```text
React -> Supabase Auth
React -> Supabase Postgres through Data API + RLS
React -> Supabase Storage
React -> Supabase Realtime
```

Node is not a production API server. It is only used for install/build tooling.

## Codex MCP

This repo has a workspace MCP config in `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=qagpjtafcokpytqzigfl"
    }
  }
}
```

The Codex CLI can also add the same server globally:

```powershell
codex mcp add supabase --url "https://mcp.supabase.com/mcp?project_ref=qagpjtafcokpytqzigfl"
codex mcp login supabase
```

## Browser Env

```env
VITE_SUPABASE_URL=https://qagpjtafcokpytqzigfl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_STORAGE_BUCKET=omukweyo-assets
VITE_PUBLIC_SITE_URL=https://omukweyo.com
```

Do not expose `SUPABASE_SECRET_KEY` through any `VITE_` variable or browser bundle.

## Auth URLs and Email Templates

In Supabase Dashboard > Auth > URL Configuration:

- Site URL: `https://omukweyo.com`
- Redirect URLs: `https://omukweyo.com/**`, `https://www.omukweyo.com/**`, `http://localhost:5173/**`, `http://127.0.0.1:5173/**`

Template source files live in `supabase/templates/auth`. Apply all listed templates in Supabase Dashboard except Reauthentication.

## Migrations

All Supabase schema/policy/storage changes live in `supabase/migrations`.

Important migrations:

- Auth/profile bootstrap.
- Prisma-compatible app tables already pushed to Supabase.
- Storage bucket `omukweyo-assets`.
- Browser-direct RLS/Data API policies.
- Service-role grants for trusted maintenance scripts.

Run:

```bash
supabase db push --linked
supabase db lint --linked --fail-on error
supabase db advisors --linked
```

## Security Notes

- React uses only the publishable key.
- Table access is controlled by grants and RLS policies.
- Storage uploads use Supabase Storage policies.
- Sensitive future workflows that truly need a secret key should become Supabase Edge Functions, not an Express server.
- Rotate any Supabase secret key that has been pasted into chat, screenshots, GitHub issues, logs, or frontend code.
