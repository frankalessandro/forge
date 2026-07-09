-- ============================================================
-- FORGE — routines.primary_muscle_group_id + frequency_per_week (catch-up)
-- ============================================================
-- Reconstruye localmente una migración ya aplicada en remoto. Estas
-- columnas quedaron sin uso real en la UI y con un grano equivocado
-- (músculo específico en vez de categoría general de rutina) — se
-- eliminan en la migración siguiente (routines_focus_and_cleanup). Se
-- versionan acá igual para que el historial de migraciones sea
-- reproducible: copy_routine_to_user (20260709000001) ya las referencia.
alter table routines add column if not exists primary_muscle_group_id uuid references muscle_groups(id);
alter table routines add column if not exists frequency_per_week smallint check (frequency_per_week >= 1 and frequency_per_week <= 7);
