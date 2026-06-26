-- ============================================================
-- FORGE — Campos de fitness en profiles
-- Género, nivel de actividad y días de entreno por semana.
-- Base para BMR, FC máx + zonas y rango de peso saludable.
-- ============================================================

alter table profiles
  add column if not exists gender text
    check (gender in ('male', 'female')),
  add column if not exists activity_level text
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  add column if not exists training_days_per_week smallint
    check (training_days_per_week between 0 and 7);
