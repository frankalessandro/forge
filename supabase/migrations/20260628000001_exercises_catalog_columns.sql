-- ============================================================
-- FORGE — Columnas del catálogo ExerciseDB + Storage bucket
-- ============================================================

-- Columnas adicionales del dataset externo
alter table exercises
  add column if not exists body_part       text,
  add column if not exists instructions_en text,
  add column if not exists target          text,
  add column if not exists source_id       text;

-- Índice único parcial: solo para filas que tienen source_id (evita conflicto con ejercicios curados)
create unique index if not exists exercises_source_id_idx
  on exercises (source_id)
  where source_id is not null;

-- Bucket público para media de ejercicios (GIFs + imágenes)
insert into storage.buckets (id, name, public, file_size_limit)
values ('exercise-media', 'exercise-media', true, 10485760)  -- 10 MB max por archivo
on conflict (id) do nothing;

-- Acceso público de lectura al bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'exercise_media_public_read'
  ) then
    create policy "exercise_media_public_read" on storage.objects
      for select using (bucket_id = 'exercise-media');
  end if;
end $$;
