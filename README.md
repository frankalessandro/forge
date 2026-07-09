# FORGE

Gym tracking personal y para grupos de amigos.

## Desarrollo

```bash
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
pnpm install
pnpm dev
```

La app queda disponible en http://localhost:5173

## Base de datos

Las migraciones están en `supabase/migrations/`. Para aplicarlas en Supabase Cloud, correr el SQL desde el SQL Editor en https://app.supabase.com.

Para desarrollo local con Supabase CLI:

```bash
supabase init
supabase db reset
```

## Comandos

```bash
pnpm dev        # Dev server
pnpm build      # Build de producción
pnpm preview    # Preview del build
pnpm lint       # Linter
```

## Stack

- React 19 + Vite
- React Router v7 (SPA)
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS v4
- Zod + React Hook Form
- Zustand
- Lucide React
# forge
