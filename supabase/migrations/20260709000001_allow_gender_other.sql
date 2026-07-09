-- Opción de género inclusiva: se agrega 'other' al check de profiles.gender.
-- El constraint fue creado inline en la columna, así que su nombre es el
-- autogenerado profiles_gender_check.
alter table profiles drop constraint if exists profiles_gender_check;
alter table profiles
  add constraint profiles_gender_check check (gender in ('male', 'female', 'other'));
