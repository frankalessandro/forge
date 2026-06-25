create table body_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  weight_kg numeric(5,2) not null,
  recorded_at timestamptz default now()
);
alter table body_stats enable row level security;
create policy "Users manage own body stats"
  on body_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
