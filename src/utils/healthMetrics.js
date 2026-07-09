// Métricas de salud y fitness calculables a partir de los datos del perfil.
// Solo fórmulas reales y reconocidas. Sin nutrición (calorías/macros).
// Unidades: kg y cm — siempre.

// ── Catálogos compartidos (registro + editar perfil) ───────────────────────
export const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
]

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario', desc: 'Poco o nada de ejercicio', factor: 1.2 },
  { value: 'light', label: 'Ligero', desc: '1-3 días por semana', factor: 1.375 },
  { value: 'moderate', label: 'Moderado', desc: '3-5 días por semana', factor: 1.55 },
  { value: 'active', label: 'Activo', desc: '6-7 días por semana', factor: 1.725 },
  { value: 'very_active', label: 'Muy activo', desc: 'Ejercicio intenso a diario', factor: 1.9 },
]

// ── Edad ────────────────────────────────────────────────────────────────────
export function calcAge(birthDate) {
  if (!birthDate) return null
  const b = new Date(birthDate)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age >= 0 && age < 130 ? age : null
}

// ── IMC (índice de masa corporal) ────────────────────────────────────────────
export function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null
  return weightKg / Math.pow(heightCm / 100, 2)
}

export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-sky-300 bg-sky-400/10 border-sky-400/25' }
  if (bmi < 25) return { label: 'Normal', color: 'text-accent bg-accent/10 border-accent/25' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-amber-300 bg-amber-400/10 border-amber-400/25' }
  return { label: 'Obesidad', color: 'text-red-300 bg-red-400/10 border-red-400/25' }
}

// ── TMB / BMR — Mifflin-St Jeor ──────────────────────────────────────────────
// Más precisa que Harris-Benedict para población general.
// Hombre: 10·peso + 6.25·altura − 5·edad + 5
// Mujer:  10·peso + 6.25·altura − 5·edad − 161
export function calcBMR({ weightKg, heightCm, age, gender }) {
  if (!weightKg || !heightCm || age == null || !gender) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (gender === 'male') return base + 5
  if (gender === 'female') return base - 161
  // Mifflin-St Jeor solo define hombre/mujer: para 'other' usamos el promedio
  // de ambos ajustes ((+5 − 161) / 2 = −78) como estimación neutra.
  if (gender === 'other') return base - 78
  return null
}

// ── Frecuencia cardíaca máxima y zonas de entrenamiento ──────────────────────
// FC máx = 220 − edad. Zonas Z1–Z5 como % de la FC máx.
export const HR_ZONES = [
  { zone: 'Z1', name: 'Recuperación', min: 0.5, max: 0.6 },
  { zone: 'Z2', name: 'Aeróbico', min: 0.6, max: 0.7 },
  { zone: 'Z3', name: 'Tempo', min: 0.7, max: 0.8 },
  { zone: 'Z4', name: 'Umbral', min: 0.8, max: 0.9 },
  { zone: 'Z5', name: 'Máximo', min: 0.9, max: 1.0 },
]

export function calcMaxHR(age) {
  if (age == null) return null
  return 220 - age
}

export function calcHRZones(maxHR) {
  if (!maxHR) return []
  return HR_ZONES.map((z) => ({
    ...z,
    low: Math.round(maxHR * z.min),
    high: Math.round(maxHR * z.max),
  }))
}

// ── Rango de peso saludable según altura ─────────────────────────────────────
// Derivado del IMC saludable (18.5 – 24.9) para la altura dada.
export function healthyWeightRange(heightCm) {
  if (!heightCm) return null
  const m2 = Math.pow(heightCm / 100, 2)
  return { min: 18.5 * m2, max: 24.9 * m2 }
}
