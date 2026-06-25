// Run with: node --env-file=.env supabase/seed/import_exercises.js
// .env must have: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const WGER_BASE = 'https://wger.de/api/v2'

async function fetchAll(url) {
  const results = []
  let next = url
  while (next) {
    const res = await fetch(next)
    if (!res.ok) throw new Error(`wger fetch failed: ${res.status} ${next}`)
    const data = await res.json()
    results.push(...data.results)
    next = data.next
  }
  return results
}

async function run() {
  console.log('Fetching wger data...')

  const [muscles, equipment, categories, exercises] = await Promise.all([
    fetchAll(`${WGER_BASE}/muscle/?format=json`),
    fetchAll(`${WGER_BASE}/equipment/?format=json`),
    fetchAll(`${WGER_BASE}/exercisecategory/?format=json`),
    fetchAll(`${WGER_BASE}/exerciseinfo/?format=json&language=2&limit=100`),
  ])

  console.log(`Fetched: ${muscles.length} muscles, ${equipment.length} equipment, ${categories.length} categories, ${exercises.length} exercises`)

  // --- muscle_groups ---
  const muscleRows = muscles.map((m) => ({
    name: m.name_en || m.name,
    body_area: m.is_front ? 'Anterior' : 'Posterior',
  }))

  const { error: mgError } = await supabase
    .from('muscle_groups')
    .upsert(muscleRows, { onConflict: 'name', ignoreDuplicates: true })

  if (mgError) throw new Error(`muscle_groups upsert: ${mgError.message}`)
  console.log(`Upserted ${muscleRows.length} muscle groups`)

  // Build name → id map for muscle_groups
  const { data: mgRows, error: mgFetchError } = await supabase
    .from('muscle_groups')
    .select('id, name')
  if (mgFetchError) throw new Error(`muscle_groups fetch: ${mgFetchError.message}`)

  const muscleIdByName = Object.fromEntries(mgRows.map((r) => [r.name, r.id]))
  // Also map wger muscle id → name
  const muscleNameById = Object.fromEntries(
    muscles.map((m) => [m.id, m.name_en || m.name])
  )

  // --- exercises ---
  const exerciseRows = []

  for (const ex of exercises) {
    const enTranslation = ex.translations?.find((t) => t.language === 2)
    const name = enTranslation?.name?.trim()
    if (!name) continue

    const description = enTranslation?.description?.replace(/<[^>]*>/g, '').trim() || null

    const category = categories.find((c) => c.id === ex.category?.id)
    const categoryName = category?.name || null

    const primaryMuscles = (ex.muscles || []).map((m) => muscleNameById[m.id] || m.name_en || m.name).filter(Boolean)
    const secondaryMuscles = (ex.muscles_secondary || []).map((m) => muscleNameById[m.id] || m.name_en || m.name).filter(Boolean)

    const primaryMuscleName = primaryMuscles[0] || null
    const muscleGroupId = primaryMuscleName ? muscleIdByName[primaryMuscleName] || null : null

    const equipmentNames = (ex.equipment || [])
      .map((e) => {
        const found = equipment.find((eq) => eq.id === e.id)
        return found?.name || null
      })
      .filter(Boolean)
    const equipmentStr = equipmentNames.join(', ') || null

    exerciseRows.push({
      name,
      description,
      category: categoryName,
      muscle_group_id: muscleGroupId,
      equipment: equipmentStr,
      primary_muscles: primaryMuscles,
      secondary_muscles: secondaryMuscles,
      is_custom: false,
    })
  }

  // Upsert in batches of 100
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < exerciseRows.length; i += BATCH) {
    const batch = exerciseRows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('exercises')
      .upsert(batch, { onConflict: 'name', ignoreDuplicates: true })
    if (error) throw new Error(`exercises upsert batch ${i}: ${error.message}`)
    inserted += batch.length
    console.log(`Upserted exercises: ${inserted}/${exerciseRows.length}`)
  }

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
