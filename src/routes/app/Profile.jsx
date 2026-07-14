import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, Info, Users, Pencil, Crown, Check, Palette } from 'lucide-react'
import { sileo } from 'sileo'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { useAchievements } from '../../hooks/useAchievements'
import { useFriends } from '../../hooks/useFriends'
import { rankForXp } from '../../utils/ranks'
import PageHeader from '../../components/ui/PageHeader'
import Sheet from '../../components/ui/Sheet'
import Accordion from '../../components/ui/Accordion'
import RankCard from '../../components/features/RankCard'
import TutorialGuide from '../../components/features/TutorialGuide'
const ProgressChart = lazy(() => import('../../components/features/ProgressChart'))
import {
  ACTIVITY_LEVELS,
  calcAge,
  calcBMI,
  bmiCategory,
  calcBMR,
  calcMaxHR,
  calcHRZones,
  healthyWeightRange,
} from '../../utils/healthMetrics'
import { logError } from '../../utils/logError'
import { ACCENT_COLORS, accentColorFor } from '../../utils/accentColors'
import { applyAccentColor } from '../../utils/applyAccentColor'

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function formatDateShort(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// El verde tiene key null (es el default de index.css, no un color propio),
// pero savingColor necesita un id no-null para distinguir "verde en progreso"
// de "nada guardando".
const GREEN_ID = '__green__'

export default function Profile() {
  const navigate = useNavigate()
  const { getProfile, updateProfile, addBodyStat, getBodyStats } = useProfile()
  const { getCatalog, getUnlocked, checkAndUnlock } = useAchievements()
  const { listFriends } = useFriends()
  const signOut = useAuthStore((s) => s.signOut)

  const { confirm, modal } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [xp, setXp] = useState(0)
  const [friendCount, setFriendCount] = useState(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [bodyStats, setBodyStats] = useState([])
  const [statWeight, setStatWeight] = useState('')
  const [statDate, setStatDate] = useState(todayISO())
  const [statError, setStatError] = useState(null)
  const [savingColor, setSavingColor] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await getProfile()
      if (error) logError('Profile.load', error)
      if (!cancelled && data) setProfile(data)
      if (!cancelled) setLoading(false)
    }
    load()
    loadBodyStats()
    loadRank()
    loadFriendCount()
    return () => { cancelled = true }
    // Carga única al montar; las funciones de carga son estables en la práctica.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadBodyStats() {
    const { data } = await getBodyStats()
    setBodyStats(data ?? [])
  }

  async function loadRank() {
    // Desbloquea retroactivamente lo que corresponda y calcula la XP del rango.
    await checkAndUnlock().catch((err) => logError('Profile.checkAndUnlock', err))
    const [catalog, unlocked] = await Promise.all([getCatalog(), getUnlocked()])
    const have = new Set(unlocked.map((u) => u.achievement_id))
    setXp(catalog.filter((a) => have.has(a.id)).reduce((sum, a) => sum + (a.xp ?? 0), 0))
  }

  async function loadFriendCount() {
    try {
      const friends = await listFriends()
      setFriendCount(friends.length)
    } catch (err) {
      logError('Profile.loadFriendCount', err)
      setFriendCount(null)
    }
  }

  async function handleAddStat(e) {
    e.preventDefault()
    setStatError(null)
    const w = parseFloat(statWeight)
    if (!w || w <= 0) { setStatError('Ingresa un peso válido.'); return }
    const { error } = await addBodyStat(w, statDate ? new Date(statDate).toISOString() : undefined)
    if (error) { logError('Profile.handleAddStat', error); setStatError(error.message); return }
    setStatWeight('')
    setStatDate(todayISO())
    // El peso actual del perfil se sincronizó en addBodyStat: recargar ambos
    // para que IMC/TMB/peso saludable reflejen el registro nuevo al instante.
    await loadBodyStats()
    const { data: fresh } = await getProfile()
    if (fresh) setProfile(fresh)
  }

  async function handleAccentChange(key) {
    const previous = profile?.accent_color ?? null
    setSavingColor(key ?? GREEN_ID)
    applyAccentColor(key) // feedback instantáneo mientras se guarda
    const { error } = await updateProfile({ accent_color: key })
    if (error) {
      logError('Profile.handleAccentChange', error)
      applyAccentColor(previous)
      sileo.error({ title: 'No se pudo cambiar el color', description: error.message })
    } else {
      setProfile((p) => ({ ...p, accent_color: key }))
      sileo.success({ title: 'Color actualizado', description: `Se aplicó ${accentColorFor(key).label} como color principal.` })
    }
    setSavingColor(null)
  }

  async function handleLogout() {
    const ok = await confirm({
      title: '¿Cerrar sesión?',
      description: 'Tendrás que volver a iniciar sesión para acceder a tu cuenta.',
      confirmLabel: 'Cerrar sesión',
      danger: true,
    })
    if (!ok) return
    // scope: 'local' limpia la sesión del cliente sin depender de la red para
    // revocarla en el server. Si eso falla o se cuelga, antes nunca se llegaba
    // al navigate y la app quedaba colgada en la pantalla de perfil.
    try {
      await signOut({ scope: 'local' })
    } catch (err) {
      // seguimos igual: lo importante es sacar al usuario de la sesión local
      logError('Profile.handleLogout', err)
    }
    navigate('/login', { replace: true })
  }

  const weightNum = Number(profile?.weight_kg) || null
  const heightNum = Number(profile?.height_cm) || null
  const age = calcAge(profile?.birth_date)

  const bmi = calcBMI(weightNum, heightNum)
  const bmiInfo = bmi ? bmiCategory(bmi) : null
  const bmr = calcBMR({ weightKg: weightNum, heightCm: heightNum, age, gender: profile?.gender })
  const maxHR = calcMaxHR(age)
  const hrZones = calcHRZones(maxHR)
  const weightRange = healthyWeightRange(heightNum)

  const rank = rankForXp(xp)
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.value === profile?.activity_level)?.label
  const chartData = [...bodyStats].reverse().map((s) => ({ date: formatDateShort(s.recorded_at), weight: Number(s.weight_kg) }))

  return (
    <div className="min-h-screen bg-ink-950">
      {modal}
      <TutorialGuide module="profile" />
      <PageHeader
        title="Mi perfil"
        back="/app/dashboard"
        right={
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-28 card" />
            <div className="h-24 card" />
            <div className="h-64 card" />
          </div>
        ) : (
          <>
            {/* Cabecera */}
            <div className="card p-5 space-y-4" data-tutorial="profile-card">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent flex items-center justify-center">
                      <span className="text-ink-950 text-3xl font-display font-bold">
                        {profile?.name ? profile.name[0].toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-none truncate">
                      {profile?.name || 'Sin nombre'}
                    </p>
                    {profile?.is_premium && (
                      <span className="chip bg-amber-400/15 text-amber-300 shrink-0">
                        <Crown size={12} />
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`chip ${rank.current.bg} ${rank.current.color}`}>{rank.current.name}</span>
                    {activityLabel && <span className="chip-muted">{activityLabel}</span>}
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex items-center gap-3">
                <Link to="/app/friends" data-tutorial="profile-friends" className="btn-dark flex-1 py-2.5 text-sm">
                  <Users size={15} />
                  {friendCount != null ? `${friendCount} amigos` : 'Amigos'}
                </Link>
                <Link to="/app/profile/edit" className="btn-accent flex-1 py-2.5 text-sm">
                  <Pencil size={15} />
                  Editar perfil
                </Link>
              </div>
            </div>

            {/* Personalización — feature premium: elegir el color principal */}
            {profile?.is_premium && (
              <Accordion icon={Palette} title="Personalización" defaultOpen={false}>
                <div className="card p-5 space-y-3">
                  <p className="text-sm text-zinc-500">Elige el color principal de la app.</p>
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map((c) => {
                      const id = c.key ?? GREEN_ID
                      const active = (profile.accent_color ?? null) === c.key
                      const isSaving = savingColor === id
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleAccentChange(c.key)}
                          disabled={savingColor !== null}
                          aria-label={c.label}
                          title={c.label}
                          style={{ backgroundColor: c.base }}
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-shadow disabled:opacity-60 ${
                            active ? 'ring-2 ring-offset-2 ring-offset-ink-900 ring-zinc-100' : ''
                          }`}
                        >
                          {isSaving ? (
                            <span className="w-4 h-4 rounded-full border-2 border-ink-950/40 border-t-ink-950 animate-spin" />
                          ) : active ? (
                            <Check size={16} className="text-ink-950" strokeWidth={3} />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Accordion>
            )}

            {/* Rango — lleva a la vista de logros */}
            <Link to="/app/profile/achievements" className="block" data-tutorial="profile-rank">
              <RankCard xp={xp} interactive />
            </Link>

            {/* Métricas */}
            {(bmiInfo || bmr || maxHR || weightRange) && (
              <div className="space-y-4" data-tutorial="profile-metrics">
                <div className="flex items-center justify-between">
                  <h2 className="section-title">Tus métricas</h2>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-accent transition-colors"
                  >
                    <Info size={14} />
                    ¿Qué significan?
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {bmiInfo && (
                    <div className={`border rounded-2xl p-4 ${bmiInfo.color}`}>
                      <p className="eyebrow opacity-80">IMC</p>
                      <p className="stat-num text-3xl mt-1">{bmi.toFixed(1)}</p>
                      <p className="text-sm font-medium mt-0.5">{bmiInfo.label}</p>
                    </div>
                  )}

                  {bmr && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">TMB (Mifflin-St Jeor)</p>
                      <p className="stat-num text-3xl mt-1 text-zinc-100">{Math.round(bmr)}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">kcal/día en reposo</p>
                    </div>
                  )}

                  {maxHR && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">FC máxima</p>
                      <p className="stat-num text-3xl mt-1 text-zinc-100">{maxHR}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">ppm (220 − edad)</p>
                    </div>
                  )}

                  {weightRange && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">Peso saludable</p>
                      <p className="stat-num text-2xl mt-1 text-zinc-100">
                        {weightRange.min.toFixed(0)}–{weightRange.max.toFixed(0)}
                      </p>
                      <p className="text-sm text-zinc-500 mt-0.5">kg para tu altura</p>
                    </div>
                  )}
                </div>

                {hrZones.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <h3 className="section-title">Zonas de frecuencia cardíaca</h3>
                    <ul className="space-y-1">
                      {hrZones.map((z) => (
                        <li key={z.zone} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-800 last:border-0">
                          <span className="flex items-center gap-2.5">
                            <span className="display text-accent w-7">{z.zone}</span>
                            <span className="text-zinc-400">{z.name}</span>
                          </span>
                          <span className="stat-num text-base text-zinc-100">{z.low}–{z.high} ppm</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-zinc-600">Calculadas como % de tu FC máxima.</p>
                  </div>
                )}
              </div>
            )}

            {/* Registrar peso */}
            <div className="card p-5 space-y-4" data-tutorial="profile-weight">
              <h2 className="section-title">Registrar peso</h2>

              <form onSubmit={handleAddStat} className="flex gap-2">
                <input type="number" step="0.1" value={statWeight} onChange={(e) => setStatWeight(e.target.value)} placeholder="kg" className="input w-24 text-center" />
                <input type="date" value={statDate} onChange={(e) => setStatDate(e.target.value)} className="input flex-1" />
                <button type="submit" className="btn-accent px-4 text-sm shrink-0">Añadir</button>
              </form>

              {statError && <p className="text-xs text-red-400">{statError}</p>}

              {chartData.length > 1 && (
                <Suspense fallback={<div className="h-[200px] card animate-pulse" />}>
                  <ProgressChart data={chartData} dataKey="weight" height={200} />
                </Suspense>
              )}

              {bodyStats.length > 0 ? (
                <ul className="space-y-1">
                  {bodyStats.slice(0, 10).map((s) => (
                    <li key={s.id} className="flex justify-between text-sm text-zinc-300 py-1.5 border-b border-ink-800 last:border-0">
                      <span className="text-zinc-500">{formatDate(s.recorded_at)}</span>
                      <span className="stat-num text-base text-zinc-100">{s.weight_kg} kg</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">Aún no hay registros de peso.</p>
              )}
            </div>
          </>
        )}
      </main>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Qué significan tus métricas">
        <MetricsGuide />
      </Sheet>
    </div>
  )
}

function MetricsGuide() {
  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-5 pb-2">
      <GuideItem title="IMC — Índice de masa corporal">
        Relaciona tu peso con tu altura (peso ÷ altura²). Es una referencia rápida del rango en
        el que está tu peso: bajo peso (&lt;18.5), normal (18.5–25), sobrepeso (25–30) u obesidad
        (&gt;30). No distingue músculo de grasa, así que en personas muy musculosas puede sobrestimar.
      </GuideItem>

      <GuideItem title="TMB — Tasa metabólica basal">
        Las calorías que tu cuerpo gasta en reposo absoluto solo para mantenerte vivo (respirar,
        latir, regular temperatura). La calculamos con la fórmula de <strong>Mifflin-St Jeor</strong>,
        hoy considerada la más precisa para población general. Necesita peso, altura, edad y género.
      </GuideItem>

      <GuideItem title="FC máxima — Frecuencia cardíaca máxima">
        El máximo de pulsaciones por minuto (ppm) que tu corazón puede alcanzar con seguridad.
        La estimamos con la fórmula clásica <strong>220 − edad</strong>. Es la base para definir tus
        zonas de entrenamiento.
      </GuideItem>

      <GuideItem title="Zonas de frecuencia cardíaca (Z1–Z5)">
        Rangos de pulsaciones, calculados como % de tu FC máxima, que indican la intensidad del
        esfuerzo. Te ayudan a entrenar con un objetivo concreto en lugar de “a ciegas”:
        <ul className="mt-2 space-y-1.5">
          <li><span className="display text-accent">Z1</span> · 50–60% — Recuperación, muy suave.</li>
          <li><span className="display text-accent">Z2</span> · 60–70% — Aeróbico, quema de grasa y resistencia base.</li>
          <li><span className="display text-accent">Z3</span> · 70–80% — Tempo, mejora la capacidad aeróbica.</li>
          <li><span className="display text-accent">Z4</span> · 80–90% — Umbral, esfuerzo alto y sostenido.</li>
          <li><span className="display text-accent">Z5</span> · 90–100% — Máximo, sprints e intervalos cortos.</li>
        </ul>
      </GuideItem>

      <GuideItem title="Peso saludable">
        El rango de peso (en kg) que corresponde a un IMC saludable (18.5–24.9) para tu altura.
        Es un objetivo orientativo, no una regla estricta.
      </GuideItem>

      <p className="text-xs text-zinc-600 leading-relaxed">
        Estos valores son estimaciones generales con fines informativos y no sustituyen el
        consejo de un profesional de la salud.
      </p>
    </div>
  )
}

function GuideItem({ title, children }) {
  return (
    <div>
      <h3 className="display text-sm text-zinc-100 mb-1.5">{title}</h3>
      <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
    </div>
  )
}
