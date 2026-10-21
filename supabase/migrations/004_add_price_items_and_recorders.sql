create table public.divergence_monitor_project_price_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

insert into public.divergence_monitor_project_price_items (name)
values ('هر متر مربع آپارتمان ۱۰۰ متری پیام');

create unique index divergence_monitor_price_items_name_ci_idx
  on public.divergence_monitor_project_price_items (lower(name));

alter table public.divergence_monitor_project_price_records
  add column item_id uuid references public.divergence_monitor_project_price_items(id),
  add column recorded_by text not null default 'sobhan'
    check (length(trim(recorded_by)) > 0);

update public.divergence_monitor_project_price_records
set item_id = (
  select id from public.divergence_monitor_project_price_items
  where name = 'هر متر مربع آپارتمان ۱۰۰ متری پیام'
);

alter table public.divergence_monitor_project_price_records
  alter column item_id set not null;

alter table public.divergence_monitor_project_price_records
  rename column apartment_price_toman to price_toman;

create index divergence_monitor_price_records_item_date_idx
  on public.divergence_monitor_project_price_records
  (item_id, record_date desc, created_at desc, id desc);

alter table public.divergence_monitor_project_price_items enable row level security;
revoke all on public.divergence_monitor_project_price_items from anon, authenticated;
grant select, insert, update, delete on public.divergence_monitor_project_price_items to service_role;
