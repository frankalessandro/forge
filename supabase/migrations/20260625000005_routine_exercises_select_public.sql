-- Permitir leer los ejercicios de rutinas públicas (predeterminadas).
-- La policy original (routine_exercises_select_own) solo permite leer los
-- ejercicios de rutinas propias (user_id = auth.uid()); las públicas tienen
-- user_id null, por lo que sin esta policy se ven sin ejercicios por RLS.
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'routine_exercises' and policyname = 'routine_exercises_select_public'
  ) then
    create policy "routine_exercises_select_public" on routine_exercises
      for select using (
        exists (
          select 1 from routines r
          where r.id = routine_exercises.routine_id
            and r.is_public = true
        )
      );
  end if;
end $$;
