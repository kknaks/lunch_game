# Supabase setup

## Auth

- Use Supabase Email/Password auth.
- Pre-register company email accounts.
- Initial password: `1234`.
- App domain: `https://game.kknaks.cloud`.
- Users can change password from the app settings flow.
- Seed source: `supabase/company-users.json` (`active: true` only).

## Required env

Copy `.env.local.example` to `.env.local` and fill:

```text
NEXT_PUBLIC_APP_URL=https://game.kknaks.cloud
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Schema

Run `supabase/schema.sql` in the Supabase SQL editor.

## User seed

Use a service role key locally. Do not expose it in the browser.

```bash
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
INITIAL_PASSWORD=1234 \
npm run seed:users
```

Or create ignored `.env.seed` from `.env.seed.example` and run:

```bash
set -a
source .env.seed
set +a
npm run seed:users
```

## Daily game seed

Run `supabase/seed-daily-game.sql` in the Supabase SQL editor.
