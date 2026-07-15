-- ============================================================
-- FORGE — Username máx. 12 chars + premium puede editar el tag (#)
--
-- Cambios sobre 20260716000000_usernames.sql:
--  1. El username baja de 20 a 12 caracteres máximo.
--  2. El tag pasa a 1-5 chars (antes exactamente 5) para poder personalizarlo.
--  3. set_username acepta un tag opcional: premium puede elegir username Y tag.
-- ============================================================

-- slug_username ahora trunca a 12.
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
  s := regexp_replace(s, '[\s\-]+', '_', 'g');
  s := regexp_replace(s, '[^a-z0-9_]', '', 'g');
  s := regexp_replace(s, '_+', '_', 'g');
  s := trim(both '_' from s);
  s := trim(both '_' from left(s, 12));
  if length(s) < 3 then
    return 'user';
  end if;
  return s;
end;
$$;

-- Arreglar usernames existentes que superan 12 chars ANTES de endurecer el
-- constraint. Se trunca y, si el par (username, tag) colisiona, se regenera tag.
-- El trigger de protección exige el flag local para permitir el cambio.
do $$
declare
  r record;
  new_name text;
  new_tag text;
begin
  perform set_config('app.allow_username_change', '1', true);
  for r in select user_id, username, tag from profiles where length(username) > 12 loop
    new_name := slug_username(r.username);
    if exists (
      select 1 from profiles
      where username = new_name and tag = r.tag and user_id <> r.user_id
    ) then
      new_tag := gen_user_tag(new_name);
    else
      new_tag := r.tag;
    end if;
    update profiles set username = new_name, tag = new_tag where user_id = r.user_id;
  end loop;
end;
$$;

-- Endurecer constraints.
alter table profiles drop constraint if exists profiles_username_format;
alter table profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,12}$');

alter table profiles drop constraint if exists profiles_tag_format;
alter table profiles
  add constraint profiles_tag_format
  check (tag is null or tag ~ '^[a-z0-9]{1,5}$');

-- ============================================================
-- set_username: premium elige username y (opcionalmente) tag
-- ============================================================
-- Firma nueva (text, text): se suelta la anterior de un solo argumento.
drop function if exists public.set_username(text);

-- Retorna json: { ok:true, username, tag } o { ok:false, error } con
-- error in ('not_premium','invalid','invalid_tag','tag_taken').
create or replace function public.set_username(p_username text, p_tag text default null)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  premium boolean;
  new_name text;
  cur_tag text;
  desired_tag text;
  final_tag text;
begin
  select is_premium, tag into premium, cur_tag from profiles where user_id = me;

  if not coalesce(premium, false) then
    return json_build_object('ok', false, 'error', 'not_premium');
  end if;

  new_name := lower(trim(coalesce(p_username, '')));
  if new_name !~ '^[a-z0-9_]{3,12}$' then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  desired_tag := nullif(lower(trim(coalesce(p_tag, ''))), '');

  if desired_tag is not null then
    -- Tag personalizado: validar formato y unicidad del par.
    if desired_tag !~ '^[a-z0-9]{1,5}$' then
      return json_build_object('ok', false, 'error', 'invalid_tag');
    end if;
    if exists (
      select 1 from profiles
      where username = new_name and tag = desired_tag and user_id <> me
    ) then
      return json_build_object('ok', false, 'error', 'tag_taken');
    end if;
    final_tag := desired_tag;
  else
    -- Sin tag explícito: conservar el actual si sigue libre, si no regenerar.
    if exists (
      select 1 from profiles
      where username = new_name and tag = cur_tag and user_id <> me
    ) then
      final_tag := gen_user_tag(new_name);
    else
      final_tag := cur_tag;
    end if;
  end if;

  perform set_config('app.allow_username_change', '1', true);
  update profiles set username = new_name, tag = final_tag, updated_at = now()
    where user_id = me;

  return json_build_object('ok', true, 'username', new_name, 'tag', final_tag);
end;
$$;

revoke execute on function public.set_username(text, text) from public, anon;
grant execute on function public.set_username(text, text) to authenticated;
