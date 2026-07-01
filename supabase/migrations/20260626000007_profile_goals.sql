-- ============================================================
-- FORGE — Múltiples objetivos en profiles
-- El usuario puede elegir hasta 3 objetivos. Se conserva la
-- columna `goal` (objetivo principal = goals[0]) por
-- compatibilidad con la generación de rutinas y los perfiles.
-- ============================================================

alter table profiles
  add column if not exists goals text[]
    check (
      goals is null
      or (
        coalesce(array_length(goals, 1), 0) <= 3
        and goals <@ array['lose_fat', 'gain_muscle', 'strength', 'endurance', 'health']::text[]
      )
    );

-- Respalda los objetivos ya existentes hacia el nuevo campo.
update profiles
  set goals = array[goal]
  where goal is not null and goals is null;
