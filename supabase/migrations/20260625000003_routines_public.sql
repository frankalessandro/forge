alter table routines add column if not exists is_public boolean default false;
alter table routines alter column user_id drop not null;

create policy "routines_select_public" on routines
  for select using (is_public = true or auth.uid() = user_id);
