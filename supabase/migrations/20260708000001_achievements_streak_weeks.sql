-- Unificación de la "racha": la app entera (dashboard, pantalla de racha)
-- cuenta semanas consecutivas cumpliendo la meta de días/semana del usuario,
-- pero los logros de racha usaban días de calendario consecutivos — un
-- estándar imposible (nadie entrena 280 días seguidos) y distinto al número
-- que el usuario ve. Umbrales ahora en semanas, igual que la UI.
update achievements set threshold = 1,  description = '1 semana cumpliendo tu meta de entrenos.'            where id = 'streak_1w';
update achievements set threshold = 5,  description = '5 semanas seguidas cumpliendo tu meta.'              where id = 'streak_5w';
update achievements set threshold = 10, description = '10 semanas seguidas cumpliendo tu meta.'             where id = 'streak_10w';
update achievements set threshold = 20, description = '20 semanas seguidas cumpliendo tu meta.'             where id = 'streak_20w';
update achievements set threshold = 40, description = '40 semanas seguidas cumpliendo tu meta. Leyenda.'    where id = 'streak_40w';
