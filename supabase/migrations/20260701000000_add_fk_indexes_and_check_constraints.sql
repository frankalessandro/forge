-- ============================================================
-- FORGE — Add missing FK indexes and numeric CHECK constraints
-- ============================================================
-- Postgres does not automatically index foreign key columns
-- (only the referenced primary key is indexed). Without explicit
-- indexes, RLS policy JOINs/EXISTS checks and ON DELETE CASCADE
-- operations require sequential scans, which gets expensive as
-- tables like workout_sets grow.
--
-- This migration also adds CHECK constraints to enforce
-- non-negative/positive domain values on numeric columns that
-- previously had no validation at the database level.

-- ============================================================
-- INDEXES ON FOREIGN KEY COLUMNS
-- ============================================================

create index if not exists idx_exercises_muscle_group_id on exercises(muscle_group_id);
create index if not exists idx_exercises_created_by on exercises(created_by);

create index if not exists idx_routines_user_id on routines(user_id);

create index if not exists idx_routine_exercises_routine_id on routine_exercises(routine_id);
create index if not exists idx_routine_exercises_exercise_id on routine_exercises(exercise_id);

create index if not exists idx_workout_sessions_user_id on workout_sessions(user_id);
create index if not exists idx_workout_sessions_routine_id on workout_sessions(routine_id);

create index if not exists idx_workout_sets_session_id on workout_sets(session_id);
create index if not exists idx_workout_sets_exercise_id on workout_sets(exercise_id);

-- ============================================================
-- CHECK CONSTRAINTS ON NUMERIC DOMAIN VALUES
-- ============================================================
-- No existing seed data populates routine_exercises or
-- workout_sets (supabase/seed/import_exercises.js only touches
-- muscle_groups and exercises), so plain CHECK constraints are
-- safe to add without NOT VALID.

-- workout_sets.reps is nullable — allow NULL, disallow negative
alter table workout_sets
  add constraint workout_sets_reps_non_negative
  check (reps is null or reps >= 0);

-- workout_sets.weight_kg is nullable — allow NULL, disallow negative
alter table workout_sets
  add constraint workout_sets_weight_kg_non_negative
  check (weight_kg is null or weight_kg >= 0);

-- workout_sets.set_number is not null — must be strictly positive
alter table workout_sets
  add constraint workout_sets_set_number_positive
  check (set_number > 0);

-- routine_exercises.sets is nullable (has default 3) — allow NULL, must be > 0
alter table routine_exercises
  add constraint routine_exercises_sets_positive
  check (sets is null or sets > 0);

-- routine_exercises.reps is nullable (has default 10) — allow NULL, must be > 0
alter table routine_exercises
  add constraint routine_exercises_reps_positive
  check (reps is null or reps > 0);

-- routine_exercises.rest_seconds is nullable (has default 90) — allow NULL, disallow negative
alter table routine_exercises
  add constraint routine_exercises_rest_seconds_non_negative
  check (rest_seconds is null or rest_seconds >= 0);
