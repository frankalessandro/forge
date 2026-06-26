import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Separamos los vendors grandes y estables en chunks propios: cambian
        // poco entre deploys, así el navegador los reutiliza desde caché en
        // lugar de re-descargar todo el bundle cada vez que tocamos la app.
        // (recharts no se lista: ya va en su propio chunk async vía lazy()).
        // Rolldown (Vite 8) exige manualChunks como función.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
})
