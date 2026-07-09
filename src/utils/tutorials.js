import {
  Home, Play, Plus, ClipboardList, CalendarDays, TrendingUp, Dumbbell,
  Search, Info, Check, Clock, GripVertical, Sparkles, Pencil, User,
  HeartPulse, Trophy, Scale, Users, Flame, Moon,
} from 'lucide-react'

/**
 * Contenido de los tutoriales por módulo. La clave es el `module` que recibe
 * <TutorialGuide />. Cada paso: icono (lucide), título y texto corto.
 * `target` (opcional) es un selector CSS: el paso señala ese elemento real
 * de la UI con un spotlight en vez de mostrarse como modal centrado.
 */
export const TUTORIALS = {
  dashboard: {
    title: 'Inicio',
    steps: [
      {
        icon: Home,
        title: 'Bienvenido a FORGE',
        text: 'Este es tu centro de mando: tu racha semanal, lo que toca hoy y accesos rápidos a todo lo demás.',
      },
      {
        icon: CalendarDays,
        title: 'Hoy toca',
        text: 'Si agendaste rutinas por día, aquí verás la de hoy. Tócala para abrirla y empezar directo.',
        target: '[data-tutorial="today-banner"]',
      },
      {
        icon: Play,
        title: 'Empezar entrenamiento',
        text: 'El botón grande inicia un entreno. Si dejaste uno en curso, verás el cronómetro para continuarlo.',
        target: '[data-tutorial="start-workout"]',
      },
      {
        icon: TrendingUp,
        title: 'Esta semana',
        text: 'Entrenos completados, volumen levantado (en toneladas) y tu racha. Toca la racha para ver el detalle.',
        target: '[data-tutorial="week-stats"]',
      },
      {
        icon: Plus,
        title: 'Acciones rápidas',
        text: 'El botón + de la barra inferior abre atajos: entreno libre, desde rutina, explorar ejercicios o registrar tu peso.',
        target: '[data-tutorial="quick-actions"]',
      },
    ],
  },

  routines: {
    title: 'Rutinas',
    steps: [
      {
        icon: ClipboardList,
        title: 'Tus plantillas de entrenamiento',
        text: 'Aquí viven las rutinas: plantillas predefinidas, las generadas según tu objetivo y las que crees tú.',
      },
      {
        icon: Sparkles,
        title: 'Genera tu rutina',
        text: 'Con tu objetivo y días por semana definidos en el perfil, FORGE arma un plan a tu medida con un toque.',
        target: '[data-tutorial="routines-generate"]',
      },
      {
        icon: Plus,
        title: 'Crea la tuya',
        text: 'Con el botón "Crear" armas una rutina desde cero: nombre, color, ejercicios y series objetivo.',
        target: '[data-tutorial="routines-create"]',
      },
      {
        icon: CalendarDays,
        title: 'Agenda semanal',
        text: 'El icono de calendario abre la agenda: asigna una rutina a cada día y el inicio te dirá qué toca hoy.',
        target: '[data-tutorial="routines-schedule"]',
      },
      {
        icon: Pencil,
        title: 'Edita y elimina',
        text: 'Tus rutinas tienen iconos de lápiz y papelera en cada tarjeta para modificarlas o borrarlas.',
        target: '[data-tutorial="routines-mine"]',
      },
    ],
  },

  exercises: {
    title: 'Ejercicios',
    steps: [
      {
        icon: Dumbbell,
        title: 'Catálogo de ejercicios',
        text: 'Cientos de ejercicios organizados por zona muscular y equipamiento, con demostración de cada uno.',
        target: '[data-tutorial="exercise-list"]',
      },
      {
        icon: Search,
        title: 'Busca y filtra',
        text: 'Busca por nombre o combina filtros de zona muscular y equipamiento para encontrar justo lo que necesitas.',
        target: '[data-tutorial="exercise-search"]',
      },
      {
        icon: Info,
        title: 'Detalle del ejercicio',
        text: 'Toca cualquier ejercicio para ver cómo se ejecuta, qué músculos trabaja y tu historial con él.',
        target: '[data-tutorial="exercise-card"]',
      },
      {
        icon: Plus,
        title: 'Agrégalo a una rutina',
        text: 'Con el botón + de cada tarjeta puedes sumar el ejercicio directamente a una de tus rutinas.',
        target: '[data-tutorial="exercise-add"]',
      },
    ],
  },

  workout: {
    title: 'Entreno activo',
    steps: [
      {
        icon: Play,
        title: 'Tu sesión en vivo',
        text: 'Arriba ves el cronómetro y las estadísticas de la sesión: series completadas y volumen acumulado.',
        target: '[data-tutorial="workout-stats"]',
      },
      {
        icon: Plus,
        title: 'Agrega ejercicios',
        text: 'El botón "Ejercicio" de abajo abre el catálogo para sumar ejercicios sobre la marcha.',
        target: '[data-tutorial="workout-add"]',
      },
      {
        icon: Check,
        title: 'Registra tus series',
        text: 'Anota peso (kg) y repeticiones, y marca la serie con ✓. Puedes etiquetarlas como calentamiento, dropset o fallo.',
        target: '[data-tutorial="workout-exercise"]',
      },
      {
        icon: Clock,
        title: 'Descanso automático',
        text: 'Al completar una serie arranca el temporizador de descanso. Puedes sumarle 30s o saltarlo.',
      },
      {
        icon: GripVertical,
        title: 'Reordena y minimiza',
        text: 'Arrastra los ejercicios desde su manija para reordenarlos. El botón − de arriba minimiza el entreno sin perder nada.',
        target: '[data-tutorial="workout-minimize"]',
      },
      {
        icon: Trophy,
        title: 'Finalizar',
        text: 'Al terminar, "Finalizar" guarda la sesión, calcula tus récords y te muestra el resumen.',
        target: '[data-tutorial="workout-finish"]',
      },
    ],
  },

  history: {
    title: 'Progreso',
    steps: [
      {
        icon: TrendingUp,
        title: 'Tu historial',
        text: 'Todas tus sesiones ordenadas por fecha, con duración, ejercicios y kilos totales de cada una.',
      },
      {
        icon: ClipboardList,
        title: 'Detalle de la sesión',
        text: 'Toca una sesión para ver cada ejercicio con sus series, pesos y repeticiones.',
        target: '[data-tutorial="history-session"]',
      },
      {
        icon: Dumbbell,
        title: 'Evolución por ejercicio',
        text: 'Desde el catálogo, cada ejercicio muestra tu historial y cómo ha progresado tu carga.',
      },
    ],
  },

  profile: {
    title: 'Perfil',
    steps: [
      {
        icon: User,
        title: 'Tu perfil',
        text: 'Tus datos físicos, objetivo y nivel de actividad. Manténlos al día: alimentan las rutinas generadas.',
        target: '[data-tutorial="profile-card"]',
      },
      {
        icon: HeartPulse,
        title: 'Métricas de salud',
        text: 'IMC, metabolismo basal y zonas de frecuencia cardíaca calculadas con tus datos (kg y cm).',
        target: '[data-tutorial="profile-metrics"]',
      },
      {
        icon: Trophy,
        title: 'Rango y logros',
        text: 'Entrenar te da XP. Toca la tarjeta de rango para ver tus logros y cuánto falta para subir.',
        target: '[data-tutorial="profile-rank"]',
      },
      {
        icon: Scale,
        title: 'Peso corporal',
        text: 'Registra tu peso periódicamente y sigue tu evolución en la gráfica.',
        target: '[data-tutorial="profile-weight"]',
      },
      {
        icon: Users,
        title: 'Amigos',
        text: 'Desde aquí también llegas a tus amigos para comparar progreso y ver sus entrenamientos.',
        target: '[data-tutorial="profile-friends"]',
      },
    ],
  },

  friends: {
    title: 'Amigos',
    steps: [
      {
        icon: Search,
        title: 'Encuentra a tus amigos',
        text: 'Busca usuarios por nombre y envíales una solicitud de amistad.',
        target: '[data-tutorial="friends-search"]',
      },
      {
        icon: Check,
        title: 'Solicitudes',
        text: 'Las solicitudes entrantes aparecen aquí: acéptalas para conectar.',
        target: '[data-tutorial="friends-requests"]',
      },
      {
        icon: TrendingUp,
        title: 'Compara progreso',
        text: 'Visita el perfil de un amigo para ver su rango, su racha y sus entrenamientos recientes.',
        target: '[data-tutorial="friends-list"]',
      },
    ],
  },

  schedule: {
    title: 'Agenda',
    steps: [
      {
        icon: CalendarDays,
        title: 'Tu semana de entrenamiento',
        text: 'Asigna una rutina a cada día de la semana. Es tu plantilla: se repite semana a semana.',
        target: '[data-tutorial="schedule-week"]',
      },
      {
        icon: Moon,
        title: 'Calendario y descansos',
        text: 'En el calendario puedes cambiar un día puntual sin tocar la plantilla. Los días sin rutina quedan como descanso.',
        target: '[data-tutorial="schedule-month"]',
      },
      {
        icon: Flame,
        title: 'Hoy toca',
        text: 'El inicio te mostrará cada día la rutina agendada, lista para empezar con un toque.',
      },
    ],
  },
}
