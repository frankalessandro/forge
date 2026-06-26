-- ============================================================
-- FORGE — Gamificación: logros (achievements) y desbloqueos
-- ============================================================

-- Catálogo de logros. El id es un slug estable ('streak_7', 'volume_100t', …)
-- para poder referenciarlo desde el cliente sin acoplarse a uuids.
create table achievements (
  id text primary key,
  name text not null,
  description text not null,
  category text not null check (category in ('streak', 'workouts', 'volume', 'strength')),
  icon text,                       -- nombre de ícono lucide (mapeado en el cliente)
  threshold numeric not null,      -- valor a alcanzar en la métrica de la categoría
  xp integer not null default 0,   -- experiencia que otorga (alimenta el rango)
  sort_order integer not null default 0
);

-- Logros desbloqueados por cada usuario.
create table user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id text references achievements(id) on delete cascade not null,
  unlocked_at timestamptz default now(),
  unique (user_id, achievement_id)
);

create index user_achievements_user_idx on user_achievements (user_id);

-- ── RLS ─────────────────────────────────────────────────────
alter table achievements enable row level security;
alter table user_achievements enable row level security;

-- El catálogo es de solo lectura para cualquier usuario autenticado.
create policy "achievements_select_authenticated" on achievements
  for select using (auth.role() = 'authenticated');

-- Cada usuario gestiona únicamente sus propios desbloqueos.
create policy "user_achievements_select_own" on user_achievements
  for select using (auth.uid() = user_id);

create policy "user_achievements_insert_own" on user_achievements
  for insert with check (auth.uid() = user_id);

create policy "user_achievements_delete_own" on user_achievements
  for delete using (auth.uid() = user_id);

-- ── Seed del catálogo ───────────────────────────────────────
-- streak    → racha máxima de días consecutivos entrenando
-- workouts  → cantidad total de entrenos finalizados
-- volume    → volumen acumulado (kg = reps × peso, sin calentamiento)
-- strength  → peso máximo levantado en una sola serie (kg)
insert into achievements (id, name, description, category, icon, threshold, xp, sort_order) values
  ('streak_3',     'En marcha',        '3 días seguidos entrenando.',          'streak',   'flame',    3,        30,  10),
  ('streak_7',     'Semana perfecta',  '7 días seguidos entrenando.',          'streak',   'flame',    7,        80,  11),
  ('streak_14',    'Imparable',        '14 días seguidos entrenando.',         'streak',   'flame',    14,      200,  12),
  ('streak_30',    'Disciplina total', '30 días seguidos entrenando.',         'streak',   'flame',    30,      500,  13),

  ('workouts_1',   'Primer paso',      'Completaste tu primer entreno.',       'workouts', 'dumbbell', 1,        20,  20),
  ('workouts_10',  'Constante',        '10 entrenos completados.',             'workouts', 'dumbbell', 10,       60,  21),
  ('workouts_25',  'Comprometido',     '25 entrenos completados.',             'workouts', 'dumbbell', 25,      150,  22),
  ('workouts_50',  'Veterano',         '50 entrenos completados.',             'workouts', 'dumbbell', 50,      300,  23),
  ('workouts_100', 'Centurión',        '100 entrenos completados.',            'workouts', 'medal',    100,     600,  24),

  ('volume_10t',   'Mover montañas',   '10 toneladas de volumen acumulado.',   'volume',   'layers',   10000,    40,  30),
  ('volume_50t',   'Fábrica',          '50 toneladas de volumen acumulado.',   'volume',   'layers',   50000,   120,  31),
  ('volume_250t',  'Coloso',           '250 toneladas de volumen acumulado.',  'volume',   'mountain', 250000,  300,  32),
  ('volume_1000t', 'Leyenda',          '1000 toneladas de volumen acumulado.', 'volume',   'mountain', 1000000, 800,  33),

  ('strength_1',   'Primera carga',    'Registraste tu primera serie con peso.', 'strength', 'award',  1,        10,  40),
  ('strength_60',  'Fuerza sólida',    'Levantaste 60 kg en una serie.',         'strength', 'trophy', 60,       60,  41),
  ('strength_100', 'Club de los 100',  'Levantaste 100 kg en una serie.',        'strength', 'trophy', 100,     150,  42),
  ('strength_150', 'Bestia',           'Levantaste 150 kg en una serie.',        'strength', 'crown',  150,     400,  43);
