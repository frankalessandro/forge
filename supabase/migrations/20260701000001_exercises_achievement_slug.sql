-- ============================================================
-- FORGE — slug estable para ejercicios usados en logros específicos
-- ============================================================
-- useAchievements.js mapeaba los logros de bench/squat/deadlift buscando
-- ejercicios por `name` en texto libre (p. ej. 'Bench Press'). Si alguien
-- renombra el ejercicio en el catálogo, el logro deja de trackearse sin
-- ningún error visible. Un slug estable, independiente del nombre mostrado,
-- evita ese acoplamiento.

-- El backfill de slugs para ejercicios ya existentes (bench_press,
-- barbell_squat, deadlift) vive en supabase/seed/exercises.sql, que corre
-- después de las migraciones y es idempotente (WHERE slug IS NULL) — así
-- funciona igual en un `db reset` desde cero que en una base ya poblada.
alter table exercises add column if not exists slug text;
create unique index if not exists exercises_slug_key on exercises (slug) where slug is not null;
