-- friend_session_sets() ahora también trae imagen y grupo muscular del
-- ejercicio, para que FriendWorkoutDetail.jsx pueda mostrar lo mismo que el
-- historial propio (SessionDetail) en vez de solo el nombre en texto.
-- Cambia el shape de retorno (columnas nuevas) -> hay que dropear primero.
drop function if exists public.friend_session_sets(uuid, uuid);

create function public.friend_session_sets(target uuid, p_session_id uuid)
returns table (
  session_id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  set_id uuid,
  exercise_id uuid,
  exercise_name text,
  exercise_image_url text,
  muscle_name text,
  set_number integer,
  reps integer,
  weight_kg numeric,
  set_type text
)
language plpgsql
security definer set search_path = public
stable
as $$
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
    s.id as session_id,
    s.started_at,
    s.finished_at,
    s.notes,
    ws.id as set_id,
    ws.exercise_id,
    coalesce(e.name_es, e.name) as exercise_name,
    e.image_url as exercise_image_url,
    coalesce(mg.name_es, mg.name) as muscle_name,
    ws.set_number,
    ws.reps,
    ws.weight_kg,
    ws.set_type
  from workout_sessions s
  join workout_sets ws on ws.session_id = s.id
  join exercises e on e.id = ws.exercise_id
  left join muscle_groups mg on mg.id = e.muscle_group_id
  where s.user_id = target and s.id = p_session_id
  order by ws.set_number;
end;
$$;

revoke execute on function public.friend_session_sets(uuid, uuid) from public, anon;
grant execute on function public.friend_session_sets(uuid, uuid) to authenticated;
