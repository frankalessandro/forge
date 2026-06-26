-- ============================================================
-- FORGE — Descripción (bio) en profiles
-- Texto corto que el usuario muestra en su perfil.
-- ============================================================

alter table profiles
  add column if not exists bio text
    check (char_length(bio) <= 160);
