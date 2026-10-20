-- Existing USD values are intentionally retained and shown as USDT.
alter table public.divergence_monitor_project_price_records
  rename column usd_price_toman to usdt_price_toman;
