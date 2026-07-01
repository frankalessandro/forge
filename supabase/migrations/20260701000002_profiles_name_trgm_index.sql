-- ============================================================
-- FORGE — índice trigram para búsqueda de usuarios por nombre
-- ============================================================
-- search_users() (20260626000001_friendships.sql) hace `name ilike '%q%'`,
-- un patrón con comodín inicial que no puede usar un índice B-tree estándar.
-- Con pg_trgm + GIN, ese mismo patrón sí puede resolverse por índice en vez
-- de un table scan completo de `profiles`.

create extension if not exists pg_trgm;

create index if not exists profiles_name_trgm_idx
  on profiles using gin (name gin_trgm_ops);
