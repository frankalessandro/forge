import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .claude: worktrees temporales de agentes (copias del repo) rompían `pnpm lint`
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Scripts de Node y seeds: corren fuera del browser (acceden a process, etc.)
    files: ['scripts/**/*.{js,jsx}', 'supabase/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
