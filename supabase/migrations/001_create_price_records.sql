create table public.divergence_monitor_project_price_records (
 id uuid primary key default gen_random_uuid(),
 record_date date not null unique,
 apartment_price_toman bigint not null check (apartment_price_toman > 0 and apartment_price_toman <= 9007199254740991),
 usd_price_toman bigint null check (usd_price_toman > 0 and usd_price_toman <= 9007199254740991),
 gold_18k_price_toman bigint null check (gold_18k_price_toman > 0 and gold_18k_price_toman <= 9007199254740991),
 created_at timestamptz not null default now()
);
-- Browser/anonymous database access is disabled. App writes go through authenticated, validated Server Actions.
alter table public.divergence_monitor_project_price_records enable row level security;
revoke all on public.divergence_monitor_project_price_records from anon, authenticated;
grant select, insert, update, delete on public.divergence_monitor_project_price_records to service_role;
