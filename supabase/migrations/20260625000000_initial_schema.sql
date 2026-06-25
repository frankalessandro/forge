-- ============================================================
-- FORGE — Initial Schema
-- ============================================================

-- profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  birth_date date,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  goal text check (goal in ('lose_fat','gain_muscle','strength','endurance','health')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- muscle_groups
create table muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body_area text not null,
  icon text,
  created_at timestamptz default now()
);

-- exercises
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  muscle_group_id uuid references muscle_groups(id),
  equipment text,
  image_url text,
  is_custom boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- routines
create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- routine_exercises
create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  sets integer default 3,
  reps integer default 10,
  rest_seconds integer default 90,
  "order" integer not null,
  created_at timestamptz default now()
);

-- workout_sessions
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references routines(id),
  started_at timestamptz default now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- workout_sets
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  set_number integer not null,
  reps integer,
  weight_kg numeric(6,2),
  set_type text default 'normal' check (set_type in ('normal','warmup','dropset','failure')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table muscle_groups enable row level security;
alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;

-- profiles: el usuario solo accede a su propio perfil
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = user_id);

-- muscle_groups: solo lectura para usuarios autenticados
create policy "muscle_groups_select_authenticated" on muscle_groups
  for select using (auth.role() = 'authenticated');

-- exercises: todos los autenticados leen; solo escriben sus ejercicios custom
create policy "exercises_select_authenticated" on exercises
  for select using (auth.role() = 'authenticated');

create policy "exercises_insert_custom" on exercises
  for insert with check (
    auth.uid() = created_by
    and is_custom = true
  );

create policy "exercises_update_own_custom" on exercises
  for update using (auth.uid() = created_by and is_custom = true);

create policy "exercises_delete_own_custom" on exercises
  for delete using (auth.uid() = created_by and is_custom = true);

-- routines: el usuario solo accede a las suyas
create policy "routines_select_own" on routines
  for select using (auth.uid() = user_id);

create policy "routines_insert_own" on routines
  for insert with check (auth.uid() = user_id);

create policy "routines_update_own" on routines
  for update using (auth.uid() = user_id);

create policy "routines_delete_own" on routines
  for delete using (auth.uid() = user_id);

-- routine_exercises: acceso a través de la rutina del usuario
create policy "routine_exercises_select_own" on routine_exercises
  for select using (
    exists (
      select 1 from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "routine_exercises_insert_own" on routine_exercises
  for insert with check (
    exists (
      select 1 from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "routine_exercises_update_own" on routine_exercises
  for update using (
    exists (
      select 1 from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

create policy "routine_exercises_delete_own" on routine_exercises
  for delete using (
    exists (
      select 1 from routines
      where routines.id = routine_exercises.routine_id
      and routines.user_id = auth.uid()
    )
  );

-- workout_sessions: el usuario solo accede a las suyas
create policy "workout_sessions_select_own" on workout_sessions
  for select using (auth.uid() = user_id);

create policy "workout_sessions_insert_own" on workout_sessions
  for insert with check (auth.uid() = user_id);

create policy "workout_sessions_update_own" on workout_sessions
  for update using (auth.uid() = user_id);

create policy "workout_sessions_delete_own" on workout_sessions
  for delete using (auth.uid() = user_id);

-- workout_sets: acceso a través de la sesión del usuario
create policy "workout_sets_select_own" on workout_sets
  for select using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "workout_sets_insert_own" on workout_sets
  for insert with check (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "workout_sets_update_own" on workout_sets
  for update using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

create policy "workout_sets_delete_own" on workout_sets
  for delete using (
    exists (
      select 1 from workout_sessions
      where workout_sessions.id = workout_sets.session_id
      and workout_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: crear profile automáticamente al registrarse
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
