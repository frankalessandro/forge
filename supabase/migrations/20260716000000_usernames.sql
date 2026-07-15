-- ============================================================
-- FORGE — Usernames con tag estilo Riot ID (username#A3F9K)
--
-- El par (username, tag) es el identificador público único. `name` sigue
-- siendo el nombre visible libre. El username se auto-genera para todos, pero
-- solo los usuarios premium pueden cambiarlo: la regla vive en la base
-- (RPC set_username + trigger), no solo en la UI, porque updateProfile hace
-- un upsert con el objeto completo y no es de confianza.
-- ============================================================

alter table profiles add column if not exists username text;
alter table profiles add column if not exists tag text;

-- Formato: username en minúsculas [a-z0-9_], 3-20 chars. tag base36, 5 chars.
alter table profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');
alter table profiles
  add constraint profiles_tag_format
  check (tag is null or tag ~ '^[a-z0-9]{5}$');

-- El par (username, tag) es único.
create unique index if not exists profiles_username_tag_key
  on profiles (username, tag);

-- Búsqueda por username con patrón %q% (igual que name).
create index if not exists profiles_username_trgm_idx
  on profiles using gin (username gin_trgm_ops);

-- ============================================================
-- Helpers de generación
-- ============================================================

-- Sanitiza un texto arbitrario a un username base válido. Devuelve 'user' si
-- no queda nada aprovechable.
create or replace function public.slug_username(raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text;
begin
  s := lower(coalesce(raw, ''));
  -- Espacios y guiones a underscore; se elimina todo lo demás no permitido.
  s := regexp_replace(s, '[\s\-]+', '_', 'g');
  s := regexp_replace(s, '[^a-z0-9_]', '', 'g');
  s := regexp_replace(s, '_+', '_', 'g');
  s := trim(both '_' from s);
  s := left(s, 20);
  if length(s) < 3 then
    return 'user';
  end if;
  return s;
end;
$$;

-- Un tag base36 aleatorio de 5 caracteres, libre para el username dado.
create or replace function public.gen_user_tag(p_username text)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..5 loop
      candidate := candidate || substr(chars, 1 + floor(random() * 36)::int, 1);
    end loop;
    exit when not exists (
      select 1 from profiles where username = p_username and tag = candidate
    );
  end loop;
  return candidate;
end;
$$;

-- ============================================================
-- Auto-asignación al registrarse (reemplaza handle_new_user)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base text;
begin
  base := slug_username(split_part(new.email, '@', 1));
  insert into public.profiles (user_id, username, tag)
  values (new.id, base, gen_user_tag(base));
  return new;
end;
$$;

-- ============================================================
-- Backfill de usuarios existentes (antes de crear el trigger de protección)
-- ============================================================

do $$
declare
  r record;
  base text;
begin
  for r in
    select p.user_id, p.name, u.email
    from profiles p
    join auth.users u on u.id = p.user_id
    where p.username is null
  loop
    base := slug_username(coalesce(nullif(r.name, ''), split_part(r.email, '@', 1)));
    update profiles
      set username = base, tag = gen_user_tag(base)
      where user_id = r.user_id;
  end loop;
end;
$$;

-- ============================================================
-- Protección: username/tag solo se cambian vía set_username()
-- ============================================================

-- El RPC set_username activa este flag local antes de su UPDATE; cualquier otro
-- intento de modificar username/tag (p. ej. un PATCH directo a profiles) falla.
create or replace function public.protect_username_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.username is distinct from old.username or new.tag is distinct from old.tag)
     and coalesce(current_setting('app.allow_username_change', true), '') <> '1' then
    raise exception 'username/tag solo se pueden cambiar con set_username()';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_username
  before update on profiles
  for each row execute procedure public.protect_username_change();

-- ============================================================
-- RPC: cambiar username (solo premium)
-- ============================================================

-- Retorna json: { ok, username, tag } en éxito, o { ok:false, error } con
-- error in ('not_premium','invalid','taken').
create or replace function public.set_username(p_username text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  premium boolean;
  new_name text;
  cur_tag text;
  new_tag text;
begin
  select is_premium, tag into premium, cur_tag from profiles where user_id = me;

  if not coalesce(premium, false) then
    return json_build_object('ok', false, 'error', 'not_premium');
  end if;

  new_name := lower(trim(coalesce(p_username, '')));
  if new_name !~ '^[a-z0-9_]{3,20}$' then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  -- Se conserva el tag actual si sigue libre con el nuevo username; si no,
  -- se genera uno nuevo.
  if exists (
    select 1 from profiles
    where username = new_name and tag = cur_tag and user_id <> me
  ) then
    new_tag := gen_user_tag(new_name);
  else
    new_tag := cur_tag;
  end if;

  perform set_config('app.allow_username_change', '1', true);
  update profiles set username = new_name, tag = new_tag, updated_at = now()
    where user_id = me;

  return json_build_object('ok', true, 'username', new_name, 'tag', new_tag);
end;
$$;

-- ============================================================
-- Búsqueda: por username OR name, con tag y estado de la relación
-- ============================================================

-- Estas funciones cambian su tipo de retorno (nuevas columnas), así que hay
-- que soltarlas antes de recrearlas.
drop function if exists public.search_users(text);
drop function if exists public.list_friends();
drop function if exists public.list_friend_requests();

create function public.search_users(q text)
returns table (
  user_id uuid,
  name text,
  username text,
  tag text,
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
    p.username,
    p.tag,
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
    and (p.username ilike '%' || q || '%' or coalesce(p.name, '') ilike '%' || q || '%')
  order by
    (p.username = lower(q)) desc,             -- match exacto de username primero
    (p.username ilike lower(q) || '%') desc,  -- luego prefijos
    (p.name ilike q || '%') desc,
    p.username
  limit 15;
$$;

-- Agregar por ID exacto (username#tag). Reusa la lógica de send_friend_request.
-- Retorna: 'sent' | 'accepted' | 'exists' | 'self' | 'not_found'.
create or replace function public.add_friend_by_tag(p_username text, p_tag text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  target uuid;
begin
  select user_id into target
  from profiles
  where username = lower(trim(p_username)) and tag = lower(trim(p_tag));

  if target is null then
    return 'not_found';
  end if;

  return public.send_friend_request(target);
end;
$$;

-- Solicitudes salientes pendientes (las que yo envié).
create or replace function public.list_sent_requests()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  username text,
  tag text,
  avatar_url text,
  created_at timestamptz
)
language sql
security definer set search_path = public
stable
as $$
  select f.id as friendship_id, p.user_id, p.name, p.username, p.tag, p.avatar_url, f.created_at
  from friendships f
  join profiles p on p.user_id = f.addressee_id
  where f.requester_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
$$;

-- ============================================================
-- Se añaden username/tag a las lecturas sociales existentes
-- ============================================================

create function public.list_friends()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  username text,
  tag text,
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
    p.username,
    p.tag,
    p.avatar_url
  from friendships f
  join profiles p
    on p.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  order by p.name;
$$;

create function public.list_friend_requests()
returns table (
  friendship_id uuid,
  user_id uuid,
  name text,
  username text,
  tag text,
  avatar_url text,
  created_at timestamptz
)
language sql
security definer set search_path = public
stable
as $$
  select f.id as friendship_id, p.user_id, p.name, p.username, p.tag, p.avatar_url, f.created_at
  from friendships f
  join profiles p on p.user_id = f.requester_id
  where f.addressee_id = auth.uid() and f.status = 'pending'
  order by f.created_at desc;
$$;

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
    'username', p.username,
    'tag', p.tag,
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

-- ============================================================
-- Permisos (mismo criterio que friendships.sql)
-- ============================================================

-- search_users/list_friends/list_friend_requests se recrearon (drop+create), así
-- que hay que restablecer sus grants (Supabase re-otorga a anon por default).
revoke execute on function public.set_username(text) from public, anon;
revoke execute on function public.add_friend_by_tag(text, text) from public, anon;
revoke execute on function public.list_sent_requests() from public, anon;
revoke execute on function public.search_users(text) from public, anon;
revoke execute on function public.list_friends() from public, anon;
revoke execute on function public.list_friend_requests() from public, anon;

grant execute on function public.set_username(text) to authenticated;
grant execute on function public.add_friend_by_tag(text, text) to authenticated;
grant execute on function public.list_sent_requests() to authenticated;
grant execute on function public.search_users(text) to authenticated;
grant execute on function public.list_friends() to authenticated;
grant execute on function public.list_friend_requests() to authenticated;
