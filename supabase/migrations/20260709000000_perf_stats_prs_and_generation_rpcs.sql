-- ============================================================
-- FORGE — Rendimiento: stats de logros, PRs y generación de rutinas en RPC
-- ============================================================
-- Antes el cliente bajaba TODAS las sesiones + TODOS los sets del historial
-- (dos veces: getStats y detectAndLogPRs) en cada visita al perfil y en cada
-- fin de entreno. Con historial de un año son miles de filas por visita.
-- Ahora los agregados se calculan en Postgres y viajan como un solo jsonb.
--
-- Todas las funciones son SECURITY INVOKER: corren como el usuario
-- autenticado y las policies RLS existentes siguen aplicando.

-- ── 1. Stats para logros/rango ──────────────────────────────
-- Devuelve agregados escalares + las fechas de sesión (una por sesión, payload
-- mínimo) para que el cliente calcule la racha semanal con la misma lógica
-- (utils/streak.js) que usa el dashboard.
create or replace function public.achievement_stats()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with my_sessions as (
    select id, started_at
    from workout_sessions
    where user_id = auth.uid() and finished_at is not null
  ),
  working_sets as (
    -- series efectivas (sin calentamiento) con el equipo del ejercicio;
    -- las mancuernas duplican el peso, igual que displayWeight() en cliente
    select ws.reps, ws.weight_kg, e.equipment, e.slug
    from workout_sets ws
    join my_sessions s on s.id = ws.session_id
    left join exercises e on e.id = ws.exercise_id
    where ws.set_type is distinct from 'warmup'
  )
  select jsonb_build_object(
    'totalWorkouts', (select count(*) from my_sessions),
    'totalVolume', coalesce((
      select sum(
        coalesce(reps, 0) * coalesce(weight_kg, 0)
        * case when lower(coalesce(equipment, '')) = 'dumbbell' then 2 else 1 end
      ) from working_sets
    ), 0),
    'maxSetWeight', coalesce((select max(weight_kg) from working_sets), 0),
    'benchMax',    coalesce((select max(weight_kg) from working_sets where slug = 'bench_press'), 0),
    'squatMax',    coalesce((select max(weight_kg) from working_sets where slug = 'barbell_squat'), 0),
    'deadliftMax', coalesce((select max(weight_kg) from working_sets where slug = 'deadlift'), 0),
    'totalPRs', (select count(*) from personal_records where user_id = auth.uid()),
    'trainingDaysPerWeek', (select training_days_per_week from profiles where user_id = auth.uid()),
    'sessionDates', coalesce((select jsonb_agg(started_at) from my_sessions), '[]'::jsonb)
  );
$$;

-- ── 2. Detección de PRs ─────────────────────────────────────
-- Replica detectAndLogPRs del cliente (máximo por ejercicio sobre series
-- efectivas con peso > 0; inserta solo los que superan el PR guardado) pero
-- en una sola llamada y sin bajar el historial al browser.
create or replace function public.detect_prs()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_count integer;
begin
  with maxes as (
    select ws.exercise_id, max(ws.weight_kg) as max_w
    from workout_sets ws
    join workout_sessions s on s.id = ws.session_id
    where s.user_id = auth.uid()
      and s.finished_at is not null
      and ws.set_type is distinct from 'warmup'
      and ws.weight_kg > 0
    group by ws.exercise_id
  ),
  best_session as (
    -- sesión (la más reciente, si hay empate) donde se logró ese máximo
    select distinct on (m.exercise_id) m.exercise_id, m.max_w, ws.session_id
    from maxes m
    join workout_sets ws on ws.exercise_id = m.exercise_id and ws.weight_kg = m.max_w
    join workout_sessions s on s.id = ws.session_id
      and s.user_id = auth.uid() and s.finished_at is not null
    order by m.exercise_id, s.started_at desc
  ),
  stored as (
    select exercise_id, max(weight_kg) as max_w
    from personal_records
    where user_id = auth.uid()
    group by exercise_id
  ),
  ins as (
    insert into personal_records (user_id, exercise_id, weight_kg, session_id)
    select auth.uid(), b.exercise_id, b.max_w, b.session_id
    from best_session b
    left join stored st on st.exercise_id = b.exercise_id
    where b.max_w > coalesce(st.max_w, 0)
    returning 1
  )
  select count(*) into inserted_count from ins;
  return inserted_count;
end;
$$;

-- ── 3. Generación de rutinas por objetivo ───────────────────
-- Antes: 1 delete + (1 insert de rutina + 1 insert de ejercicios) por cada
-- rutina del split, en serie desde el cliente (~11 round-trips con 5 rutinas).
-- Ahora: una sola llamada, y además atómica — si algo falla no quedan
-- rutinas generadas a medias.
create or replace function public.create_generated_routines(p_routines jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r jsonb;
  new_id uuid;
  created jsonb := '[]'::jsonb;
begin
  delete from routines where user_id = auth.uid() and is_generated = true;

  for r in select * from jsonb_array_elements(coalesce(p_routines, '[]'::jsonb))
  loop
    insert into routines (user_id, name, description, category, is_public, is_generated)
    values (auth.uid(), r->>'name', r->>'description', r->>'category', false, true)
    returning id into new_id;

    insert into routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order")
    select new_id,
           (item->>'exercise_id')::uuid,
           coalesce((item->>'sets')::int, 3),
           coalesce((item->>'reps')::int, 10),
           coalesce((item->>'rest_seconds')::int, 90),
           ord::int
    from jsonb_array_elements(coalesce(r->'exercises', '[]'::jsonb)) with ordinality as t(item, ord);

    created := created || jsonb_build_object('id', new_id, 'name', r->>'name');
  end loop;

  return created;
end;
$$;

-- ── Grants ──────────────────────────────────────────────────
revoke execute on function public.achievement_stats() from public, anon;
revoke execute on function public.detect_prs() from public, anon;
revoke execute on function public.create_generated_routines(jsonb) from public, anon;
grant execute on function public.achievement_stats() to authenticated;
grant execute on function public.detect_prs() to authenticated;
grant execute on function public.create_generated_routines(jsonb) to authenticated;
