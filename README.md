# FORGE

Gym tracking personal y para grupos de amigos.

## Levantar con Docker (un solo comando)

```bash
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
docker compose up
```

La app queda disponible en http://localhost:5173

## Desarrollo sin Docker

```bash
cp .env.example .env
# Completar variables en .env
pnpm install
pnpm dev
```

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

docker compose up       # Levantar todo
docker compose down     # Bajar todo
docker compose up --build   # Reconstruir y levantar
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
