import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create(
  persist(
    () => ({
      defaultRestSeconds: 90,
      timerSoundEnabled: true,
    }),
    { name: 'forge-settings' }
  )
)
