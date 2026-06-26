-- ============================================================
-- FORGE — Catálogo de ejercicios (curado, canónico)
-- Nombres en inglés (estándar de gimnasio, compatibles con seed/routines.sql)
-- Descripciones en español. Mapea a muscle_groups (taxonomía wger).
-- Idempotente: on conflict (name) do nothing.
-- ============================================================

insert into exercises (name, description, category, muscle_group_id, equipment, primary_muscles, secondary_muscles, is_custom) values

-- ── PECHO ────────────────────────────────────────────────
('Bench Press', 'Press de banca con barra acostado: empujá la barra desde el pecho hasta extender los brazos.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Barbell', ARRAY['Chest']::text[], ARRAY['Triceps','Shoulders']::text[], false),
('Incline Bench Press', 'Press inclinado con barra: banco a 30-45°, enfatiza la parte alta del pecho.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Barbell', ARRAY['Chest']::text[], ARRAY['Shoulders','Triceps']::text[], false),
('Dumbbell Bench Press', 'Press de banca con mancuernas: mayor rango de movimiento y estabilización.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Dumbbell', ARRAY['Chest']::text[], ARRAY['Triceps','Shoulders']::text[], false),
('Incline Dumbbell Press', 'Press inclinado con mancuernas para el pecho superior y hombros.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Dumbbell', ARRAY['Chest']::text[], ARRAY['Shoulders','Triceps']::text[], false),
('Cable Fly', 'Aperturas en polea: aislás el pecho con tensión constante en todo el recorrido.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Cable', ARRAY['Chest']::text[], ARRAY['Shoulders']::text[], false),
('Pec Deck Fly', 'Aperturas en máquina (peck deck) para aislar el pectoral.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Machine', ARRAY['Chest']::text[], ARRAY['Shoulders']::text[], false),
('Push-Up', 'Flexiones de brazos: empuje con el peso corporal, core firme.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Bodyweight', ARRAY['Chest']::text[], ARRAY['Triceps','Shoulders','Abs']::text[], false),
('Chest Dip', 'Fondos en paralelas inclinando el torso adelante para cargar el pecho.', 'Pecho', (select id from muscle_groups where name='Chest'), 'Bodyweight', ARRAY['Chest']::text[], ARRAY['Triceps','Shoulders']::text[], false),

-- ── ESPALDA ──────────────────────────────────────────────
('Deadlift', 'Peso muerto convencional: levantá la barra del piso extendiendo cadera y rodillas.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Barbell', ARRAY['Lats']::text[], ARRAY['Hamstrings','Glutes','Trapezius']::text[], false),
('Barbell Bent Over Row', 'Remo con barra inclinado: traccioná hacia el abdomen con la espalda neutra.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Barbell', ARRAY['Lats']::text[], ARRAY['Biceps','Trapezius']::text[], false),
('Lat Pulldown', 'Jalón al pecho en polea alta: bajá la barra al pecho llevando los codos abajo.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Cable', ARRAY['Lats']::text[], ARRAY['Biceps']::text[], false),
('Seated Cable Row', 'Remo sentado en polea baja: traccioná al abdomen juntando las escápulas.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Cable', ARRAY['Lats']::text[], ARRAY['Biceps','Trapezius']::text[], false),
('Pull-Up', 'Dominadas con agarre prono: subí el mentón por encima de la barra.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Bodyweight', ARRAY['Lats']::text[], ARRAY['Biceps']::text[], false),
('T-Bar Row', 'Remo en T: tracción pesada para el grosor de la espalda media.', 'Espalda', (select id from muscle_groups where name='Lats'), 'Barbell', ARRAY['Lats']::text[], ARRAY['Biceps','Trapezius']::text[], false),
('Face Pull', 'Jalón a la cara en polea: trabaja deltoides posterior y trapecio, salud del hombro.', 'Espalda', (select id from muscle_groups where name='Shoulders'), 'Cable', ARRAY['Shoulders']::text[], ARRAY['Trapezius']::text[], false),

-- ── HOMBROS ──────────────────────────────────────────────
('Overhead Press', 'Press militar de pie con barra: empujá por encima de la cabeza.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Barbell', ARRAY['Shoulders']::text[], ARRAY['Triceps','Trapezius']::text[], false),
('Dumbbell Shoulder Press', 'Press de hombros con mancuernas, sentado o de pie.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Dumbbell', ARRAY['Shoulders']::text[], ARRAY['Triceps']::text[], false),
('Arnold Press', 'Press Arnold: rotación de mancuernas que recluta las tres cabezas del deltoides.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Dumbbell', ARRAY['Shoulders']::text[], ARRAY['Triceps']::text[], false),
('Lateral Raise', 'Elevaciones laterales con mancuernas para el deltoides medio.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Dumbbell', ARRAY['Shoulders']::text[], '{}'::text[], false),
('Front Raise', 'Elevaciones frontales para el deltoides anterior.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Dumbbell', ARRAY['Shoulders']::text[], '{}'::text[], false),
('Rear Delt Fly', 'Aperturas posteriores (pájaros) para el deltoides posterior.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Dumbbell', ARRAY['Shoulders']::text[], ARRAY['Trapezius']::text[], false),
('Upright Row', 'Remo al mentón con barra para deltoides y trapecio.', 'Hombros', (select id from muscle_groups where name='Shoulders'), 'Barbell', ARRAY['Shoulders']::text[], ARRAY['Trapezius']::text[], false),
('Barbell Shrug', 'Encogimientos con barra para el trapecio superior.', 'Hombros', (select id from muscle_groups where name='Trapezius'), 'Barbell', ARRAY['Trapezius']::text[], '{}'::text[], false),

-- ── BRAZOS · BÍCEPS ──────────────────────────────────────
('Bicep Curl', 'Curl de bíceps con mancuernas: flexioná el codo sin balanceo.', 'Brazos', (select id from muscle_groups where name='Biceps'), 'Dumbbell', ARRAY['Biceps']::text[], '{}'::text[], false),
('Barbell Curl', 'Curl de bíceps con barra recta.', 'Brazos', (select id from muscle_groups where name='Biceps'), 'Barbell', ARRAY['Biceps']::text[], ARRAY['Brachialis']::text[], false),
('Hammer Curl', 'Curl martillo con agarre neutro: bíceps y braquial.', 'Brazos', (select id from muscle_groups where name='Biceps'), 'Dumbbell', ARRAY['Biceps']::text[], ARRAY['Brachialis']::text[], false),
('Preacher Curl', 'Curl en banco predicador para aislar el bíceps.', 'Brazos', (select id from muscle_groups where name='Biceps'), 'Barbell', ARRAY['Biceps']::text[], '{}'::text[], false),
('Concentration Curl', 'Curl concentrado sentado, máxima contracción del bíceps.', 'Brazos', (select id from muscle_groups where name='Biceps'), 'Dumbbell', ARRAY['Biceps']::text[], '{}'::text[], false),

-- ── BRAZOS · TRÍCEPS ─────────────────────────────────────
('Tricep Pushdown', 'Extensión de tríceps en polea alta con barra o soga.', 'Brazos', (select id from muscle_groups where name='Triceps'), 'Cable', ARRAY['Triceps']::text[], '{}'::text[], false),
('Overhead Tricep Extension', 'Extensión de tríceps por encima de la cabeza con mancuerna.', 'Brazos', (select id from muscle_groups where name='Triceps'), 'Dumbbell', ARRAY['Triceps']::text[], '{}'::text[], false),
('Skull Crusher', 'Press francés acostado con barra para el tríceps.', 'Brazos', (select id from muscle_groups where name='Triceps'), 'Barbell', ARRAY['Triceps']::text[], '{}'::text[], false),
('Close-Grip Bench Press', 'Press de banca con agarre cerrado: énfasis en tríceps.', 'Brazos', (select id from muscle_groups where name='Triceps'), 'Barbell', ARRAY['Triceps']::text[], ARRAY['Chest','Shoulders']::text[], false),
('Tricep Dip', 'Fondos entre bancos para el tríceps.', 'Brazos', (select id from muscle_groups where name='Triceps'), 'Bodyweight', ARRAY['Triceps']::text[], ARRAY['Chest']::text[], false),

-- ── PIERNAS · CUÁDRICEPS ─────────────────────────────────
('Barbell Squat', 'Sentadilla con barra a la espalda: bajá hasta romper la paralela.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Barbell', ARRAY['Quads']::text[], ARRAY['Glutes','Hamstrings']::text[], false),
('Front Squat', 'Sentadilla frontal con barra al frente: mayor demanda de cuádriceps y core.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Barbell', ARRAY['Quads']::text[], ARRAY['Glutes','Abs']::text[], false),
('Leg Press', 'Prensa de piernas en máquina.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Machine', ARRAY['Quads']::text[], ARRAY['Glutes','Hamstrings']::text[], false),
('Leg Extension', 'Extensión de cuádriceps en máquina.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Machine', ARRAY['Quads']::text[], '{}'::text[], false),
('Goblet Squat', 'Sentadilla goblet sosteniendo una mancuerna al pecho.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Dumbbell', ARRAY['Quads']::text[], ARRAY['Glutes']::text[], false),
('Bulgarian Split Squat', 'Sentadilla búlgara: pie trasero elevado, trabajo unilateral.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Dumbbell', ARRAY['Quads']::text[], ARRAY['Glutes','Hamstrings']::text[], false),
('Walking Lunge', 'Zancadas caminando con mancuernas.', 'Piernas', (select id from muscle_groups where name='Quads'), 'Dumbbell', ARRAY['Quads']::text[], ARRAY['Glutes','Hamstrings']::text[], false),

-- ── PIERNAS · ISQUIOS / GLÚTEOS ──────────────────────────
('Romanian Deadlift', 'Peso muerto rumano: bisagra de cadera con rodillas semiflexionadas, estira isquios.', 'Piernas', (select id from muscle_groups where name='Hamstrings'), 'Barbell', ARRAY['Hamstrings']::text[], ARRAY['Glutes']::text[], false),
('Leg Curl', 'Curl femoral en máquina para isquiotibiales.', 'Piernas', (select id from muscle_groups where name='Hamstrings'), 'Machine', ARRAY['Hamstrings']::text[], '{}'::text[], false),
('Hip Thrust', 'Empuje de cadera con barra apoyando la espalda en un banco: glúteo.', 'Piernas', (select id from muscle_groups where name='Glutes'), 'Barbell', ARRAY['Glutes']::text[], ARRAY['Hamstrings']::text[], false),
('Glute Bridge', 'Puente de glúteos en el piso con peso corporal.', 'Piernas', (select id from muscle_groups where name='Glutes'), 'Bodyweight', ARRAY['Glutes']::text[], ARRAY['Hamstrings']::text[], false),

-- ── PIERNAS · PANTORRILLAS ───────────────────────────────
('Standing Calf Raise', 'Elevación de talones de pie en máquina o con peso.', 'Piernas', (select id from muscle_groups where name='Calves'), 'Machine', ARRAY['Calves']::text[], ARRAY['Soleus']::text[], false),
('Seated Calf Raise', 'Elevación de talones sentado: enfatiza el sóleo.', 'Piernas', (select id from muscle_groups where name='Soleus'), 'Machine', ARRAY['Soleus']::text[], ARRAY['Calves']::text[], false),

-- ── CORE / ABDOMEN ───────────────────────────────────────
('Plank', 'Plancha isométrica: mantené el cuerpo recto apoyado en antebrazos.', 'Core', (select id from muscle_groups where name='Abs'), 'Bodyweight', ARRAY['Abs']::text[], ARRAY['Obliquus externus abdominis']::text[], false),
('Crunch', 'Encogimiento abdominal acostado.', 'Core', (select id from muscle_groups where name='Abs'), 'Bodyweight', ARRAY['Abs']::text[], '{}'::text[], false),
('Hanging Leg Raise', 'Elevación de piernas colgado de la barra.', 'Core', (select id from muscle_groups where name='Abs'), 'Bodyweight', ARRAY['Abs']::text[], ARRAY['Obliquus externus abdominis']::text[], false),
('Cable Crunch', 'Crunch en polea arrodillado con soga.', 'Core', (select id from muscle_groups where name='Abs'), 'Cable', ARRAY['Abs']::text[], '{}'::text[], false),
('Russian Twist', 'Giro ruso sentado para los oblicuos.', 'Core', (select id from muscle_groups where name='Obliquus externus abdominis'), 'Bodyweight', ARRAY['Obliquus externus abdominis']::text[], ARRAY['Abs']::text[], false),
('Mountain Climber', 'Escaladores en plancha: core y cardio.', 'Core', (select id from muscle_groups where name='Abs'), 'Bodyweight', ARRAY['Abs']::text[], ARRAY['Shoulders']::text[], false)

on conflict (name) do nothing;
