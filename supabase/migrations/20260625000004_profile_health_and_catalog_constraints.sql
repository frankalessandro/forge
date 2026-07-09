-- ============================================================
-- profiles: campos de salud usados por el onboarding y el Perfil
-- ============================================================
alter table profiles
  add column if not exists gender text check (gender in ('male','female')),
  add column if not exists activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')),
  add column if not exists training_days_per_week smallint check (training_days_per_week between 0 and 7);

-- ============================================================
-- Catálogo: nombres únicos (habilita upsert on conflict (name)
-- desde el seed y el import de wger)
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'muscle_groups_name_key') then
    alter table muscle_groups add constraint muscle_groups_name_key unique (name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'exercises_name_key') then
    alter table exercises add constraint exercises_name_key unique (name);
  end if;
end $$;
