-- ============================================================
-- FORGE — Expansión de grupos musculares
-- El catálogo importado de ExerciseDB usa `target` con músculos que no existían
-- como muscle_group (forearms, adductors, abductors, spine, cardio, neck).
-- Agregamos los faltantes para poder seccionar el catálogo completo.
-- Idempotente: on conflict (name) do nothing.
-- ============================================================

insert into muscle_groups (name, body_area) values
  ('Forearms',   'Anterior'),   -- antebrazos (target: forearms)
  ('Adductors',  'Anterior'),   -- aductores  (target: adductors)
  ('Abductors',  'Posterior'),  -- abductores (target: abductors)
  ('Lower back', 'Posterior'),  -- espalda baja / erectores (target: spine)
  ('Neck',       'Posterior'),  -- cuello     (target: levator scapulae)
  ('Cardio',     'General')     -- cardio     (target: cardiovascular system)
on conflict (name) do nothing;
