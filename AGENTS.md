# DishRank Agent Guidelines

## Tech Stack
- React 18 + Vite + TypeScript
- Tailwind CSS for styling
- Zustand for client state, TanStack Query for server state
- Supabase (Postgres, Auth, Storage)
- Google Places API for restaurant autocomplete

## GitHub Pages Deployment
- Base path `/dishrank/` is set in `vite.config.ts` - all routes are relative to this
- SPA routing uses 404.html redirect trick (see `public/404.html` and script in `index.html`)
- Magic link redirectTo must include `import.meta.env.BASE_URL` for correct redirect

## TypeScript
- Google Maps types require `"google.maps"` in `tsconfig.app.json` types array
- Supabase generated types would go in `src/types/supabase.ts`

## Authentication
- Uses Supabase magic link (OTP), not OAuth
- Auth state split: global store (`authStore`) for user/session, local state in hook for flow state (`magicLinkSent`, `authError`)

## Environment Variables
Required in `.env.local` for local dev and GitHub Secrets for deployment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_PLACES_API_KEY`

## Database
- Migrations in `supabase/migrations/`
- RLS policies are defined in migration files
- Storage bucket `dish-photos` for user uploads
