-- Color de acento personalizable (feature premium). null = verde por
-- defecto. El set de colores válidos vive también en el cliente
-- (utils/accentColors.js); este check evita que se guarde cualquier string.
alter table profiles add column if not exists accent_color text
  check (accent_color is null or accent_color in (
    'blue', 'red', 'purple', 'orange', 'pink', 'cyan', 'amber', 'indigo'
  ));
