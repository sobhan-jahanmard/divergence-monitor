# Codex instructions for this repository

## Database migrations are part of the task

When a change adds or edits a file in `supabase/migrations/`, do not stop after writing the SQL. Apply the pending migration to the Supabase project configured by this repository's `.env.local`, then verify the live schema and app behavior before reporting completion. This application shares its Supabase database with `D:\projects\one-bime`.

1. Read `NEXT_PUBLIC_SUPABASE_URL` from this repository's `.env.local` to identify the exact project. For SQL migrations, read `DATABASE_URL` from `D:\projects\one-bime\.env`, as authorized by the project owner. Before connecting, compare that file's Supabase URL and the database URL's project reference against this repository's URL. Never print environment file contents, credentials, or connection strings in logs or chat. Do not copy the shared credential into tracked files.
2. Check which migrations are already applied. Run only pending files in order; do not rerun schema creation or destructive statements against an existing project.
3. `SUPABASE_SERVICE_ROLE_KEY` supports the app's Data API access, but it cannot execute migration SQL. Use the shared `DATABASE_URL` for direct PostgreSQL migration work. Limit SQL changes to this application's `divergence_monitor_project_` tables and related indexes/constraints. Do not alter `one-bime` tables.
4. The shared database does not currently have a `supabase_migrations.schema_migrations` table. Migration `001` was already present; migrations `002` through `004` were applied by direct SQL on 2026-10-21. Inspect the live schema before future runs; do not blindly run `supabase db push` or replay these files.
5. Verify the resulting tables, columns, constraints, and at least one app read using the configured project. Report the actual verification result. If the shared connection is unavailable, say the migration is pending and request access; never say it was applied when only the file was created.

Keep every table this application creates under the `divergence_monitor_project_` prefix. Migration `004_add_price_items_and_recorders.sql` creates `divergence_monitor_project_price_items`, links existing records to the default item, renames `apartment_price_toman` to `price_toman`, and backfills `recorded_by` with `sobhan`.
