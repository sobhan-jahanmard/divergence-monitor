-- Keep each observation as its own row, even when several share a date.
alter table public.divergence_monitor_project_price_records
  drop constraint if exists divergence_monitor_project_price_records_record_date_key;

create index if not exists divergence_monitor_price_records_date_order_idx
  on public.divergence_monitor_project_price_records
  (record_date desc, created_at desc, id desc);
