alter table public.divergence_monitor_project_price_records
  add column notes text null,
  add constraint divergence_monitor_project_price_records_notes_check
    check (notes is null or (char_length(notes) <= 2000 and length(btrim(notes)) > 0));

notify pgrst, 'reload schema';
