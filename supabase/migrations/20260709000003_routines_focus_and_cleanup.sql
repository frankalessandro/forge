-- ============================================================
-- FORGE — Categoría estructurada de rutina (focus) + limpieza
-- ============================================================
-- `category`/`category_color` siguen siendo el tag libre elegido por el
-- usuario. `focus` es un segundo tag, de lista fija y más general (no
-- encerrado en terminología de split avanzado tipo push/pull/legs), para
-- dar una idea rápida del enfoque de la rutina.
--
-- Se eliminan `primary_muscle_group_id` y `frequency_per_week`: quedaron
-- sin uso real en la UI y con grano equivocado (músculo específico del
-- catálogo de ejercicios, no categoría general de rutina).

alter table routines add column if not exists focus text;

alter table routines add constraint routines_focus_check check (focus is null or focus in (
  'full_body','upper_body','lower_body','push','pull','legs',
  'chest','back','shoulders','arms','glutes','core','cardio','mobility'
));

alter table routines drop column if exists primary_muscle_group_id;
alter table routines drop column if exists frequency_per_week;

-- ── Recrear funciones que referenciaban las columnas eliminadas ──

create or replace function public.copy_routine_to_user(p_source_routine_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into routines (user_id, name, description, category, category_color, focus, is_public, is_generated)
  select auth.uid(), name, description, category, category_color, focus, false, false
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
    insert into routines (user_id, name, description, category, focus, is_public, is_generated)
    values (auth.uid(), r->>'name', r->>'description', r->>'category', r->>'focus', false, true)
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
