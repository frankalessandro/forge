-- ============================================================
-- FORGE — Copiar rutina a "mis rutinas" + agregar ejercicio suelto
-- ============================================================
-- Las rutinas predeterminadas (is_public=true) pasan a ser solo guía: ya no
-- se puede entrenar directo desde ellas, hay que copiarlas primero. También
-- se agrega un flujo tipo "playlist" para sumar un ejercicio suelto a una
-- rutina propia sin pasar por el editor completo.
--
-- SECURITY INVOKER: corren como el usuario autenticado, las policies RLS
-- existentes siguen aplicando (routines_select_public / _insert_own,
-- routine_exercises_select_public / _insert_own).

-- ── 1. Copiar una rutina (predeterminada o de otro) a rutina propia ──
-- Copia independiente: sin FK/vínculo al origen (decisión de producto).
create or replace function public.copy_routine_to_user(p_source_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into routines (user_id, name, description, category, category_color, primary_muscle_group_id, frequency_per_week, is_public, is_generated)
  select auth.uid(), name, description, category, category_color, primary_muscle_group_id, frequency_per_week, false, false
  from routines
  where id = p_source_routine_id
  returning id into new_id;

  if new_id is null then
    raise exception 'Rutina de origen no encontrada o sin permiso de lectura';
  end if;

  insert into routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order")
  select new_id, exercise_id, sets, reps, rest_seconds, "order"
  from routine_exercises
  where routine_id = p_source_routine_id;

  return new_id;
end;
$$;

-- ── 2. Agregar un ejercicio suelto a una rutina propia (flujo "playlist") ──
-- Un solo insert con el siguiente "order" disponible y valores default
-- (3/10/90, iguales al default de columna). RPC en vez de insert directo
-- desde el cliente para evitar el round-trip de leer el order actual y la
-- condición de carrera si se agrega el mismo ejercicio desde dos pestañas.
create or replace function public.add_exercise_to_routine(p_routine_id uuid, p_exercise_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
  next_order integer;
begin
  select coalesce(max("order"), 0) + 1 into next_order
  from routine_exercises
  where routine_id = p_routine_id;

  insert into routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order")
  values (p_routine_id, p_exercise_id, 3, 10, 90, next_order)
  returning id into new_id;

  return new_id;
end;
$$;

-- ── Grants ──────────────────────────────────────────────────
revoke execute on function public.copy_routine_to_user(uuid) from public, anon;
revoke execute on function public.add_exercise_to_routine(uuid, uuid) from public, anon;
grant execute on function public.copy_routine_to_user(uuid) to authenticated;
grant execute on function public.add_exercise_to_routine(uuid, uuid) to authenticated;
