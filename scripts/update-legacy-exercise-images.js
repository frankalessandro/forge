/**
 * Actualiza image_url y video_url de los 52 ejercicios del catálogo curado original
 * para que apunten al Storage bucket en lugar de raw.githubusercontent.com.
 *
 * Requiere en .env.local:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Prerequisito: haber corrido import-exercise-catalog.js primero (para que
 * las imágenes del dataset ya estén en el bucket exercise-media).
 *
 * Uso:
 *   node --env-file=.env.local scripts/update-legacy-exercise-images.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/exercise-media`

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// Mapa: nombre en DB -> { imagen, gif } del dataset ExerciseDB
const LEGACY_MAP = {
  // Pecho
  'Bench Press':              { img: 'images/0025-EIeI8Vf.jpg', gif: 'videos/0025-EIeI8Vf.gif' },
  'Incline Bench Press':      { img: 'images/0047-3TZduzM.jpg', gif: 'videos/0047-3TZduzM.gif' },
  'Dumbbell Bench Press':     { img: 'images/0289-SpYC0Kp.jpg', gif: 'videos/0289-SpYC0Kp.gif' },
  'Incline Dumbbell Press':   { img: 'images/0314-ns0SIbU.jpg', gif: 'videos/0314-ns0SIbU.gif' },
  'Cable Fly':                { img: 'images/0188-xLYSdtg.jpg', gif: 'videos/0188-xLYSdtg.gif' },
  'Pec Deck Fly':             { img: 'images/1301-wDN97Ca.jpg', gif: 'videos/1301-wDN97Ca.gif' },
  'Push-Up':                  { img: 'images/0662-I4hDWkc.jpg', gif: 'videos/0662-I4hDWkc.gif' },
  'Chest Dip':                { img: 'images/0251-9WTm7dq.jpg', gif: 'videos/0251-9WTm7dq.gif' },
  // Espalda
  'Deadlift':                 { img: 'images/0032-ila4NZS.jpg', gif: 'videos/0032-ila4NZS.gif' },
  'Barbell Bent Over Row':    { img: 'images/0027-eZyBC3j.jpg', gif: 'videos/0027-eZyBC3j.gif' },
  'Lat Pulldown':             { img: 'images/2330-LEprlgG.jpg', gif: 'videos/2330-LEprlgG.gif' },
  'Seated Cable Row':         { img: 'images/0861-fUBheHs.jpg', gif: 'videos/0861-fUBheHs.gif' },
  'Pull-Up':                  { img: 'images/0652-lBDjFxJ.jpg', gif: 'videos/0652-lBDjFxJ.gif' },
  'T-Bar Row':                { img: 'images/1351-FVM1AUZ.jpg', gif: 'videos/1351-FVM1AUZ.gif' },
  'Face Pull':                { img: 'images/0203-wqNPGCg.jpg', gif: 'videos/0203-wqNPGCg.gif' },
  // Hombros
  'Overhead Press':           { img: 'images/1456-wdRZISl.jpg', gif: 'videos/1456-wdRZISl.gif' },
  'Dumbbell Shoulder Press':  { img: 'images/0405-znQUdHY.jpg', gif: 'videos/0405-znQUdHY.gif' },
  'Arnold Press':             { img: 'images/2137-Xy4jlWA.jpg', gif: 'videos/2137-Xy4jlWA.gif' },
  'Lateral Raise':            { img: 'images/0334-DsgkuIt.jpg', gif: 'videos/0334-DsgkuIt.gif' },
  'Front Raise':              { img: 'images/0310-3eGE2JC.jpg', gif: 'videos/0310-3eGE2JC.gif' },
  'Rear Delt Fly':            { img: 'images/2292-mu5Guxt.jpg', gif: 'videos/2292-mu5Guxt.gif' },
  'Upright Row':              { img: 'images/0120-UDlhcO8.jpg', gif: 'videos/0120-UDlhcO8.gif' },
  'Barbell Shrug':            { img: 'images/0095-dG7tG5y.jpg', gif: 'videos/0095-dG7tG5y.gif' },
  // Bíceps
  'Bicep Curl':               { img: 'images/0868-G08RZcQ.jpg', gif: 'videos/0868-G08RZcQ.gif' },
  'Barbell Curl':             { img: 'images/0031-25GPyDY.jpg', gif: 'videos/0031-25GPyDY.gif' },
  'Hammer Curl':              { img: 'images/0313-slDvUAU.jpg', gif: 'videos/0313-slDvUAU.gif' },
  'Preacher Curl':            { img: 'images/0070-qOgPVf6.jpg', gif: 'videos/0070-qOgPVf6.gif' },
  'Concentration Curl':       { img: 'images/0297-gvsWLQw.jpg', gif: 'videos/0297-gvsWLQw.gif' },
  // Tríceps
  'Tricep Pushdown':          { img: 'images/0201-3ZflifB.jpg', gif: 'videos/0201-3ZflifB.gif' },
  'Overhead Tricep Extension':{ img: 'images/1722-1xHyxys.jpg', gif: 'videos/1722-1xHyxys.gif' },
  'Skull Crusher':            { img: 'images/0060-h8LFzo9.jpg', gif: 'videos/0060-h8LFzo9.gif' },
  'Close-Grip Bench Press':   { img: 'images/0030-J6Dx1Mu.jpg', gif: 'videos/0030-J6Dx1Mu.gif' },
  'Tricep Dip':               { img: 'images/1755-bZq4bwK.jpg', gif: 'videos/1755-bZq4bwK.gif' },
  // Piernas
  'Barbell Squat':            { img: 'images/0043-qXTaZnJ.jpg', gif: 'videos/0043-qXTaZnJ.gif' },
  'Front Squat':              { img: 'images/0042-zG0zs85.jpg', gif: 'videos/0042-zG0zs85.gif' },
  'Leg Press':                { img: 'images/0739-10Z2DXU.jpg', gif: 'videos/0739-10Z2DXU.gif' },
  'Leg Extension':            { img: 'images/0585-my33uHU.jpg', gif: 'videos/0585-my33uHU.gif' },
  'Goblet Squat':             { img: 'images/1760-yn8yg1r.jpg', gif: 'videos/1760-yn8yg1r.gif' },
  'Bulgarian Split Squat':    { img: 'images/0099-gGNQmVt.jpg', gif: 'videos/0099-gGNQmVt.gif' },
  'Walking Lunge':            { img: 'images/1460-IZVHb27.jpg', gif: 'videos/1460-IZVHb27.gif' },
  'Romanian Deadlift':        { img: 'images/0085-wQ2c4XD.jpg', gif: 'videos/0085-wQ2c4XD.gif' },
  'Leg Curl':                 { img: 'images/0586-17lJ1kr.jpg', gif: 'videos/0586-17lJ1kr.gif' },
  'Hip Thrust':               { img: 'images/1409-qKBpF7I.jpg', gif: 'videos/1409-qKBpF7I.gif' },
  'Glute Bridge':             { img: 'images/1409-qKBpF7I.jpg', gif: 'videos/1409-qKBpF7I.gif' },
  'Standing Calf Raise':      { img: 'images/0605-ykUOVze.jpg', gif: 'videos/0605-ykUOVze.gif' },
  'Seated Calf Raise':        { img: 'images/0594-bOOdeyc.jpg', gif: 'videos/0594-bOOdeyc.gif' },
  // Core
  'Plank':                    { img: 'images/2135-VBAWRPG.jpg', gif: 'videos/2135-VBAWRPG.gif' },
  'Crunch':                   { img: 'images/0274-TFqbd8t.jpg', gif: 'videos/0274-TFqbd8t.gif' },
  'Hanging Leg Raise':        { img: 'images/0472-I3tsCnC.jpg', gif: 'videos/0472-I3tsCnC.gif' },
  'Cable Crunch':             { img: 'images/0175-WW95auq.jpg', gif: 'videos/0175-WW95auq.gif' },
  'Russian Twist':            { img: 'images/0687-XVDdcoj.jpg', gif: 'videos/0687-XVDdcoj.gif' },
  'Mountain Climber':         { img: 'images/0630-RJgzwny.jpg', gif: 'videos/0630-RJgzwny.gif' },
}

async function run() {
  console.log(`Actualizando ${Object.keys(LEGACY_MAP).length} ejercicios legacy...`)
  console.log(`Storage base: ${STORAGE_BASE}\n`)

  const names = Object.keys(LEGACY_MAP)
  let updated = 0
  let notFound = []

  for (const name of names) {
    const { img, gif } = LEGACY_MAP[name]

    const { data, error: fetchErr } = await supabase
      .from('exercises')
      .select('id, name, image_url')
      .ilike('name', name)
      .single()

    if (fetchErr || !data) {
      notFound.push(name)
      continue
    }

    const { error: updateErr } = await supabase
      .from('exercises')
      .update({
        image_url: `${STORAGE_BASE}/${img}`,
        video_url: `${STORAGE_BASE}/${gif}`,
      })
      .eq('id', data.id)

    if (updateErr) {
      console.error(`✗ ${name}: ${updateErr.message}`)
    } else {
      console.log(`✓ ${name}`)
      updated++
    }
  }

  console.log(`\n✓ ${updated}/${names.length} ejercicios actualizados`)
  if (notFound.length) {
    console.log(`⚠ No encontrados en DB: ${notFound.join(', ')}`)
  }
}

run().catch(err => {
  console.error('\n✗ Error:', err.message)
  process.exit(1)
})
