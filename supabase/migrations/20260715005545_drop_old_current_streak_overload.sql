-- La migración anterior (workout_session_privacy) creó current_streak(uuid, boolean
-- default false) sin dropear la versión vieja de un solo parámetro; ambas
-- coexistían como overloads, lo que generaba ambigüedad de resolución (o
-- resolvía a la versión vieja SIN filtro de privacidad) al llamarla con 1 arg.
drop function if exists public.current_streak(uuid);
