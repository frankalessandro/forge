/**
 * Backfill de i18n y taxonomía sobre el catálogo de ejercicios.
 *
 * Para cada ejercicio (sin pisar datos curados a mano):
 *   - name_es          ← traducción por léxico del nombre inglés  (si está null)
 *   - muscle_group_id  ← mapeo desde `target` de ExerciseDB       (si está null)
 *   - category         ← sección en español desde `body_part`     (si viene en inglés)
 *
 * Idempotente: solo escribe donde falta o donde la categoría sigue en inglés.
 *
 * Requisitos en .env.local:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   node --env-file=.env.local scripts/translate-exercises.js               # sólo filas sin name_es
 *   node --env-file=.env.local scripts/translate-exercises.js --retranslate # regenera los auto-generados
 *   node --env-file=.env.local scripts/translate-exercises.js --dry         # sólo reporta
 *
 * --retranslate reescribe name_es donde fue auto-generado, pero NUNCA pisa los
 * nombres curados a mano (se detectan por tener 2+ palabras capitalizadas).
 */

import { createClient } from '@supabase/supabase-js'
import {
  translateExerciseName,
  TARGET_TO_MUSCLE_GROUP,
  BODY_PART_TO_CATEGORY,
} from './exercise-i18n.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY = process.argv.includes('--dry')
const RETRANSLATE = process.argv.includes('--retranslate')

// Un name_es hecho a mano usa Title Case (2+ mayúsculas); los auto-generados
// llevan sólo la inicial en mayúscula.
const isHandwritten = (s) => ((s ?? '').match(/[A-ZÁÉÍÓÚÑ]/g)?.length ?? 0) >= 2

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Categorías válidas en español (para detectar filas ya normalizadas)
const SPANISH_CATEGORIES = new Set(Object.values(BODY_PART_TO_CATEGORY))

async function run() {
  // Mapa nombre de grupo → id
  const { data: groups, error: gErr } = await supabase.from('muscle_groups').select('id, name')
  if (gErr) throw gErr
  const groupId = new Map(groups.map((g) => [g.name, g.id]))

  // Catálogo completo (paginado)
  let rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, name_es, target, body_part, muscle_group_id, category')
      .order('name')
      .range(from, from + 999)
    if (error) throw error
    rows = rows.concat(data)
    if (data.length < 1000) break
    from += 1000
  }
  console.log(`Catálogo: ${rows.length} ejercicios`)

  const updates = []
  let nName = 0
  let nGroup = 0
  let nCat = 0

  for (const ex of rows) {
    const patch = {}

    if (!ex.name_es || (RETRANSLATE && !isHandwritten(ex.name_es))) {
      const es = translateExerciseName(ex.name)
      if (es !== ex.name_es) {
        patch.name_es = es
        nName++
      }
    }

    if (!ex.muscle_group_id && ex.target) {
      const gName = TARGET_TO_MUSCLE_GROUP[ex.target.toLowerCase()]
      const id = gName && groupId.get(gName)
      if (id) {
        patch.muscle_group_id = id
        nGroup++
      }
    }

    if (ex.body_part) {
      const cat = BODY_PART_TO_CATEGORY[ex.body_part.toLowerCase()]
      if (cat && ex.category !== cat && !SPANISH_CATEGORIES.has(ex.category)) {
        patch.category = cat
        nCat++
      }
    }

    if (Object.keys(patch).length) updates.push({ id: ex.id, patch })
  }

  console.log(`A escribir: ${updates.length} filas  (name_es: ${nName}, muscle_group_id: ${nGroup}, category: ${nCat})`)

  if (DRY) {
    console.log('\n--dry: muestra de 25 traducciones')
    updates.slice(0, 25).forEach((u) => {
      const ex = rows.find((r) => r.id === u.id)
      console.log(`  ${ex.name}  →  ${u.patch.name_es ?? '(sin cambio nombre)'}`)
    })
    return
  }

  const CONCURRENCY = 12
  let done = 0
  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const batch = updates.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(({ id, patch }) =>
        supabase.from('exercises').update(patch).eq('id', id).then(({ error }) => {
          if (error) throw error
        }),
      ),
    )
    done += batch.length
    process.stdout.write(`\r  ${done}/${updates.length}`)
  }
  console.log('\n✓ Backfill completo')
}

run().catch((err) => {
  console.error('\n✗ Error:', err.message)
  process.exit(1)
})
