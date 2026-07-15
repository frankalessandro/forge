-- ============================================================
-- FORGE — Privacidad por entrenamiento (is_public)
--
-- Los amigos veían TODO el historial de entrenamientos finalizados sin
-- control alguno. Se añade workout_sessions.is_public (default true, para no
-- romper lo que los amigos ya ven) y se filtra en toda la capa social:
-- friend_workouts, friend_session_sets y los agregados de friend_profile /
-- current_streak dejan fuera las sesiones privadas cuando quien mira no es
-- el dueño. El propio usuario siempre ve el 100% de su historial y stats.
-- ============================================================

alter table workout_sessions add column if not exists is_public boolean not null default true;

-- ============================================================
-- current_streak: racha calculada solo con sesiones públicas cuando la
-- calcula un tercero (friend_profile/list_friends la piden siempre así).
-- Para el propio dueño (p_public_only = false, el default) no se filtra.
--
-- Cambia de 1 a 2 parámetros: no es un "replace" real sino un overload nuevo,
-- así que hay que soltar la firma vieja de un solo argumento. Si no, ambas
-- coexisten y una llamada con 1 arg es ambigua (o peor, resuelve a la vieja
-- SIN filtro de privacidad).
-- ============================================================

drop function if exists public.current_streak(uuid);

create function public.current_streak(target uuid, p_public_only boolean default false)
returns integer
language plpgsql
security definer set search_path = public
stable
as $$
#variable_conflict use_variable
declare
  cur date;
  cnt integer := 0;
begin
  if exists (
    select 1 from workout_sessions
    where user_id = target and finished_at is not null and started_at::date = current_date
      and (not p_public_only or is_public)
  ) then
    cur := current_date;
  elsif exists (
    select 1 from workout_sessions
    where user_id = target and finished_at is not null and started_at::date = current_date - 1
      and (not p_public_only or is_public)
  ) then
    cur := current_date - 1;
  else
    return 0;
  end if;

  loop
    exit when not exists (
      select 1 from workout_sessions
      where user_id = target and finished_at is not null and started_at::date = cur
        and (not p_public_only or is_public)
    );
    cnt := cnt + 1;
    cur := cur - 1;
  end loop;

  return cnt;
end;
$$;

revoke execute on function public.current_streak(uuid, boolean) from public, anon, authenticated;

-- ============================================================
-- friend_workouts: solo sesiones públicas cuando target no es quien llama.
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
  self boolean := (target = auth.uid());
begin
  if self then
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
    and (self or s.is_public)
  group by s.id, s.started_at, s.finished_at, s.notes
  order by s.started_at desc
  limit 50;
end;
$$;

revoke execute on function public.friend_workouts(uuid) from public, anon;
grant execute on function public.friend_workouts(uuid) to authenticated;

-- ============================================================
-- friend_session_sets: deniega si la sesión puntual es privada y quien
-- pregunta no es el dueño (defensa en profundidad: aunque friend_workouts ya
-- no la liste, un link directo con el session_id no debe filtrarla).
-- ============================================================

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
#variable_conflict use_variable
declare
  allowed boolean;
  self boolean := (target = auth.uid());
begin
  if self then
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
    and (self or s.is_public)
  order by ws.set_number;
end;
$$;

revoke execute on function public.friend_session_sets(uuid, uuid) from public, anon;
grant execute on function public.friend_session_sets(uuid, uuid) to authenticated;

-- ============================================================
-- friend_profile: los agregados (streak, entrenos, volumen) solo cuentan
-- sesiones públicas cuando target no es quien llama.
-- ============================================================

create or replace function public.friend_profile(target uuid)
returns json
language plpgsql
security definer set search_path = public
stable
as $$
#variable_conflict use_variable
declare
  allowed boolean;
  self boolean := (target = auth.uid());
  result json;
begin
  if self then
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
    return null;
  end if;

  select json_build_object(
    'user_id', p.user_id,
    'name', p.name,
    'username', p.username,
    'tag', p.tag,
    'avatar_url', p.avatar_url,
    'goal', p.goal,
    'is_premium', p.is_premium,
    'streak', public.current_streak(target, not self),
    'total_workouts', (
      select count(*) from workout_sessions s
      where s.user_id = target and s.finished_at is not null and (self or s.is_public)
    ),
    'total_volume', coalesce((
      select sum(ws.reps * ws.weight_kg)
      from workout_sets ws
      join workout_sessions s on s.id = ws.session_id
      where s.user_id = target and s.finished_at is not null and ws.set_type <> 'warmup'
        and (self or s.is_public)
    ), 0),
    'achievements_count', (
      select count(*) from user_achievements ua where ua.user_id = target
    ),
    'xp', coalesce((
      select sum(a.xp)
      from user_achievements ua
      join achievements a on a.id = ua.achievement_id
      where ua.user_id = target
    ), 0)
  ) into result
  from profiles p
  where p.user_id = target;

  return result;
end;
$$;

-- ============================================================
-- list_friends: la racha de cada amigo también respeta la privacidad.
-- ============================================================

drop function if exists public.list_friends();

create function public.list_friends()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  username text,
  tag text,
  avatar_url text,
  streak integer
)
language sql
security definer set search_path = public
stable
as $$
  select
    f.id as friendship_id,
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as user_id,
    p.name,
    p.username,
    p.tag,
    p.avatar_url,
    public.current_streak(
      case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end,
      true
    ) as streak
  from friendships f
  join profiles p
    on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  order by streak desc, p.name;
$$;

revoke execute on function public.list_friends() from public, anon;
grant execute on function public.list_friends() to authenticated;
