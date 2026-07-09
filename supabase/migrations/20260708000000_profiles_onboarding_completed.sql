-- El onboarding se detectaba implícitamente con profiles.name: si el usuario
-- lo saltaba sin poner su nombre, needsOnboarding volvía a ser true en cada
-- login y la encuesta se repetía para siempre. Flag explícito:
alter table profiles add column if not exists onboarding_completed boolean not null default false;

-- Usuarios existentes con nombre ya pasaron por el onboarding.
update profiles set onboarding_completed = true where name is not null;
