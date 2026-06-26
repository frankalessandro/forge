import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ── Caché de catálogo (estático durante la sesión) ───────────────────────────
// El catálogo de ejercicios y los grupos musculares son datos de seed que no
// cambian. Antes se refetcheaban en cada montaje de Exercises/ExercisePicker
// y en cada cambio de filtro. Ahora se descargan una sola vez, se cachean en
// memoria y el filtrado (músculo, equipo, búsqueda) se hace en cliente: cero
// round-trips al abrir el picker o teclear en el buscador.
let catalogCache = null
let catalogPromise = null
let muscleGroupsCache = null
let muscleGroupsPromise = null

function loadCatalog() {
  if (catalogCache) return Promise.resolve(catalogCache)
  if (!catalogPromise) {
    catalogPromise = supabase
      .from('exercises')
      .select('id, name, name_es, category, equipment, image_url, muscle_group_id, muscle_groups(id, name)')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          catalogPromise = null // permitir reintento tras un fallo
          throw new Error(error.message)
        }
        catalogCache = data ?? []
        return catalogCache
      })
  }
  return catalogPromise
}

function loadMuscleGroups() {
  if (muscleGroupsCache) return Promise.resolve(muscleGroupsCache)
  if (!muscleGroupsPromise) {
    muscleGroupsPromise = supabase
      .from('muscle_groups')
      .select('id, name, body_area')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          muscleGroupsPromise = null
          throw new Error(error.message)
        }
        muscleGroupsCache = data ?? []
        return muscleGroupsCache
      })
  }
  return muscleGroupsPromise
}

export function useExercises({ muscleGroupId, equipment, search } = {}) {
  const [all, setAll] = useState(catalogCache)
  const [loading, setLoading] = useState(!catalogCache)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Caché caliente: el estado ya quedó sembrado por los useState() de arriba,
    // no hace falta tocar nada (evita setState síncrono dentro del efecto).
    if (catalogCache) return
    let cancelled = false
    loadCatalog()
      .then((data) => {
        if (!cancelled) {
          setAll(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  // Filtrado en cliente: instantáneo, replica el comportamiento de las queries
  // server-side anteriores (eq muscle_group_id, ilike equipment, ilike name/name_es).
  const exercises = useMemo(() => {
    const list = all ?? []
    const term = search?.trim().toLowerCase()
    const eq = equipment?.toLowerCase()
    return list.filter((ex) => {
      if (muscleGroupId && ex.muscle_group_id !== muscleGroupId) return false
      if (eq && !(ex.equipment ?? '').toLowerCase().includes(eq)) return false
      if (term) {
        const inName = (ex.name ?? '').toLowerCase().includes(term)
        const inEs = (ex.name_es ?? '').toLowerCase().includes(term)
        if (!inName && !inEs) return false
      }
      return true
    })
  }, [all, muscleGroupId, equipment, search])

  return { exercises, loading, error }
}

export function useMuscleGroups() {
  const [muscleGroups, setMuscleGroups] = useState(muscleGroupsCache ?? [])
  const [loading, setLoading] = useState(!muscleGroupsCache)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (muscleGroupsCache) return
    let cancelled = false
    loadMuscleGroups()
      .then((data) => {
        if (!cancelled) {
          setMuscleGroups(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  return { muscleGroups, loading, error }
}

export function useExercise(id) {
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    supabase
      .from('exercises')
      .select('*, muscle_groups(id, name, body_area)')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (!cancelled) {
          if (err) setError(err.message)
          else setExercise(data)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [id])

  return { exercise, loading, error }
}

export function useExerciseVariations(exerciseId) {
  const [variations, setVariations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId) return
    let cancelled = false

    supabase
      .from('exercise_variations')
      .select('id, name, description, image_url, video_url')
      .eq('exercise_id', exerciseId)
      .order('sort_order')
      .then(({ data }) => {
        if (!cancelled) {
          setVariations(data ?? [])
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [exerciseId])

  return { variations, loading }
}
