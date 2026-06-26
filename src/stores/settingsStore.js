import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    (set) => ({
      defaultRestSeconds: 90,
      timerSoundEnabled: true,

      setDefaultRest: (seconds) => set({ defaultRestSeconds: seconds }),
      toggleTimerSound: () => set((s) => ({ timerSoundEnabled: !s.timerSoundEnabled })),
    }),
    { name: 'forge-settings' }
  )
)
