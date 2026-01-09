# DishRank

A dish-level ranking platform that enables foodies to track, compare, and discover individual dishes across restaurants using an Elo-based comparison system.

## Features

- **Elo-based Rankings**: Compare dishes head-to-head to build accurate rankings
- **4-Step Dish Entry**: Quick and easy dish logging with photo upload
- **Google Places Integration**: Accurate restaurant data from day one
- **Smart Bracketing**: Intelligent comparison selection for faster ranking convergence
- **Offline Support**: Queue entries when offline, sync when back online
- **PWA**: Install on mobile for a native app experience

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + TanStack Query
- **Backend**: Supabase (Postgres, Auth, Storage)
- **APIs**: Google Places Autocomplete
- **PWA**: Vite PWA Plugin + Workbox

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A Google Cloud account (for Places API)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd dish_rank
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Enable Google and Apple auth providers in Authentication > Providers
4. Create a storage bucket called `dish-photos` (set to public)

### 3. Set Up Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Places API
4. Create an API key with Places API access
5. (Optional) Restrict the key to your domain

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_PLACES_API_KEY=your-google-api-key
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── entry/        # Dish entry wizard
│   ├── comparison/   # This-or-that comparison UI
│   ├── leaderboard/  # Rankings display
│   └── layout/       # App shell, navigation
├── pages/            # Route pages
├── hooks/            # Custom React hooks
├── stores/           # Zustand state stores
├── lib/              # Utility functions
│   ├── elo.ts        # Elo algorithm
│   ├── places.ts     # Google Places wrapper
│   ├── fuzzyMatch.ts # Dish deduplication
│   └── supabase.ts   # Supabase client
└── types/            # TypeScript definitions
```

## Key Concepts

### Elo Rating System

Dishes are rated using the Elo system (like chess):
- New dishes start at 1200 (or cuisine category average)
- Dynamic K-factor: 40 for new dishes, down to 16 for established
- Smart bracketing matches dishes with similar ratings

### Canonical Dishes vs User Entries

- **Canonical Dish**: The shared dish entity (e.g., "Carbonara at L'Artusi")
- **User Entry**: Your personal link to a canonical dish (with your photo)
- This allows community-wide Elo while preserving individual entries

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the full schema including:
- `restaurants` - Google Place ID linked
- `cuisine_categories` / `cuisine_subcategories` - Two-level taxonomy
- `canonical_dishes` - Shared dish entities with Elo scores
- `user_dish_entries` - Personal entries linked to canonical dishes
- `comparisons` - Comparison history

## License

MIT
