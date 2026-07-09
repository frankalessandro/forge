-- ============================================================
-- FORGE — routine_schedule + routine_schedule_overrides (catch-up)
-- ============================================================
-- Reconstruye localmente una migración ya aplicada en remoto. Modelo
-- híbrido de scheduling: `routine_schedule` es la plantilla semanal
-- recurrente (un día sin fila = descanso); `routine_schedule_overrides`
-- permite sobreescribir un día puntual sin tocar la plantilla
-- (routine_id null = descanso forzado ese día en particular).

create table if not exists routine_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  routine_id uuid references routines(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, day_of_week)
);

create table if not exists routine_schedule_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  routine_id uuid references routines(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, date)
);

alter table routine_schedule enable row level security;
alter table routine_schedule_overrides enable row level security;

create policy "routine_schedule_select_own" on routine_schedule
  for select using (auth.uid() = user_id);
create policy "routine_schedule_insert_own" on routine_schedule
  for insert with check (auth.uid() = user_id);
create policy "routine_schedule_update_own" on routine_schedule
  for update using (auth.uid() = user_id);
create policy "routine_schedule_delete_own" on routine_schedule
  for delete using (auth.uid() = user_id);

create policy "routine_schedule_overrides_select_own" on routine_schedule_overrides
  for select using (auth.uid() = user_id);
create policy "routine_schedule_overrides_insert_own" on routine_schedule_overrides
  for insert with check (auth.uid() = user_id);
create policy "routine_schedule_overrides_update_own" on routine_schedule_overrides
  for update using (auth.uid() = user_id);
create policy "routine_schedule_overrides_delete_own" on routine_schedule_overrides
  for delete using (auth.uid() = user_id);
