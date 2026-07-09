-- ============================================================
-- FORGE — Tag de rutina: color realmente custom (hex libre)
-- ============================================================
-- `category_color` pasa de una paleta fija de 8 keys a un hex arbitrario
-- elegido por el usuario con un color picker nativo. Primero migramos las
-- filas existentes (guardadas con la key del preset) a su hex equivalente,
-- después reemplazamos el check constraint.

alter table routines drop constraint if exists routines_category_color_check;

update routines set category_color = case category_color
  when 'lime' then '#a3e635'
  when 'sky' then '#38bdf8'
  when 'fuchsia' then '#e879f9'
  when 'amber' then '#fbbf24'
  when 'rose' then '#fb7185'
  when 'violet' then '#a78bfa'
  when 'cyan' then '#22d3ee'
  when 'orange' then '#fb923c'
  else category_color
end
where category_color in ('lime','sky','fuchsia','amber','rose','violet','cyan','orange');

alter table routines add constraint routines_category_color_check
  check (category_color is null or category_color ~ '^#[0-9a-fA-F]{6}$');
