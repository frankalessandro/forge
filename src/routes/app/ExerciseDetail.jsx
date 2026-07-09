import { useState, lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { Dumbbell, Trophy, TrendingUp, Plus } from 'lucide-react'
import { useExercise, useExerciseVariations } from '../../hooks/useExercises'
import { useExerciseHistory } from '../../hooks/useExerciseHistory'
import ExerciseMedia from '../../components/features/ExerciseMedia'
import AddToRoutineSheet from '../../components/features/AddToRoutineSheet'
import PageHeader from '../../components/ui/PageHeader'
const ProgressChart = lazy(() => import('../../components/features/ProgressChart'))

const METRICS = [
  { key: 'maxWeight', label: 'Peso máx', unit: 'kg' },
  { key: 'est1RM', label: '1RM est.', unit: 'kg' },
  { key: 'volume', label: 'Volumen', unit: 'kg' },
]

function formatDateShort(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 bg-ink-900 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-7 bg-ink-900 rounded-full w-24" />
        <div className="h-7 bg-ink-900 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-ink-900 rounded w-full" />
        <div className="h-4 bg-ink-900 rounded w-5/6" />
        <div className="h-4 bg-ink-900 rounded w-4/6" />
      </div>
    </div>
  )
}

export default function ExerciseDetail() {
  const { id } = useParams()
  const { exercise, loading, error } = useExercise(id)
  const [showAddSheet, setShowAddSheet] = useState(false)

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader
        title="Ejercicio"
        back={true}
        right={
          <button onClick={() => setShowAddSheet(true)} className="btn-ghost text-sm px-2 py-1.5">
            <Plus size={16} />
            Agregar
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-5 py-6">
        {loading && <SkeletonDetail />}
        {error && <p className="text-red-400">Error: {error}</p>}

        {!loading && !error && exercise && (
          <div className="space-y-7">
            <div>
              <h1 className="font-display font-bold uppercase tracking-tight text-3xl text-zinc-100 leading-none mb-3">
                {exercise.name_es ?? exercise.name}
              </h1>
              {exercise.name_es && (
                <p className="text-xs text-zinc-600 -mt-2 mb-3 uppercase tracking-wide">{exercise.name}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {exercise.body_part && <span className="chip-muted capitalize">{exercise.body_part}</span>}
                {exercise.target && <span className="chip-accent capitalize">{exercise.target}</span>}
                {exercise.muscle_groups && <span className="chip-accent">{exercise.muscle_groups.name}</span>}
                {exercise.equipment && (
                  <span className="chip-muted capitalize"><Dumbbell size={12} className="inline mr-0.5" />{exercise.equipment}</span>
                )}
              </div>
            </div>

            <ExerciseMedia imageUrl={exercise.image_url} videoUrl={exercise.video_url} alt={exercise.name} />

            {(exercise.description || exercise.instructions_en) && (
              <div>
                <h2 className="section-title mb-2">Descripción</h2>
                <p className="text-zinc-300 leading-relaxed">
                  {exercise.description || exercise.instructions_en}
                </p>
              </div>
            )}

            {exercise.primary_muscles?.length > 0 && (
              <div>
                <h2 className="section-title mb-2">Músculos principales</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map((m) => <span key={m} className="chip-accent">{m}</span>)}
                </div>
              </div>
            )}

            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <h2 className="section-title mb-2">Músculos secundarios</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m) => <span key={m} className="chip-muted">{m}</span>)}
                </div>
              </div>
            )}

            <VariationsSection exerciseId={id} />

            <ProgressSection exerciseId={id} />
          </div>
        )}

        {!loading && !error && !exercise && <p className="text-zinc-500">Ejercicio no encontrado.</p>}
      </main>

      {showAddSheet && (
        <AddToRoutineSheet exerciseId={id} onClose={() => setShowAddSheet(false)} />
      )}
    </div>
  )
}

function VariationsSection({ exerciseId }) {
  const { variations, loading } = useExerciseVariations(exerciseId)

  if (loading || variations.length === 0) return null

  return (
    <div>
      <h2 className="section-title mb-2">Variaciones</h2>
      <div className="space-y-3">
        {variations.map((v) => (
          <div key={v.id} className="card p-4 space-y-3">
            <div>
              <p className="display text-sm text-zinc-100">{v.name}</p>
              {v.description && <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{v.description}</p>}
            </div>
            <ExerciseMedia imageUrl={v.image_url} videoUrl={v.video_url} alt={v.name} />
          </div>
        ))}
      </div>
    </div>
  )
}

function PRCard({ label, value, unit, highlight }) {
  return (
    <div className={`border rounded-2xl p-4 ${highlight ? 'bg-accent/10 border-accent/25' : 'card'}`}>
      <p className="eyebrow text-zinc-500">{label}</p>
      <p className={`stat-num text-2xl mt-1 ${highlight ? 'text-accent' : 'text-zinc-100'}`}>
        {value.toLocaleString('es')}
        {unit && <span className="text-sm font-semibold text-zinc-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function ProgressSection({ exerciseId }) {
  const { history, prs, loading, error } = useExerciseHistory(exerciseId)
  const [metric, setMetric] = useState('maxWeight')

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="section-title">Progreso</h2>
        <div className="h-48 card animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h2 className="section-title mb-2">Progreso</h2>
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (!prs || history.length === 0) {
    return (
      <div>
        <h2 className="section-title mb-2 flex items-center gap-2">
          <TrendingUp size={16} className="text-zinc-500" />
          Progreso
        </h2>
        <div className="card border-dashed px-6 py-8 text-center">
          <p className="text-sm text-zinc-500">Aún no has registrado este ejercicio.</p>
          <p className="text-xs text-zinc-600 mt-1">Cuando lo entrenes, verás aquí tu evolución y tus records.</p>
        </div>
      </div>
    )
  }

  const active = METRICS.find((m) => m.key === metric)
  const chartData = history.map((h) => ({ date: formatDateShort(h.date), value: h[metric] }))

  return (
    <div className="space-y-5">
      {/* Récords personales */}
      <div>
        <h2 className="section-title mb-2 flex items-center gap-2">
          <Trophy size={16} className="text-accent" />
          Récords personales
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <PRCard label="Peso máximo" value={prs.maxWeight} unit="kg" highlight />
          <PRCard label="1RM estimado" value={prs.max1RM} unit="kg" />
          <PRCard label="Mejor volumen" value={prs.maxVolume} unit="kg" />
          <PRCard label="Sesiones" value={prs.sessions} />
        </div>
      </div>

      {/* Gráfico de progresión */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={16} className="text-zinc-500" />
            Progresión
          </h2>
          <div className="flex gap-1 bg-ink-900 rounded-xl p-1">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                  metric === m.key ? 'bg-accent text-ink-950 font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {history.length > 1 ? (
          <Suspense fallback={<div className="h-[220px] card animate-pulse" />}>
            <ProgressChart
              data={chartData}
              dataKey="value"
              height={220}
              yWidth={40}
              dot
              margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
              tooltipFormatter={(value) => [`${value.toLocaleString('es')} ${active.unit}`, active.label]}
            />
          </Suspense>
        ) : (
          <p className="text-sm text-zinc-500 card px-5 py-6 text-center">
            Registra este ejercicio al menos dos veces para ver la curva de progresión.
          </p>
        )}
      </div>
    </div>
  )
}
