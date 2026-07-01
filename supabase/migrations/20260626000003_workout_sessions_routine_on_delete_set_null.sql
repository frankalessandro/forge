-- workout_sessions.routine_id no tenía acción ON DELETE, por lo que borrar una
-- rutina con sesiones registradas fallaba con un error de foreign key (23503).
-- Cambiamos a ON DELETE SET NULL: al eliminar una rutina, sus sesiones quedan
-- huérfanas (routine_id = null) pero se conserva el historial de entrenamiento.

alter table workout_sessions
  drop constraint workout_sessions_routine_id_fkey;

alter table workout_sessions
  add constraint workout_sessions_routine_id_fkey
  foreign key (routine_id) references routines(id) on delete set null;
