-- ============================================================
-- FORGE — Logros v2: catálogo expandido + tabla personal_records
-- ============================================================

-- 1. Actualizar el check constraint para soportar nuevas categorías
alter table achievements drop constraint if exists achievements_category_check;
alter table achievements add constraint achievements_category_check
  check (category in ('streak', 'workouts', 'volume', 'strength', 'bench', 'squat', 'deadlift', 'prs'));

-- 2. Tabla de récords personales (log histórico de PRs rotos)
create table if not exists personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  weight_kg numeric(6,2) not null,
  session_id uuid references workout_sessions(id) on delete set null,
  recorded_at timestamptz default now()
);

create index if not exists personal_records_user_idx on personal_records (user_id);
create index if not exists personal_records_user_exercise_idx on personal_records (user_id, exercise_id);

alter table personal_records enable row level security;

create policy "personal_records_select_own" on personal_records
  for select using (auth.uid() = user_id);

create policy "personal_records_insert_own" on personal_records
  for insert with check (auth.uid() = user_id);

create policy "personal_records_delete_own" on personal_records
  for delete using (auth.uid() = user_id);

-- 3. Actualizar el catálogo de logros de forma no destructiva.
--
-- IMPORTANTE: no se usa TRUNCATE ni DELETE sobre `achievements`. Esa tabla es
-- referenciada por `user_achievements.achievement_id` con
-- `on delete cascade` (ver 20260626000000_achievements.sql), así que un
-- TRUNCATE ... CASCADE (o un DELETE de filas de `achievements`) borraría
-- permanentemente el historial de logros desbloqueados de TODOS los usuarios.
--
-- 3a. Remapear ids renombrados en v2 (mismo umbral/semántica, distinto slug)
-- ANTES de tocar el catálogo, para que los desbloqueos existentes sigan
-- siendo válidos bajo el nuevo id:
--   streak_7 (racha de 7 días) -> streak_1w (racha de 7 días)
--
-- Los siguientes ids de v1 no tienen equivalente en v2 (ningún logro nuevo
-- de su misma categoría comparte umbral): streak_3, streak_14, streak_30,
-- strength_1, strength_150. Sus filas en `achievements` se dejan intactas
-- (no se insertan/actualizan ni se borran) para no disparar el
-- ON DELETE CASCADE y así preservar cualquier desbloqueo ya existente.
update user_achievements set achievement_id = 'streak_1w'
where achievement_id = 'streak_7'
  and not exists (
    select 1 from user_achievements existing
    where existing.user_id = user_achievements.user_id
      and existing.achievement_id = 'streak_1w'
  );

-- Limpia duplicados residuales que no pudieron remapearse por violar el
-- unique (user_id, achievement_id) (el usuario ya tenía ambos desbloqueados).
delete from user_achievements
where achievement_id = 'streak_7'
  and exists (
    select 1 from user_achievements existing
    where existing.user_id = user_achievements.user_id
      and existing.achievement_id = 'streak_1w'
  );

-- 3b. Upsert del catálogo v2: inserta logros nuevos y actualiza los
-- existentes por id sin borrar ninguna fila (ver nota 3a arriba).
insert into achievements (id, name, description, category, icon, threshold, xp, sort_order) values

  -- ── CONSTANCIA (rachas en semanas → umbral en días) ──────
  ('streak_1w',  'Primera semana',   '7 días consecutivos entrenando.',    'streak', 'flame',   7,    50,  10),
  ('streak_5w',  'Mes imparable',    '35 días consecutivos entrenando.',   'streak', 'flame',   35,  200,  11),
  ('streak_10w', 'Disciplinado',     '70 días consecutivos entrenando.',   'streak', 'flame',   70,  450,  12),
  ('streak_20w', 'Modo bestia',      '140 días consecutivos entrenando.',  'streak', 'flame',   140, 900,  13),
  ('streak_40w', 'Leyenda viva',     '280 días consecutivos entrenando.',  'streak', 'crown',   280, 2000, 14),

  -- ── ENTRENOS COMPLETADOS ─────────────────────────────────
  ('workouts_1',   'Primer paso',            'Completaste tu primer entreno.',     'workouts', 'dumbbell',   1,    20, 20),
  ('workouts_5',   'Arrancando',             '5 entrenos completados.',            'workouts', 'dumbbell',   5,    50, 21),
  ('workouts_10',  'Constante',              '10 entrenos completados.',           'workouts', 'dumbbell',   10,  100, 22),
  ('workouts_25',  'Comprometido',           '25 entrenos completados.',           'workouts', 'dumbbell',   25,  200, 23),
  ('workouts_50',  'Veterano',               '50 entrenos completados.',           'workouts', 'dumbbell',   50,  350, 24),
  ('workouts_100', 'Centurión',              '100 entrenos completados.',          'workouts', 'medal',     100,  600, 25),
  ('workouts_200', 'Élite de la constancia', '200 entrenos completados.',          'workouts', 'medal',     200, 1000, 26),
  ('workouts_365', 'Un año de sudor',        '365 entrenos completados.',          'workouts', 'star',      365, 2000, 27),

  -- ── VOLUMEN ACUMULADO (en kg) ─────────────────────────────
  ('volume_10t',   'Mover montañas',      '10 toneladas de volumen acumulado.',    'volume', 'layers',      10000,    40, 30),
  ('volume_50t',   'Fábrica',             '50 toneladas de volumen acumulado.',    'volume', 'layers',      50000,   120, 31),
  ('volume_100t',  'Cien toneladas',      '100 toneladas de volumen acumulado.',   'volume', 'layers',     100000,   250, 32),
  ('volume_250t',  'Coloso',              '250 toneladas de volumen acumulado.',   'volume', 'mountain',   250000,   500, 33),
  ('volume_500t',  'Titán',               '500 toneladas de volumen acumulado.',   'volume', 'mountain',   500000,   900, 34),
  ('volume_1000t', 'Mil toneladas',       '1000 toneladas de volumen acumulado.',  'volume', 'mountain',  1000000,  1500, 35),
  ('volume_5000t', 'Leyenda del volumen', '5000 toneladas de volumen acumulado.',  'volume', 'mountain',  5000000,  3000, 36),

  -- ── FUERZA GENERAL (peso máximo en cualquier serie) ──────
  ('strength_20',  'Primera carga real',  'Levantaste 20 kg en una serie.',   'strength', 'award',    20,   20, 40),
  ('strength_40',  'Levantando en serio', 'Levantaste 40 kg en una serie.',   'strength', 'award',    40,   40, 41),
  ('strength_60',  'Fuerza sólida',       'Levantaste 60 kg en una serie.',   'strength', 'award',    60,   70, 42),
  ('strength_80',  '80 kg club',          'Levantaste 80 kg en una serie.',   'strength', 'trophy',   80,  110, 43),
  ('strength_100', 'Club de los 100',     'Levantaste 100 kg en una serie.',  'strength', 'trophy',  100,  160, 44),
  ('strength_120', 'Fuerza seria',        'Levantaste 120 kg en una serie.',  'strength', 'trophy',  120,  220, 45),
  ('strength_140', 'Brutal',              'Levantaste 140 kg en una serie.',  'strength', 'trophy',  140,  300, 46),
  ('strength_160', 'Powerlifter amateur', 'Levantaste 160 kg en una serie.',  'strength', 'trophy',  160,  400, 47),
  ('strength_180', 'Monstruo',            'Levantaste 180 kg en una serie.',  'strength', 'crown',   180,  520, 48),
  ('strength_200', 'Los 200',             'Levantaste 200 kg en una serie.',  'strength', 'crown',   200,  700, 49),
  ('strength_220', 'Bestia absoluta',     'Levantaste 220 kg en una serie.',  'strength', 'crown',   220,  900, 50),

  -- ── PRESS DE BANCA ────────────────────────────────────────
  ('bench_60',  'Banca: 60 kg',             'Press de banca con barra a 60 kg.',  'bench', 'dumbbell',  60,   80, 60),
  ('bench_80',  'Banca: 80 kg',             'Press de banca con barra a 80 kg.',  'bench', 'dumbbell',  80,  130, 61),
  ('bench_100', 'Club de los 100 en banca', 'Press de banca con barra a 100 kg.', 'bench', 'trophy',   100,  200, 62),
  ('bench_120', 'Banca: 120 kg',            'Press de banca con barra a 120 kg.', 'bench', 'trophy',   120,  300, 63),
  ('bench_140', 'Banca de élite',           'Press de banca con barra a 140 kg.', 'bench', 'crown',    140,  450, 64),

  -- ── SENTADILLA ────────────────────────────────────────────
  ('squat_80',  'Sentadilla: 80 kg',       'Sentadilla con barra a 80 kg.',   'squat', 'layers',   80,  100, 70),
  ('squat_100', 'Sentadilla: 100 kg',      'Sentadilla con barra a 100 kg.',  'squat', 'layers',  100,  160, 71),
  ('squat_140', 'Sentadilla: 140 kg',      'Sentadilla con barra a 140 kg.',  'squat', 'trophy',  140,  280, 72),
  ('squat_180', 'Sentadilla: 180 kg',      'Sentadilla con barra a 180 kg.',  'squat', 'trophy',  180,  450, 73),
  ('squat_220', 'Sentadilla de leyenda',   'Sentadilla con barra a 220 kg.',  'squat', 'crown',   220,  700, 74),

  -- ── PESO MUERTO ───────────────────────────────────────────
  ('deadlift_100', 'Peso muerto: 100 kg',    'Peso muerto convencional a 100 kg.',  'deadlift', 'layers',   100,  120, 80),
  ('deadlift_140', 'Peso muerto: 140 kg',    'Peso muerto convencional a 140 kg.',  'deadlift', 'trophy',   140,  200, 81),
  ('deadlift_180', 'Peso muerto: 180 kg',    'Peso muerto convencional a 180 kg.',  'deadlift', 'trophy',   180,  350, 82),
  ('deadlift_220', 'Peso muerto: 220 kg',    'Peso muerto convencional a 220 kg.',  'deadlift', 'crown',    220,  550, 83),
  ('deadlift_260', 'Peso muerto de leyenda', 'Peso muerto convencional a 260 kg.',  'deadlift', 'crown',    260,  800, 84),

  -- ── RÉCORDS PERSONALES ────────────────────────────────────
  ('prs_1',  'Primer récord',      'Rompiste tu primer récord personal.',  'prs', 'trophy',   1,    30, 90),
  ('prs_5',  '5 récords rotos',    '5 récords personales superados.',      'prs', 'trophy',   5,   100, 91),
  ('prs_10', '10 récords',         '10 récords personales superados.',     'prs', 'medal',   10,   200, 92),
  ('prs_25', 'Rompe límites',      '25 récords personales superados.',     'prs', 'medal',   25,   400, 93),
  ('prs_50', 'Máquina de récords', '50 récords personales superados.',     'prs', 'star',    50,   800, 94)

on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  category    = excluded.category,
  icon        = excluded.icon,
  threshold   = excluded.threshold,
  xp          = excluded.xp,
  sort_order  = excluded.sort_order;
