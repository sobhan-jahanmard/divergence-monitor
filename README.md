# خانه‌نما — Ghasem Abad apartment price tracker

A two-page Persian RTL Next.js application. All input prices are **Toman**, never Rial. No sample data or external financial APIs are used.

## Setup

Requires Node.js 20.19+ and npm.

1. Run `npm ci`.
2. Create a Supabase project. In its SQL editor run `supabase/migrations/001_create_price_records.sql` (or apply it with the Supabase CLI).
3. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the project's service role key. **Server only**; never prefix this key with `NEXT_PUBLIC_`.
4. Run `npm run dev` and open http://localhost:3000.

For production: `npm run build`, then `npm start`. Set the same environment variables in your hosting provider. Deploy as a Node.js Next.js application, not a static export. The build does not need database credentials; pages load live data at request time. Missing credentials show a Persian configuration error, not fabricated data.

## Public write access

**Anyone who can access the deployed application can add, edit, or delete records.** This is intentional. There is no login, password, account, or protected route. Database RLS and revoked anonymous grants prevent direct browser database access; the server-only service role performs validated operations through explicit Server Actions. Keep the application private at the hosting/network layer if public editing is unwanted.

## Data and calculations

- Database dates are Gregorian `DATE`; the calendar picker, chart groups, and labels use Jalali dates.
- One record per date is enforced by a database unique constraint.
- Positive whole Toman amounts are limited to JavaScript's safe integer maximum (9,007,199,254,740,991) in both Zod and SQL. PostgreSQL BIGINT supports larger values, but those are intentionally rejected to avoid silent precision loss in JSON/JavaScript. Derived ratios use floating point, with formatting only at display time.
- USD and gold ratios are calculated for each record before aggregation. Monthly/yearly means exclude null rates independently. No interpolation or synthetic records are added; daily lines do not connect across null conversions.
- Chart headline and percentage changes follow the selected aggregation and compare the two latest valid plotted values. Single valid values have no percentage change.
- Charts fetch the full history in ordered 1,000-row batches. Table pagination runs server-side in pages of 10 with an exact total; invalid and out-of-range pages are normalized. Deleting the last row redirects to the last available page.
- Mutations compare original editable values in the database predicate to detect stale edits/deletes, and report conflicts. Unique constraints handle concurrent same-date inserts.
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
