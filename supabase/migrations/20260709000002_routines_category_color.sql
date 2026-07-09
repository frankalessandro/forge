-- ============================================================
-- FORGE — Tag de rutina con color elegido por el usuario
-- ============================================================
-- `category` deja de ser un select fijo (PPL/Full Body/Upper Lower/Otro) y
-- pasa a ser un tag de texto libre; el color ya no se infiere del texto, lo
-- elige el usuario de una paleta fija de 8 colores.
alter table routines add column if not exists category_color text null;

alter table routines add constraint routines_category_color_check
  check (category_color is null or category_color in (
    'lime', 'sky', 'fuchsia', 'amber', 'rose', 'violet', 'cyan', 'orange'
  ));
