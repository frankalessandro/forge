-- ============================================================
-- FORGE — friend_workouts ahora devuelve miniaturas de ejercicios por sesión
--
-- Para que el historial del amigo se vea igual que "Progreso" (History.jsx):
-- cada sesión incluye `thumbs`, los primeros 4 ejercicios distintos (en orden
-- de aparición) con su imagen. exercise_count sigue siendo el total, así el
-- cliente calcula el "+N" restante.
--
-- Se une `exercises` en el subquery, y como esa tabla tiene columna `target`
-- (que colisiona con el parámetro), se añade `#variable_conflict use_variable`.
-- Cambia el shape de retorno -> drop + create + regrant.
-- ============================================================

drop function if exists public.friend_workouts(uuid);

create function public.friend_workouts(target uuid)
returns table (
  id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  exercise_count bigint,
  volume numeric,
  thumbs json
)
language plpgsql
security definer set search_path = public
stable
as $$
#variable_conflict use_variable
declare
  allowed boolean;
begin
  if target = auth.uid() then
    allowed := true;
  else
    select exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = target)
          or (f.addressee_id = auth.uid() and f.requester_id = target))
    ) into allowed;
  end if;

  if not allowed then
    return;
  end if;

  return query
  select
    s.id,
    s.started_at,
    s.finished_at,
    s.notes,
    count(distinct ws.exercise_id) as exercise_count,
    coalesce(sum(case when ws.set_type <> 'warmup' then ws.reps * ws.weight_kg else 0 end), 0) as volume,
    coalesce((
      select json_agg(
               json_build_object('id', t.exercise_id, 'name', t.name, 'imageUrl', t.image_url)
               order by t.first_set
             )
      from (
        select
          ws2.exercise_id,
          coalesce(e.name_es, e.name) as name,
          e.image_url,
          min(ws2.set_number) as first_set
        from workout_sets ws2
        join exercises e on e.id = ws2.exercise_id
        where ws2.session_id = s.id
        group by ws2.exercise_id, coalesce(e.name_es, e.name), e.image_url
        order by min(ws2.set_number)
        limit 4
      ) t
    ), '[]'::json) as thumbs
  from workout_sessions s
  left join workout_sets ws on ws.session_id = s.id
  where s.user_id = target and s.finished_at is not null
  group by s.id, s.started_at, s.finished_at, s.notes
  order by s.started_at desc
  limit 50;
end;
$$;

revoke execute on function public.friend_workouts(uuid) from public, anon;
grant execute on function public.friend_workouts(uuid) to authenticated;
