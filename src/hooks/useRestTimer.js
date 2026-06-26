import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

// Generates a short beep using the Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // AudioContext not available — silently ignore
  }
}

function vibrate() {
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  } catch {
    // vibration not supported — silently ignore
  }
}

export function useRestTimer() {
  const { defaultRestSeconds, timerSoundEnabled } = useSettingsStore()

  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(defaultRestSeconds)

  const intervalRef = useRef(null)
  const remainingRef = useRef(0)

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsRunning(false)
    setRemaining(0)
    remainingRef.current = 0
  }, [])

  const start = useCallback((seconds) => {
    clearInterval(intervalRef.current)
    const secs = seconds ?? defaultRestSeconds
    setDuration(secs)
    setRemaining(secs)
    remainingRef.current = secs
    setIsRunning(true)

    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1
      setRemaining(remainingRef.current)

      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setIsRunning(false)
        if (timerSoundEnabled) playBeep()
        vibrate()
      }
    }, 1000)
  }, [defaultRestSeconds, timerSoundEnabled])

  const skip = useCallback(() => stop(), [stop])

  const addTime = useCallback((seconds) => {
    const next = remainingRef.current + seconds
    remainingRef.current = next
    setRemaining(next)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  return { remaining, isRunning, duration, start, skip, addTime }
}
