-- ============================================================
-- FORGE — muscle_groups.name_es
-- ============================================================
-- El tag de grupo muscular en el detalle/editor de rutinas y en el detalle
-- de ejercicio mostraba `muscle_groups.name` (inglés, viene del catálogo
-- importado). Se agrega la traducción, mismo patrón que exercises.name_es.

alter table muscle_groups add column if not exists name_es text;

update muscle_groups set name_es = case name
  when 'Abductors' then 'Abductores'
  when 'Abs' then 'Abdominales'
  when 'Adductors' then 'Aductores'
  when 'Biceps' then 'Bíceps'
  when 'Brachialis' then 'Braquial'
  when 'Calves' then 'Gemelos'
  when 'Cardio' then 'Cardio'
  when 'Chest' then 'Pecho'
  when 'Forearms' then 'Antebrazos'
  when 'Glutes' then 'Glúteos'
  when 'Hamstrings' then 'Isquiotibiales'
  when 'Lats' then 'Dorsales'
  when 'Lower back' then 'Zona lumbar'
  when 'Neck' then 'Cuello'
  when 'Obliquus externus abdominis' then 'Oblicuos'
  when 'Quads' then 'Cuádriceps'
  when 'Serratus anterior' then 'Serrato anterior'
  when 'Shoulders' then 'Hombros'
  when 'Soleus' then 'Sóleo'
  when 'Trapezius' then 'Trapecio'
  when 'Triceps' then 'Tríceps'
  else name
end;
