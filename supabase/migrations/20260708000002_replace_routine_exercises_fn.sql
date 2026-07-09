-- Guardado atómico de los ejercicios de una rutina. El cliente hacía
-- delete + insert en dos requests: si el insert fallaba (red, validación),
-- la rutina quedaba vacía. Dentro de la función ambos pasos comparten
-- transacción: o se aplica todo o no se aplica nada.
--
-- SECURITY INVOKER: corre como el usuario autenticado, así las policies RLS
-- de routine_exercises (que exigen ser dueño de la rutina) siguen aplicando.
create or replace function public.replace_routine_exercises(p_routine_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from routine_exercises where routine_id = p_routine_id;

  insert into routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order")
  select
    p_routine_id,
    (item->>'exercise_id')::uuid,
    coalesce((item->>'sets')::int, 3),
    coalesce((item->>'reps')::int, 10),
    coalesce((item->>'rest_seconds')::int, 90),
    ord::int
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, ord);
end;
$$;

revoke execute on function public.replace_routine_exercises(uuid, jsonb) from public, anon;
grant execute on function public.replace_routine_exercises(uuid, jsonb) to authenticated;
