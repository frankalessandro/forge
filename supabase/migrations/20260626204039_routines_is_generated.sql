-- ============================================================
-- FORGE — routines.is_generated (catch-up)
-- ============================================================
-- Reconstruye localmente una migración ya aplicada en remoto (aplicada
-- directo contra el proyecto sin dejar archivo local versionado). Marca las
-- rutinas creadas por "Generar según mi objetivo" para distinguirlas de las
-- propias del usuario.
alter table routines add column if not exists is_generated boolean not null default false;
