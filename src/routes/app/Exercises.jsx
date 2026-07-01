import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Dumbbell } from 'lucide-react'
import { useExercises } from '../../hooks/useExercises'
import { useExerciseStore } from '../../stores/exerciseStore'
import PageHeader from '../../components/ui/PageHeader'
import { BODY_PARTS } from '../../utils/exerciseFilters'

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'kettlebell', 'machine', 'cable',
  'resistance band', 'body weight', 'leverage machine',
]

const EQUIPMENT_LABELS = {
  'barbell': 'Barra',
  'dumbbell': 'Mancuernas',
  'kettlebell': 'Kettlebell',
  'machine': 'Máquina',
  'cable': 'Polea',
  'resistance band': 'Banda',
  'body weight': 'Peso corporal',
  'leverage machine': 'Máquina palanca',
}

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
        active ? 'bg-accent text-ink-950' : 'bg-ink-900 text-zinc-400 border border-ink-700 hover:border-ink-600'
      }`}
    >
      {label}
    </button>
  )
}

export default function Exercises() {
  const { bodyPart, equipment, search, setBodyPart, setEquipment, setSearch } = useExerciseStore()
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput, setSearch])

  const { exercises, loading } = useExercises({ bodyPart, equipment, search })

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Ejercicios" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar ejercicio…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 py-3"
          />
        </div>

        <div className="mb-3">
          <p className="section-title mb-2">Zona muscular</p>
          <div className="flex gap-2 flex-wrap">
            <Pill label="Todos" active={bodyPart === null} onClick={() => setBodyPart(null)} />
            {BODY_PARTS.map((bp) => (
              <Pill
                key={bp.value}
                label={bp.label}
                active={bodyPart === bp.value}
                onClick={() => setBodyPart(bodyPart === bp.value ? null : bp.value)}
              />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="section-title mb-2">Equipamiento</p>
          <div className="flex gap-2 flex-wrap">
            <Pill label="Todos" active={equipment === null} onClick={() => setEquipment(null)} />
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Pill
                key={eq}
                label={EQUIPMENT_LABELS[eq] ?? eq}
                active={equipment === eq}
                onClick={() => setEquipment(equipment === eq ? null : eq)}
              />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 card animate-pulse" />)}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">No se encontraron ejercicios</p>
            <p className="text-sm mt-1 text-zinc-600">Prueba con otros filtros</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {exercises.map((ex) => (
              <Link key={ex.id} to={`/app/exercises/${ex.id}`} className="card card-hover flex gap-3 p-3 items-center">
                {ex.image_url ? (
                  <img
                    src={ex.image_url}
                    alt={ex.name}
                    className="w-16 h-16 rounded-xl object-cover bg-ink-900 shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-ink-900 flex items-center justify-center shrink-0">
                    <Dumbbell size={20} className="text-zinc-700" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="display text-sm text-zinc-100 truncate">{ex.name_es ?? ex.name}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {ex.body_part && <span className="chip-muted capitalize">{ex.body_part}</span>}
                    {ex.equipment && <span className="chip-muted capitalize">{ex.equipment}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
