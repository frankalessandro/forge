import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useExercises({ muscleGroupId, equipment, search } = {}) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('exercises')
        .select('id, name, category, equipment, image_url, muscle_group_id, muscle_groups(id, name)')
        .order('name')

      if (muscleGroupId) query = query.eq('muscle_group_id', muscleGroupId)
      if (equipment) query = query.ilike('equipment', `%${equipment}%`)
      if (search) query = query.ilike('name', `%${search}%`)

      const { data, error: err } = await query

      if (!cancelled) {
        if (err) setError(err.message)
        else setExercises(data)
        setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [muscleGroupId, equipment, search])

  return { exercises, loading, error }
}

export function useMuscleGroups() {
  const [muscleGroups, setMuscleGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('muscle_groups')
      .select('id, name, body_area')
      .order('name')
      .then(({ data, error: err }) => {
        if (!cancelled) {
          if (err) setError(err.message)
          else setMuscleGroups(data)
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
