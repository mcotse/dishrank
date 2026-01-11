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

## Versioning
- Version injected at build time via Vite `define` config
- Globals: `__APP_VERSION__`, `__BUILD_NUMBER__`, `__COMMIT_HASH__`, `__BUILD_TIME__`
- TypeScript declarations in `src/vite-env.d.ts`
- Auto version bump: GitHub Action bumps patch version after each commit
- Skip auto-bump by adding `[skip-version]` to commit message

## Git Workflow
- Always pull from origin before pushing: `git pull --rebase && git push`
- GitHub Actions auto-bump version after each commit, so remote will have new commits
- This avoids push rejections due to automated commits

## Custom Places
- Restaurants table supports both Google Places and custom places
- `is_custom_place` boolean distinguishes between types
- `place_type` enum: restaurant, home, food_truck, popup, other
- Custom places have nullable `google_place_id`
- Entry wizard can switch between restaurant search and custom place form
- Leaderboard has source filter: All / Restaurants / Homemade

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
