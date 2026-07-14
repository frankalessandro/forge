-- friend_profile() ahora también expone is_premium, para mostrar el badge
-- premium en el perfil público de amigos (PublicProfile.jsx).
create or replace function public.friend_profile(target uuid)
returns json
language plpgsql
security definer set search_path = public
stable
as $$
declare
  allowed boolean;
  result json;
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
    return null;
  end if;

  select json_build_object(
    'user_id', p.user_id,
    'name', p.name,
    'avatar_url', p.avatar_url,
    'goal', p.goal,
    'is_premium', p.is_premium,
    'streak', public.current_streak(target),
    'total_workouts', (
      select count(*) from workout_sessions s
      where s.user_id = target and s.finished_at is not null
    ),
    'total_volume', coalesce((
      select sum(ws.reps * ws.weight_kg)
      from workout_sets ws
      join workout_sessions s on s.id = ws.session_id
      where s.user_id = target and s.finished_at is not null and ws.set_type <> 'warmup'
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
