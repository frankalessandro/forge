-- ============================================================
-- FORGE — Social: amistades + lectura controlada de perfiles
--
-- Nota de diseño / seguridad:
-- profiles guarda datos sensibles (peso, fecha de nacimiento, altura). RLS es
-- a nivel de fila, no de columna, así que abrir un SELECT a "amigos" expondría
-- TODAS las columnas. Para exponer solo campos públicos sin filtrar datos
-- sensibles, la base sigue bloqueada al dueño y el acceso social se hace por
-- funciones SECURITY DEFINER que devuelven exclusivamente columnas públicas
-- y validan la amistad antes de responder.
-- ============================================================

create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references auth.users(id) on delete cascade not null,
  addressee_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index friendships_requester_idx on friendships (requester_id);
create index friendships_addressee_idx on friendships (addressee_id);

alter table friendships enable row level security;

-- Cada parte ve sus propias relaciones.
create policy "friendships_select_involved" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Solo se puede crear una solicitud como remitente.
create policy "friendships_insert_requester" on friendships
  for insert with check (auth.uid() = requester_id);

-- Solo el destinatario puede aceptar (cambiar el estado).
create policy "friendships_update_addressee" on friendships
  for update using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);

-- Cualquiera de las dos partes puede eliminar (rechazar o dejar de ser amigos).
create policy "friendships_delete_involved" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ============================================================
-- Funciones SECURITY DEFINER (acceso social controlado)
-- ============================================================

-- Racha actual de días consecutivos con entrenos finalizados.
create or replace function public.current_streak(target uuid)
returns integer
language plpgsql
security definer set search_path = public
stable
as $$
declare
  cur date;
  cnt integer := 0;
begin
  if exists (
    select 1 from workout_sessions
    where user_id = target and finished_at is not null and started_at::date = current_date
  ) then
    cur := current_date;
  elsif exists (
    select 1 from workout_sessions
    where user_id = target and finished_at is not null and started_at::date = current_date - 1
  ) then
    cur := current_date - 1;
  else
    return 0;
  end if;

  loop
    exit when not exists (
      select 1 from workout_sessions
      where user_id = target and finished_at is not null and started_at::date = cur
    );
    cnt := cnt + 1;
    cur := cur - 1;
  end loop;

  return cnt;
end;
$$;

-- Busca usuarios por nombre. Devuelve solo campos públicos + el estado de la
-- relación con quien llama (none / pending / accepted) y la dirección.
create or replace function public.search_users(q text)
returns table (
  user_id uuid,
  name text,
  avatar_url text,
  goal text,
  status text,
  friendship_id uuid,
  is_incoming boolean
)
language sql
security definer set search_path = public
stable
as $$
  select
    p.user_id,
    p.name,
    p.avatar_url,
    p.goal,
    coalesce(f.status, 'none') as status,
    f.id as friendship_id,
    (f.addressee_id = auth.uid() and f.status = 'pending') as is_incoming
  from profiles p
  left join friendships f
    on (f.requester_id = auth.uid() and f.addressee_id = p.user_id)
    or (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
  where p.user_id <> auth.uid()
    and coalesce(p.name, '') <> ''
    and p.name ilike '%' || q || '%'
  order by p.name
  limit 20;
$$;

-- Lista de amigos aceptados (campos públicos).
create or replace function public.list_friends()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  avatar_url text
)
language sql
security definer set search_path = public
stable
as $$
  select
    f.id as friendship_id,
    case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as user_id,
    p.name,
    p.avatar_url
  from friendships f
  join profiles p
    on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  order by p.name;
$$;

-- Solicitudes de amistad entrantes pendientes.
create or replace function public.list_friend_requests()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  avatar_url text,
  created_at timestamptz
)
language sql
security definer set search_path = public
stable
as $$
  select f.id as friendship_id, p.user_id, p.name, p.avatar_url, f.created_at
  from friendships f
  join profiles p on p.user_id = f.requester_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
$$;

-- Envía (o auto-acepta si ya había una solicitud inversa) una solicitud.
-- Devuelve: 'sent' | 'accepted' | 'exists' | 'self'.
create or replace function public.send_friend_request(target uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
begin
  if target = auth.uid() then
    return 'self';
  end if;

  -- ¿Existía una solicitud inversa pendiente? La aceptamos.
  update friendships
    set status = 'accepted', updated_at = now()
    where requester_id = target and addressee_id = auth.uid() and status = 'pending';
  if found then
    return 'accepted';
  end if;

  -- ¿Ya hay una relación (en cualquier dirección)?
  if exists (
    select 1 from friendships
    where (requester_id = auth.uid() and addressee_id = target)
       or (requester_id = target and addressee_id = auth.uid())
  ) then
    return 'exists';
  end if;

  insert into friendships (requester_id, addressee_id, status)
  values (auth.uid(), target, 'pending');
  return 'sent';
end;
$$;

-- Perfil público + estadísticas de un usuario, solo si es amigo aceptado
-- (o uno mismo). Devuelve null si no hay permiso.
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

-- Postgres otorga EXECUTE a PUBLIC al crear funciones, y Supabase además concede
-- por default-privileges a anon/authenticated. Por eso revocamos en public Y en
-- anon para todas, y dejamos current_streak también sin authenticated.
revoke execute on function public.current_streak(uuid) from public, anon, authenticated;
revoke execute on function public.search_users(text) from public, anon;
revoke execute on function public.list_friends() from public, anon;
revoke execute on function public.list_friend_requests() from public, anon;
revoke execute on function public.send_friend_request(uuid) from public, anon;
revoke execute on function public.friend_profile(uuid) from public, anon;

-- current_streak NO se concede a authenticated a propósito: es un helper interno
-- de friend_profile (SECURITY DEFINER), que lo invoca como owner. Exponerlo
-- dejaría leer la racha de cualquier usuario sin ser su amigo.
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.list_friends() to authenticated;
grant execute on function public.list_friend_requests() to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.friend_profile(uuid) to authenticated;
