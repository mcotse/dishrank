# Deli App Architecture

## Overview

Deli is a mobile-first PWA for ranking dishes using an Elo rating system. Users add dishes they've eaten, compare them head-to-head, and view community leaderboards.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| Styling | TailwindCSS |
| State (Global) | Zustand |
| State (Server) | TanStack Query (React Query) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| External APIs | Google Places API |
| PWA | vite-plugin-pwa |

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (React PWA)"]
        Pages[Pages]
        Components[Components]
        Hooks[Hooks]
        Stores[Zustand Stores]
        RQ[React Query Cache]
    end

    subgraph External["External Services"]
        Supabase[(Supabase)]
        Google[Google Places API]
        Storage[Supabase Storage]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Stores
    Hooks --> RQ
    RQ --> Supabase
    Hooks --> Google
    Hooks --> Storage
```

---

## Route Structure

```mermaid
flowchart LR
    subgraph Public
        Auth["/auth<br/>AuthPage"]
    end

    subgraph Protected["Protected Routes"]
        Home["/&nbsp;<br/>HomePage"]
        Entry["/entry<br/>EntryPage"]
        Compare["/compare<br/>ComparePage"]
        Leaderboard["/leaderboard<br/>LeaderboardPage"]
        Places["/places<br/>ManagePlacesPage"]
    end

    Auth -->|Login Success| Home
    Home --> Entry
    Home --> Compare
    Home --> Leaderboard
    Home --> Places
    Entry -->|After Submit| Compare
```

---

## Component Hierarchy

```
App
├── AuthProvider (initializes auth state)
├── QueryClientProvider (React Query)
├── Router
│   ├── /auth → AuthPage
│   └── Layout (Header, OfflineIndicator, SyncIndicator, BottomNav)
│       ├── ProtectedRoute
│       │   ├── / → HomePage
│       │   ├── /entry → EntryPage
│       │   │   └── EntryWizard
│       │   │       ├── DishNameStep
│       │   │       ├── RestaurantStep
│       │   │       │   └── CustomPlaceForm
│       │   │       ├── CuisineStep
│       │   │       └── PhotoStep
│       │   ├── /compare → ComparePage
│       │   │   └── ComparisonView
│       │   │       └── ComparisonCard (x2)
│       │   ├── /leaderboard → LeaderboardPage
│       │   │   ├── LeaderboardFilters
│       │   │   └── LeaderboardList
│       │   │       └── LeaderboardItem (xN)
│       │   └── /places → ManagePlacesPage
│       └── BottomNav
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph UI["UI Layer"]
        Page[Page Component]
        Form[Form/Input]
    end

    subgraph State["State Layer"]
        Store[Zustand Store]
        Cache[React Query Cache]
    end

    subgraph Data["Data Layer"]
        Hook[Custom Hook]
        Mutation[useMutation]
        Query[useQuery]
    end

    subgraph Backend["Backend"]
        DB[(Supabase DB)]
        Auth[Supabase Auth]
        S3[Supabase Storage]
    end

    Page --> Hook
    Form --> Store
    Store --> Hook
    Hook --> Query
    Hook --> Mutation
    Query --> Cache
    Cache --> DB
    Mutation --> DB
    Mutation --> S3
    Hook --> Auth
```

---

## State Management

### Zustand Stores

```mermaid
flowchart LR
    subgraph authStore
        A1[user]
        A2[isLoading]
        A3[isAuthenticated]
    end

    subgraph entryStore
        E1[currentStep]
        E2[dishName]
        E3[restaurant]
        E4[customPlace]
        E5[cuisineCategory]
        E6[photo]
        E7[isFusion]
    end

    subgraph offlineStore
        O1[queue]
        O2[isOnline]
        O3[isSyncing]
    end
```

### React Query Keys

| Query Key | Hook | Description |
|-----------|------|-------------|
| `['dishes', 'list', filters]` | `useLeaderboard` | Ranked dishes with filters |
| `['dishes', 'user', userId]` | `useUserDishes` | User's dish entries |
| `['cuisineCategories']` | `useCuisineCategories` | All cuisine categories |
| `['cuisineSubcategories', id]` | `useCuisineSubcategories` | Subcategories for parent |
| `['customPlaces', userId]` | `useCustomPlaces` | User's custom places |
| `['savedHomes', userId]` | `useSavedHomes` | User's saved home locations |

---

## User Flows

### 1. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Auth as AuthPage
    participant Supabase
    participant Email
    participant App

    User->>Auth: Enter email
    Auth->>Supabase: signInWithOtp(email)
    Supabase->>Email: Send magic link
    Email->>User: Magic link email
    User->>Email: Click link
    Email->>App: Redirect with token
    App->>Supabase: Verify token
    Supabase->>App: Session + User
    App->>User: Redirect to HomePage
```

### 2. Add Dish Flow (Entry Wizard)

```mermaid
sequenceDiagram
    actor User
    participant Wizard as EntryWizard
    participant Store as entryStore
    participant Hook as useCreateDish
    participant DB as Supabase

    User->>Wizard: Enter dish name
    Wizard->>Store: setDishName()
    User->>Wizard: Search restaurant

    alt Google Places
        Wizard->>Google: searchRestaurants()
        Google->>Wizard: Place predictions
        User->>Wizard: Select restaurant
    else Custom Place
        User->>Wizard: Select Home Cooking
        Wizard->>DB: Check saved homes
        User->>Wizard: Select/Create home
    end

    Wizard->>Store: setRestaurant/setCustomPlace()
    User->>Wizard: Select cuisine
    Wizard->>Store: setCuisineCategory()
    User->>Wizard: Take/upload photo
    Wizard->>Store: setPhoto()
    User->>Wizard: Submit

    Wizard->>Hook: createDish(entryData)
    Hook->>DB: Upsert restaurant
    Hook->>DB: Find/create canonical dish
    Hook->>DB: Upload photo to storage
    Hook->>DB: Create user_dish_entry
    Hook->>Wizard: Success + dishId
    Wizard->>User: Redirect to Compare
```

### 3. Comparison Flow

```mermaid
sequenceDiagram
    actor User
    participant View as ComparisonView
    participant Hook as useComparison
    participant DB as Supabase

    View->>Hook: Initialize with targetDish
    Hook->>Hook: Generate 4 comparison pairs
    Note over Hook: Smart bracketing by Elo proximity

    loop 4 comparisons
        Hook->>View: Display pair (dishA vs dishB)
        User->>View: Select winner (or skip)
        View->>Hook: selectWinner(winnerId)
        Hook->>Hook: Calculate new Elo ratings
        Hook->>DB: Record comparison
        Hook->>DB: Update dish Elo scores
    end

    Hook->>View: isComplete = true
    View->>User: Show success + options
```

### 4. Offline Sync Flow

```mermaid
sequenceDiagram
    actor User
    participant App
    participant Store as offlineStore
    participant Sync as useOfflineSync
    participant DB as Supabase

    Note over User,DB: User goes offline
    App->>User: Show "You're offline" banner

    User->>App: Add dish / Record comparison
    App->>Store: queueDishEntry() / queueComparison()
    Store->>Store: Persist to localStorage

    Note over User,DB: User comes back online
    App->>User: Show "Syncing..." indicator
    Sync->>Store: getPendingItems()

    loop For each queued item
        Sync->>DB: Process item
        alt Success
            Sync->>Store: removeFromQueue(id)
        else Failure
            Sync->>Store: incrementRetry(id)
            Note over Store: Max 5 retries
        end
    end

    Sync->>App: Invalidate queries
    App->>User: Show synced count
```

---

## Database Schema

```mermaid
erDiagram
    users ||--o{ user_dish_entries : creates
    users ||--o{ comparisons : makes
    users ||--o{ restaurants : "creates (custom)"

    restaurants ||--o{ canonical_dishes : contains

    canonical_dishes ||--o{ user_dish_entries : "linked to"
    canonical_dishes }o--|| cuisine_categories : categorized
    canonical_dishes }o--o| cuisine_subcategories : subcategorized

    cuisine_categories ||--o{ cuisine_subcategories : contains

    comparisons }o--|| canonical_dishes : "dish_a"
    comparisons }o--|| canonical_dishes : "dish_b"
    comparisons }o--o| canonical_dishes : "winner"

    users {
        uuid id PK
        string email
        string display_name
        string avatar_url
        timestamp created_at
    }

    restaurants {
        uuid id PK
        string google_place_id
        string name
        string city
        string address
        boolean is_closed
        boolean is_custom_place
        enum place_type
        string photo_url
        uuid created_by FK
        timestamp created_at
    }

    canonical_dishes {
        uuid id PK
        uuid restaurant_id FK
        string name
        uuid cuisine_category_id FK
        uuid cuisine_subcategory_id FK
        integer community_elo
        integer comparison_count
        uuid created_by FK
        timestamp created_at
    }

    user_dish_entries {
        uuid id PK
        uuid user_id FK
        uuid canonical_dish_id FK
        string photo_url
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    cuisine_categories {
        uuid id PK
        string name
        boolean is_admin_created
        timestamp created_at
    }

    cuisine_subcategories {
        uuid id PK
        uuid parent_id FK
        string name
        timestamp created_at
    }

    comparisons {
        uuid id PK
        uuid user_id FK
        uuid dish_a_id FK
        uuid dish_b_id FK
        uuid winner_id FK
        boolean skipped
        timestamp created_at
    }
```

---

## Elo Rating Algorithm

```mermaid
flowchart TB
    subgraph Input
        A[Dish A Elo: 1250]
        B[Dish B Elo: 1150]
    end

    subgraph Calculate["Calculate Expected Scores"]
        EA["E(A) = 1/(1+10^((1150-1250)/400))<br/>= 0.64"]
        EB["E(B) = 1/(1+10^((1250-1150)/400))<br/>= 0.36"]
    end

    subgraph KFactor["Determine K-Factor"]
        K1["< 10 comparisons: K=40"]
        K2["10-30 comparisons: K=24"]
        K3["> 30 comparisons: K=16"]
    end

    subgraph Result["If A Wins (K=24)"]
        RA["New A = 1250 + 24*(1-0.64)<br/>= 1259"]
        RB["New B = 1150 + 24*(0-0.36)<br/>= 1141"]
    end

    Input --> Calculate
    Calculate --> KFactor
    KFactor --> Result
```

### K-Factor Strategy

| Comparisons | K-Factor | Behavior |
|-------------|----------|----------|
| < 10 | 40 | Volatile - rapid adjustment for new dishes |
| 10-30 | 24 | Stabilizing - moderate adjustments |
| > 30 | 16 | Established - slow, stable changes |

### Cold Start

New dishes start at the average Elo of their cuisine category/subcategory (or 1200 default).

---

## Smart Comparison Bracketing

```mermaid
flowchart LR
    subgraph AllDishes["All User Dishes"]
        D1[Elo: 1400]
        D2[Elo: 1350]
        D3[Elo: 1300]
        D4[Elo: 1250]
        D5[Elo: 1200]
        D6[Elo: 1100]
        D7[Elo: 1000]
    end

    subgraph Target["Target Dish"]
        T[New Dish<br/>Elo: 1280]
    end

    subgraph Candidates["Top 30% by Elo Proximity"]
        C1[D3: 1300]
        C2[D4: 1250]
        C3[D2: 1350]
    end

    subgraph Selected["Random 4 Pairs"]
        P1["Pair 1: Target vs D3"]
        P2["Pair 2: Target vs D4"]
        P3["Pair 3: Target vs D2"]
        P4["Pair 4: Target vs D3"]
    end

    AllDishes --> |Sort by distance| Candidates
    Candidates --> |Random select| Selected
```

---

## File Structure

```
src/
├── components/
│   ├── comparison/
│   │   ├── ComparisonCard.tsx
│   │   └── ComparisonView.tsx
│   ├── entry/
│   │   ├── CuisineStep.tsx
│   │   ├── CustomPlaceForm.tsx
│   │   ├── DishNameStep.tsx
│   │   ├── EntryWizard.tsx
│   │   ├── PhotoStep.tsx
│   │   └── RestaurantStep.tsx
│   ├── leaderboard/
│   │   ├── LeaderboardFilters.tsx
│   │   ├── LeaderboardItem.tsx
│   │   └── LeaderboardList.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── Layout.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── VersionInfo.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useComparison.ts
│   ├── useDishes.ts
│   ├── useOfflineSync.ts
│   └── usePlaces.ts
├── lib/
│   ├── elo.ts
│   ├── fuzzyMatch.ts
│   ├── places.ts
│   └── supabase.ts
├── pages/
│   ├── Auth.tsx
│   ├── Compare.tsx
│   ├── Entry.tsx
│   ├── Home.tsx
│   ├── Leaderboard.tsx
│   └── ManagePlaces.tsx
├── stores/
│   ├── authStore.ts
│   ├── entryStore.ts
│   └── offlineStore.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## PWA Features

| Feature | Implementation |
|---------|----------------|
| Offline Support | Service Worker + Zustand persist |
| Install Prompt | Web App Manifest |
| Icons | pwa-192x192.png, pwa-512x512.png |
| Theme Color | #f97316 (Orange) |
| Display Mode | Standalone |
| Orientation | Portrait |

---

## Security Considerations

- **Authentication**: Supabase magic link (passwordless)
- **Row Level Security**: Supabase RLS policies on all tables
- **Storage**: Authenticated uploads only
- **API Keys**: Google Places key restricted by domain
- **XSS Prevention**: React's built-in escaping
- **HTTPS**: Enforced in production
