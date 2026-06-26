-- ============================================================
-- FORGE — Local dev init
-- Postgres puro (sin Supabase). Ejecutado automáticamente
-- por el contenedor al crearse por primera vez.
-- ============================================================

-- ── Mock del schema auth (reemplaza GoTrue localmente) ──────
create schema if not exists auth;

create table if not exists auth.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  created_at  timestamptz default now()
);

-- auth.uid() devuelve null por defecto (sin sesión activa).
-- Conectarse como postgres (superuser) bypassea RLS igualmente.
create or replace function auth.uid()
returns uuid
language sql stable
as $$ select null::uuid $$;

create or replace function auth.role()
returns text
language sql stable
as $$ select 'anon'::text $$;

-- ── Migración 0: Schema inicial ─────────────────────────────

create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  name        text,
  birth_date  date,
  height_cm   numeric(5,2),
  weight_kg   numeric(5,2),
  goal        text check (goal in ('lose_fat','gain_muscle','strength','endurance','health')),
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table muscle_groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  body_area   text not null,
  icon        text,
  created_at  timestamptz default now()
);

create table exercises (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  category        text,
  muscle_group_id uuid references muscle_groups(id),
  equipment       text,
  image_url       text,
  is_custom       boolean default false,
  created_by      uuid references auth.users(id),
  created_at      timestamptz default now()
);

create table routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  category    text,
  is_public   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table routine_exercises (
  id          uuid primary key default gen_random_uuid(),
  routine_id  uuid references routines(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  sets        integer default 3,
  reps        integer default 10,
  rest_seconds integer default 90,
  "order"     integer not null,
  created_at  timestamptz default now()
);

create table workout_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  routine_id  uuid references routines(id),
  started_at  timestamptz default now(),
  finished_at timestamptz,
  notes       text,
  created_at  timestamptz default now()
);

create table workout_sets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references workout_sessions(id) on delete cascade not null,
  exercise_id  uuid references exercises(id) not null,
  set_number   integer not null,
  reps         integer,
  weight_kg    numeric(6,2),
  set_type     text default 'normal' check (set_type in ('normal','warmup','dropset','failure')),
  notes        text,
  completed_at timestamptz,
  created_at   timestamptz default now()
);

-- ── Migración 1: columnas de músculos en exercises ───────────

alter table exercises
  add column if not exists primary_muscles   text[] default '{}',
  add column if not exists secondary_muscles text[] default '{}';

-- ── Migración 2: body_stats ──────────────────────────────────

create table body_stats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  weight_kg   numeric(5,2) not null,
  recorded_at timestamptz default now()
);

-- ── RLS (activado pero bypasseado cuando conectás como postgres superuser) ──

alter table profiles         enable row level security;
alter table muscle_groups    enable row level security;
alter table exercises        enable row level security;
alter table routines         enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets     enable row level security;
alter table body_stats       enable row level security;

create policy "profiles_select_own"    on profiles    for select using (auth.uid() = user_id);
create policy "profiles_insert_own"    on profiles    for insert with check (auth.uid() = user_id);
create policy "profiles_update_own"    on profiles    for update using (auth.uid() = user_id);

create policy "muscle_groups_select"   on muscle_groups for select using (true);

create policy "exercises_select"       on exercises   for select using (true);
create policy "exercises_insert_custom" on exercises  for insert with check (auth.uid() = created_by and is_custom = true);
create policy "exercises_update_custom" on exercises  for update using (auth.uid() = created_by and is_custom = true);
create policy "exercises_delete_custom" on exercises  for delete using (auth.uid() = created_by and is_custom = true);

create policy "routines_select_own_or_public" on routines for select using (is_public = true or auth.uid() = user_id);
create policy "routines_insert_own"    on routines    for insert with check (auth.uid() = user_id);
create policy "routines_update_own"    on routines    for update using (auth.uid() = user_id);
create policy "routines_delete_own"    on routines    for delete using (auth.uid() = user_id);

create policy "routine_exercises_select" on routine_exercises for select using (
  exists (select 1 from routines where routines.id = routine_exercises.routine_id and (routines.is_public or routines.user_id = auth.uid()))
);
create policy "routine_exercises_insert" on routine_exercises for insert with check (
  exists (select 1 from routines where routines.id = routine_exercises.routine_id and routines.user_id = auth.uid())
);
create policy "routine_exercises_update" on routine_exercises for update using (
  exists (select 1 from routines where routines.id = routine_exercises.routine_id and routines.user_id = auth.uid())
);
create policy "routine_exercises_delete" on routine_exercises for delete using (
  exists (select 1 from routines where routines.id = routine_exercises.routine_id and routines.user_id = auth.uid())
);

create policy "workout_sessions_select" on workout_sessions for select using (auth.uid() = user_id);
create policy "workout_sessions_insert" on workout_sessions for insert with check (auth.uid() = user_id);
create policy "workout_sessions_update" on workout_sessions for update using (auth.uid() = user_id);
create policy "workout_sessions_delete" on workout_sessions for delete using (auth.uid() = user_id);

create policy "workout_sets_select" on workout_sets for select using (
  exists (select 1 from workout_sessions where workout_sessions.id = workout_sets.session_id and workout_sessions.user_id = auth.uid())
);
create policy "workout_sets_insert" on workout_sets for insert with check (
  exists (select 1 from workout_sessions where workout_sessions.id = workout_sets.session_id and workout_sessions.user_id = auth.uid())
);
create policy "workout_sets_update" on workout_sets for update using (
  exists (select 1 from workout_sessions where workout_sessions.id = workout_sets.session_id and workout_sessions.user_id = auth.uid())
);
create policy "workout_sets_delete" on workout_sets for delete using (
  exists (select 1 from workout_sessions where workout_sessions.id = workout_sets.session_id and workout_sessions.user_id = auth.uid())
);

create policy "body_stats_all" on body_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: auto-crear profile al insertar en auth.users ───

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
