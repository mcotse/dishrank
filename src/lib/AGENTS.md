# src/lib Agent Guidelines

## places.ts
- Google Places script must be loaded before calling API methods
- Uses `loadGooglePlaces()` which returns a promise - await it before using `searchPlaces()`
- Place predictions return `place_id` which maps to `google_place_id` in restaurants table

## elo.ts
- K-factor is dynamic: 40 (< 10 comparisons) → 24 (< 30) → 16 (30+)
- New dishes start at cuisine average Elo, defaulting to 1200
- `calculateNewElo()` returns both new ratings as a tuple [winnerNew, loserNew]

## supabase.ts
- Client is a singleton, import from here rather than creating new instances
- Auth state changes are handled via `onAuthStateChange` subscription in useAuth hook
