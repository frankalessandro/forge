DO $$
DECLARE
  r_ppl_push uuid;
  r_ppl_pull uuid;
  r_ppl_legs uuid;
  r_fullbody uuid;
  r_upper_a uuid;
  r_upper_b uuid;
  r_lower_a uuid;
  r_lower_b uuid;
  ex_id uuid;
BEGIN

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('PPL — Push (Empuje)', 'Pecho, hombros y tríceps', 'PPL', true, null)
RETURNING id INTO r_ppl_push;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bench Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_push, ex_id, 4, 8, 120, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Overhead Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_push, ex_id, 3, 8, 120, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Tricep%' OR name ILIKE '%Triceps%') AND (name ILIKE '%Pushdown%' OR name ILIKE '%Extension%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_push, ex_id, 3, 12, 90, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Lateral Raise%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_push, ex_id, 3, 15, 60, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Chest Fly%' OR name ILIKE '%Pec Fly%' OR name ILIKE '%Cable Fly%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_push, ex_id, 3, 12, 90, 5); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('PPL — Pull (Jalón)', 'Espalda y bíceps', 'PPL', true, null)
RETURNING id INTO r_ppl_pull;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Deadlift%' AND name NOT ILIKE '%Romanian%' AND name NOT ILIKE '%Sumo%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_pull, ex_id, 3, 5, 180, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Barbell Row%' OR name ILIKE '%Bent Over Row%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_pull, ex_id, 4, 8, 120, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Lat Pulldown%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_pull, ex_id, 3, 10, 90, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bicep Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_pull, ex_id, 3, 12, 60, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Face Pull%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_pull, ex_id, 3, 15, 60, 5); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('PPL — Legs (Piernas)', 'Cuádriceps, isquios y glúteos', 'PPL', true, null)
RETURNING id INTO r_ppl_legs;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Squat%' AND name NOT ILIKE '%Front%' AND name NOT ILIKE '%Hack%' AND name NOT ILIKE '%Goblet%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_legs, ex_id, 4, 6, 180, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_legs, ex_id, 3, 10, 120, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Romanian Deadlift%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_legs, ex_id, 3, 10, 120, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_legs, ex_id, 3, 12, 90, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Calf Raise%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_ppl_legs, ex_id, 4, 15, 60, 5); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('Full Body 3×', 'Entrenamiento de cuerpo completo, 3 días por semana', 'Full Body', true, null)
RETURNING id INTO r_fullbody;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Squat%' AND name NOT ILIKE '%Front%' AND name NOT ILIKE '%Hack%' AND name NOT ILIKE '%Goblet%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 8, 150, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bench Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 8, 120, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Barbell Row%' OR name ILIKE '%Bent Over Row%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 8, 120, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Overhead Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 8, 120, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Romanian Deadlift%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 10, 120, 5); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bicep Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 12, 60, 6); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Tricep%' OR name ILIKE '%Triceps%') AND (name ILIKE '%Extension%' OR name ILIKE '%Pushdown%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_fullbody, ex_id, 3, 12, 60, 7); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('Upper Lower — Upper A', 'Tren superior A — fuerza', 'Upper Lower', true, null)
RETURNING id INTO r_upper_a;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bench Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 4, 6, 150, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Barbell Row%' OR name ILIKE '%Bent Over Row%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 4, 6, 150, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Overhead Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 3, 8, 120, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Lat Pulldown%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 3, 8, 120, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bicep Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 3, 12, 60, 5); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Tricep%' OR name ILIKE '%Triceps%') AND (name ILIKE '%Pushdown%' OR name ILIKE '%Extension%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_a, ex_id, 3, 12, 60, 6); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('Upper Lower — Lower A', 'Tren inferior A — fuerza', 'Upper Lower', true, null)
RETURNING id INTO r_lower_a;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Squat%' AND name NOT ILIKE '%Front%' AND name NOT ILIKE '%Hack%' AND name NOT ILIKE '%Goblet%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_a, ex_id, 4, 6, 180, 1); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Romanian Deadlift%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_a, ex_id, 3, 8, 120, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_a, ex_id, 3, 10, 120, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_a, ex_id, 3, 12, 90, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Calf Raise%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_a, ex_id, 4, 15, 60, 5); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('Upper Lower — Upper B', 'Tren superior B — hipertrofia', 'Upper Lower', true, null)
RETURNING id INTO r_upper_b;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Incline%' OR name ILIKE '%Dumbbell%') AND name ILIKE '%Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 4, 10, 90, 1);
ELSE
  SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bench Press%' AND is_custom = false LIMIT 1;
  IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 4, 10, 90, 1); END IF;
END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Lat Pulldown%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 4, 10, 90, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Lateral Raise%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 3, 15, 60, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Face Pull%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 3, 15, 60, 4); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Bicep Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 3, 15, 60, 5); END IF;

SELECT id INTO ex_id FROM exercises WHERE (name ILIKE '%Tricep%' OR name ILIKE '%Triceps%') AND (name ILIKE '%Pushdown%' OR name ILIKE '%Extension%') AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_upper_b, ex_id, 3, 15, 60, 6); END IF;

INSERT INTO routines (name, description, category, is_public, user_id)
VALUES ('Upper Lower — Lower B', 'Tren inferior B — hipertrofia', 'Upper Lower', true, null)
RETURNING id INTO r_lower_b;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Front Squat%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_b, ex_id, 4, 10, 120, 1);
ELSE
  SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Squat%' AND name NOT ILIKE '%Hack%' AND name NOT ILIKE '%Goblet%' AND is_custom = false LIMIT 1;
  IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_b, ex_id, 4, 10, 120, 1); END IF;
END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Press%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_b, ex_id, 3, 12, 90, 2); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Leg Curl%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_b, ex_id, 4, 12, 90, 3); END IF;

SELECT id INTO ex_id FROM exercises WHERE name ILIKE '%Calf Raise%' AND is_custom = false LIMIT 1;
IF ex_id IS NOT NULL THEN INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, rest_seconds, "order") VALUES (r_lower_b, ex_id, 4, 20, 45, 4); END IF;

END $$;
