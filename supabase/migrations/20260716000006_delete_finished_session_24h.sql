-- ============================================================
-- FORGE — Borrar un entrenamiento finalizado, solo dentro de 24h
--
-- cancelSession() ya borraba sesiones EN CURSO (finished_at is null) sin
-- límite de tiempo -- eso sigue igual. Ahora además se permite borrar una
-- sesión YA FINALIZADA, pero solo si finished_at fue hace menos de 24h. La
-- regla vive en la policy de RLS (no solo en el cliente), porque un DELETE
-- directo a la tabla debe respetarla igual.
-- ============================================================

drop policy if exists "workout_sessions_delete_own" on workout_sessions;

create policy "workout_sessions_delete_own" on workout_sessions
  for delete using (
    auth.uid() = user_id
    and (finished_at is null or finished_at > now() - interval '24 hours')
  );
