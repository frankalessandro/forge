-- Tutoriales vistos por módulo, persistidos en BD (localStorage solo no
-- sobrevive a un borrado de caché o a Safari purgando storage tras 7 días
-- de inactividad).
create table user_tutorials_seen (
  user_id uuid references auth.users(id) on delete cascade not null,
  module_key text not null,
  seen_at timestamptz default now(),
  primary key (user_id, module_key)
);
alter table user_tutorials_seen enable row level security;
create policy "Users manage own tutorials seen"
  on user_tutorials_seen for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
