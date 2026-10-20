# خانه‌نما — Ghasem Abad apartment price tracker

A two-page Persian RTL Next.js application. All stored prices are **Toman**, never Rial. Apartment prices are entered manually; historical USDT and 18K gold prices can be filled from market data.

## Setup

Requires Node.js 20.19+ and npm.

1. Run `npm ci`.
2. Create a Supabase project. In its SQL editor run `supabase/migrations/001_create_price_records.sql`, `002_rename_usd_to_usdt.sql`, and `003_allow_duplicate_record_dates.sql` in order (or apply them with the Supabase CLI). Existing deployments need migrations `002` and `003`.
3. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the project's service role key. **Server only**; never prefix this key with `NEXT_PUBLIC_`.
4. Run `npm run dev` and open http://localhost:3000.

For production: `npm run build`, then `npm start`. Set the same environment variables in your hosting provider. Deploy as a Node.js Next.js application, not a static export. The build does not need database credentials; pages load live data at request time. Missing credentials show a Persian configuration error, not fabricated data.

## Shared password access

The dashboard and records page require the shared password `Jahanmard` (case-insensitive), checked only by a Server Action. The password is intentionally hardcoded in the server-only `lib/auth-core.ts`, as requested. There are no user accounts or Supabase Auth dependencies.

Successful login sets an HMAC-signed, HttpOnly, SameSite=Lax cookie for exactly seven days, with Secure enabled in production. The server verifies its signature and expiry on page loads, data reads, and every create/update/delete action. Expiry is fixed from login rather than extended on each visit. Logout clears the cookie. The existing server-only Supabase service-role key signs sessions, so rotating that key invalidates existing sessions. Production requires HTTPS.

Anyone with the shared password can view, add, edit, or delete records. Database RLS and revoked anonymous grants continue to prevent direct browser database access.

## Data and calculations

- Database dates are Gregorian `DATE`; the calendar picker, chart groups, and labels use Jalali dates. Dates after today in Tehran are disabled in the picker and rejected by server validation.
- Multiple records can share a date after migration `003` removes the old unique constraint. The records table orders same-day entries by creation time and ID; daily charts retain each entry.
- Positive whole Toman amounts are limited to JavaScript's safe integer maximum (9,007,199,254,740,991) in both Zod and SQL. PostgreSQL BIGINT supports larger values, but those are intentionally rejected to avoid silent precision loss in JSON/JavaScript. Derived ratios use floating point, with formatting only at display time.
- USDT and gold ratios are calculated for each record before aggregation. Monthly/yearly means exclude null rates independently. No interpolation or synthetic records are added; daily lines do not connect across null conversions.
- The form's market lookup requests a daily `USDTIRT` close from Nobitex for the selected Tehran date and converts Rial to Toman. If Nobitex is unavailable or has no candle, it tries TGJU's historical `USDT_IRR` rate, then TGJU's free-market `USD_IRR_FREE` rate as a proxy; the form warns when it uses USD because USD and USDT can differ. Gold uses TGJU's `GOLD_18K_IRR` data. These are online JSON files from Iran Market Data, not files stored in this project: historical files are cached for up to one hour, while today's fresh snapshot is preferred and cached for up to five minutes. A snapshot is accepted only for the matching Tehran date. If a rate is blank when Save is clicked, the form fetches missing rates first and shows them for review; clicking Save again writes the record. Nobitex may reject requests from some server locations (HTTP 403); the TGJU sources provide a fallback.
- Migration `002` renames the existing USD column to USDT and retains all existing numbers, as requested. Historical USD entries are therefore displayed as USDT after migration.
- Until migration `002` is applied, the app reads and writes the existing `usd_price_toman` column under the Tether label. After the rename it automatically switches to `usdt_price_toman`, so local use is not blocked by migration timing.
- Chart headline and percentage changes follow the selected aggregation and compare the two latest valid plotted values. Single valid values have no percentage change.
- Charts fetch the full history in ordered 1,000-row batches. Table pagination runs server-side in pages of 10 with an exact total; invalid and out-of-range pages are normalized. Deleting the last row redirects to the last available page.
- Mutations compare original editable values in the database predicate to detect stale edits/deletes, and report conflicts.
- Supabase errors are logged server-side; Persian failures are returned to the UI. The service key is imported only through `server-only` modules.

## Structure

`app/` contains the two App Router pages and Server Actions; `components/` contains reusable UI, charts, dialogs, table, and calendar. `components/ui` uses the shadcn/ui composition pattern with Radix accessible Dialog/AlertDialog primitives, CVA buttons, and semantic Table components; `components.json` configures shadcn. Tailwind CSS v4 and locally packaged Vazirmatn are loaded in the root layout. Sonner supplies toasts.

## Checks

```
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover per-record conversions, independent null averages, Jalali month/year boundaries, date validation, safe integer amounts, previous valid values, and URL page validation. Live CRUD verification requires your configured Supabase project and migration; no external database is provisioned by this repository.

Dependency audit: production dependencies have no reported advisories at implementation time. The development-only Next.js ESLint toolchain currently has transitive glob/braces advisories with no compatible upstream fix; it is not part of the production server.

This app uses only the dedicated table `public.divergence_monitor_project_price_records` and can share a Supabase project with other applications. Manual entry works without the market data services; automatic lookup depends on Nobitex and Iran Market Data availability.
