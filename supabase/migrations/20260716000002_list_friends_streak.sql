-- ============================================================
-- FORGE — list_friends ahora incluye la racha actual de cada amigo
--
-- El hero social de Amigos muestra un chip de racha por tarjeta. current_streak
-- es un helper SECURITY DEFINER (no expuesto a authenticated); list_friends lo
-- invoca como owner, así que sigue sin filtrarse a quien no sea amigo.
-- Se ordena por racha desc para que los amigos más activos aparezcan primero.
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
      case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
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
