/**
 * Importa el catálogo de ejercicios de ExerciseDB a Supabase.
 *
 * Qué hace:
 *   1. Sube images/ y videos/ al Storage bucket "exercise-media"
 *   2. Upsert de los 1,324 ejercicios a la tabla exercises
 *      — Ejercicios que ya existen por nombre: actualiza campos nuevos (body_part,
 *        instructions_en, target, source_id, image_url, video_url)
 *      — Ejercicios nuevos: insert
 *
 * Requisitos en .env.local:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Dataset esperado en: ../../exercises-dataset/
 *   data/exercises.json
 *   images/
 *   videos/
 *
 * Uso:
 *   node --env-file=.env.local scripts/import-exercise-catalog.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATASET_DIR = join(__dirname, '../../exercises-dataset')
const BUCKET = 'exercise-media'
const UPLOAD_CONCURRENCY = 8

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan variables de entorno: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  console.error('Agregá SUPABASE_SERVICE_ROLE_KEY a .env.local (Settings > API en Supabase)')
  process.exit(1)
}

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Helpers ─────────────────────────────────────────────────

function log(msg) { process.stdout.write(msg) }
function logline(msg) { console.log(msg) }

async function uploadFile(localPath, storagePath, retries = 4) {
  if (!existsSync(localPath)) return

  const buffer = readFileSync(localPath)
  const isGif  = localPath.endsWith('.gif')
  const contentType = isGif ? 'image/gif' : 'image/jpeg'

  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: false })

    if (!error || error.message.includes('already exists')) return

    const isRetryable = error.message.includes('Timeout') ||
                        error.message.includes('timeout') ||
                        error.message.includes('Gateway') ||
                        error.message.includes('network') ||
                        error.message.includes('fetch')

    if (!isRetryable || attempt === retries) {
      throw new Error(`Upload ${storagePath}: ${error.message}`)
    }

    await new Promise(r => setTimeout(r, attempt * 2000))
  }
}

async function runInBatches(items, fn, concurrency) {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn))
    const done = Math.min(i + concurrency, items.length)
    log(`\r  ${done}/${items.length}`)
  }
  logline('')
}

// ── 1. Upload media ──────────────────────────────────────────

async function uploadMedia(exercises) {
  logline('▸ Subiendo media a Supabase Storage...')

  const files = []
  for (const ex of exercises) {
    if (ex.image)   files.push({ local: join(DATASET_DIR, ex.image),   storage: ex.image })
    if (ex.gif_url) files.push({ local: join(DATASET_DIR, ex.gif_url), storage: ex.gif_url })
  }

  logline(`  ${files.length} archivos (imágenes + GIFs)`)
  await runInBatches(files, ({ local, storage }) => uploadFile(local, storage), UPLOAD_CONCURRENCY)
  logline('  ✓ Media subida')
}

// ── 2. Upsert exercises ──────────────────────────────────────

function buildRow(ex, existingId = null) {
  const instrEn =
    ex.instructions?.en ||
    (Array.isArray(ex.instruction_steps?.en) ? ex.instruction_steps.en.join(' ') : '') ||
    ''

  const primaryMuscles   = ex.muscle_group ? [ex.muscle_group] : []
  const secondaryMuscles = Array.isArray(ex.secondary_muscles) ? ex.secondary_muscles : []

  const row = {
    source_id:        ex.id,
    body_part:        ex.body_part || null,
    instructions_en:  instrEn || null,
    target:           ex.target || null,
    primary_muscles:  primaryMuscles,
    secondary_muscles: secondaryMuscles,
    image_url:        ex.image   ? `${STORAGE_BASE}/${ex.image}`   : null,
    video_url:        ex.gif_url ? `${STORAGE_BASE}/${ex.gif_url}` : null,
  }

  row.name = ex.name

  if (existingId) {
    row.id = existingId
  } else {
    row.category  = ex.body_part || null
    row.equipment = ex.equipment || null
    row.is_custom = false
  }

  return row
}

async function upsertExercises(exercises) {
  logline('▸ Leyendo ejercicios existentes...')

  const { data: existing, error: fetchErr } = await supabase
    .from('exercises')
    .select('id, name')

  if (fetchErr) throw fetchErr

  const byName = new Map(existing.map(e => [e.name.toLowerCase(), e.id]))
  logline(`  ${existing.length} ejercicios en DB`)

  const toUpdate = []
  const toInsert = []

  for (const ex of exercises) {
    const existingId = byName.get(ex.name.toLowerCase())
    if (existingId) {
      toUpdate.push(buildRow(ex, existingId))
    } else {
      toInsert.push(buildRow(ex))
    }
  }

  // Deduplicar por nombre (el dataset tiene entradas repetidas)
  const seenNames = new Set(existing.map(e => e.name.toLowerCase()))
  const deduped = []
  for (const row of toInsert) {
    const key = row.name.toLowerCase()
    if (!seenNames.has(key)) { seenNames.add(key); deduped.push(row) }
  }
  toInsert.length = 0
  toInsert.push(...deduped)

  logline(`  ${toUpdate.length} a actualizar, ${toInsert.length} a insertar`)

  // Update ejercicios existentes (update individual por id, evita conflictos de unique constraints)
  if (toUpdate.length > 0) {
    logline('▸ Actualizando ejercicios existentes...')
    const CONCURRENCY = 10
    let done = 0
    for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
      const batch = toUpdate.slice(i, i + CONCURRENCY)
      await Promise.all(batch.map(({ id, ...data }) =>
        supabase.from('exercises').update(data).eq('id', id).then(({ error }) => {
          if (error) throw error
        })
      ))
      done += batch.length
      log(`\r  ${done}/${toUpdate.length}`)
    }
    logline('\n  ✓ Actualizados')
  }

  // Insert ejercicios nuevos
  if (toInsert.length > 0) {
    logline('▸ Insertando ejercicios nuevos...')
    const BATCH = 100
    let done = 0
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH)
      const { error } = await supabase.from('exercises').upsert(batch, { onConflict: 'name' })
      if (error) throw error
      done += batch.length
      log(`\r  ${done}/${toInsert.length}`)
    }
    logline('\n  ✓ Insertados')
  }
}

// ── Main ─────────────────────────────────────────────────────

async function run() {
  const skipMedia = process.argv.includes('--skip-media')

  const jsonPath = join(DATASET_DIR, 'data/exercises.json')
  if (!existsSync(jsonPath)) {
    console.error(`No se encontró el dataset en: ${jsonPath}`)
    process.exit(1)
  }

  const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
  logline(`Dataset cargado: ${exercises.length} ejercicios`)
  logline(`Storage base URL: ${STORAGE_BASE}`)
  logline('')

  if (!skipMedia) {
    await uploadMedia(exercises)
    logline('')
  } else {
    logline('⏭  Media skipeada (--skip-media)')
    logline('')
  }

  await upsertExercises(exercises)

  logline('')
  logline('✓ Importación completa')
}

run().catch(err => {
  console.error('\n✗ Error:', err.message)
  process.exit(1)
})
