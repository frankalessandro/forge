-- ============================================================
-- FORGE — Nombres bilingües de ejercicios
-- `name` queda como nombre canónico en inglés (estándar de gym).
-- `name_es` agrega el nombre en español para mostrar en la UI.
-- La búsqueda consulta ambas columnas (ver useExercises), así
-- "bench press" y "press de banca" encuentran el mismo ejercicio.
-- Idempotente: solo setea name_es donde el nombre EN coincide.
-- ============================================================

alter table exercises
  add column if not exists name_es text;

update exercises set name_es = c.es from (values
  -- Pecho
  ('Bench Press', 'Press de Banca'),
  ('Incline Bench Press', 'Press Inclinado con Barra'),
  ('Dumbbell Bench Press', 'Press de Banca con Mancuernas'),
  ('Incline Dumbbell Press', 'Press Inclinado con Mancuernas'),
  ('Cable Fly', 'Aperturas en Polea'),
  ('Pec Deck Fly', 'Aperturas en Máquina (Pec Deck)'),
  ('Push-Up', 'Flexiones'),
  ('Chest Dip', 'Fondos para Pecho'),
  -- Espalda
  ('Deadlift', 'Peso Muerto'),
  ('Barbell Bent Over Row', 'Remo con Barra'),
  ('Lat Pulldown', 'Jalón al Pecho'),
  ('Seated Cable Row', 'Remo Sentado en Polea'),
  ('Pull-Up', 'Dominadas'),
  ('T-Bar Row', 'Remo en T'),
  ('Face Pull', 'Jalón a la Cara'),
  -- Hombros
  ('Overhead Press', 'Press Militar'),
  ('Dumbbell Shoulder Press', 'Press de Hombros con Mancuernas'),
  ('Arnold Press', 'Press Arnold'),
  ('Lateral Raise', 'Elevaciones Laterales'),
  ('Front Raise', 'Elevaciones Frontales'),
  ('Rear Delt Fly', 'Aperturas Posteriores'),
  ('Upright Row', 'Remo al Mentón'),
  ('Barbell Shrug', 'Encogimientos con Barra'),
  -- Bíceps
  ('Bicep Curl', 'Curl de Bíceps'),
  ('Barbell Curl', 'Curl con Barra'),
  ('Hammer Curl', 'Curl Martillo'),
  ('Preacher Curl', 'Curl en Banco Predicador'),
  ('Concentration Curl', 'Curl Concentrado'),
  -- Tríceps
  ('Tricep Pushdown', 'Extensión de Tríceps en Polea'),
  ('Overhead Tricep Extension', 'Extensión de Tríceps sobre la Cabeza'),
  ('Skull Crusher', 'Press Francés'),
  ('Close-Grip Bench Press', 'Press de Banca Agarre Cerrado'),
  ('Tricep Dip', 'Fondos para Tríceps'),
  -- Cuádriceps
  ('Barbell Squat', 'Sentadilla con Barra'),
  ('Front Squat', 'Sentadilla Frontal'),
  ('Leg Press', 'Prensa de Piernas'),
  ('Leg Extension', 'Extensión de Cuádriceps'),
  ('Goblet Squat', 'Sentadilla Goblet'),
  ('Bulgarian Split Squat', 'Sentadilla Búlgara'),
  ('Walking Lunge', 'Zancadas Caminando'),
  -- Isquios / Glúteos
  ('Romanian Deadlift', 'Peso Muerto Rumano'),
  ('Leg Curl', 'Curl Femoral'),
  ('Hip Thrust', 'Empuje de Cadera'),
  ('Glute Bridge', 'Puente de Glúteos'),
  -- Pantorrillas
  ('Standing Calf Raise', 'Elevación de Talones de Pie'),
  ('Seated Calf Raise', 'Elevación de Talones Sentado'),
  -- Core
  ('Plank', 'Plancha'),
  ('Crunch', 'Encogimiento Abdominal'),
  ('Hanging Leg Raise', 'Elevación de Piernas Colgado'),
  ('Cable Crunch', 'Crunch en Polea'),
  ('Russian Twist', 'Giro Ruso'),
  ('Mountain Climber', 'Escaladores')
) as c(en, es)
where exercises.name = c.en;
