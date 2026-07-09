-- ============================================================
-- FORGE — Media de ejercicios: video/animación + variaciones
-- ============================================================

-- image_url ya existe en exercises (schema inicial). Sumamos el video/animación.
alter table exercises
  add column if not exists video_url text;

-- Variaciones de un ejercicio (agarre, ángulo, unilateral, etc.). Catálogo de
-- solo lectura, igual que exercises.
create table if not exists exercise_variations (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references exercises(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  video_url text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists exercise_variations_exercise_idx
  on exercise_variations (exercise_id);

alter table exercise_variations enable row level security;

create policy "exercise_variations_select_authenticated" on exercise_variations
  for select using (auth.role() = 'authenticated');
