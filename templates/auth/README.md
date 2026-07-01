# Omukweyo Supabase Auth Email Templates

These files are the source copy for the Supabase Auth email templates used by Omukweyo.

The templates use the public logo asset at `{{ .SiteURL }}/omukweyo-email-logo.svg`. Keep `apps/web/public/omukweyo-email-logo.svg` deployed with the static site so hosted Supabase emails can load the brand mark from `https://omukweyo.com/omukweyo-email-logo.svg`.

Apply these in Supabase Dashboard under Auth > Email Templates:

- Confirm sign up: `confirm-signup.html`
- Invite user: `invite-user.html`
- Magic link or OTP: `magic-link.html`
- Change email address: `change-email-address.html`
- Reset password: `reset-password.html`

Apply these in Supabase Dashboard under Auth > Security notifications:

- Password changed: `password-changed.html`
- Email address changed: `email-address-changed.html`
- Phone number changed: `phone-number-changed.html`

Reauthentication is intentionally not customized.

Project URL settings should use:

- Site URL: `https://omukweyo.com`
- Redirect URLs: `https://omukweyo.com/**`, `https://www.omukweyo.com/**`, `http://localhost:5173/**`, `http://127.0.0.1:5173/**`

The local Supabase CLI config is wired in `supabase/config.toml`. Hosted Supabase projects still require copying these HTML files into the Dashboard or applying them with the Supabase Management API.
