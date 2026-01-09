# DishRank - Product Requirements Document (v1.0)

## 1. Executive Summary

DishRank is a dish-level ranking platform that enables foodies to track, compare, and discover individual dishes across restaurants. Unlike existing platforms (Yelp, Google, Beli) that focus on establishment-level ratings, DishRank uses an Elo-based comparison system to create definitive "best of" lists at the dish level.

**Core Value Proposition:** Answer the question "What's the best carbonara in NYC?" with data-driven, community-powered rankings.

---

## 2. Target Audience

| Segment | Description | Primary Use Case |
|---------|-------------|------------------|
| Power Foodies | Track every meal, curate "Top 10" lists | Personal ranking + discovery |
| Social Diners | Want to see what friends specifically recommend | Friend-filtered recommendations |

---

## 3. Technical Architecture

### 3.1 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React PWA | Cross-platform, installable, offline-capable |
| Backend | Supabase / Firebase | Rapid development, real-time sync, auth built-in |
| Restaurant Data | Google Places API | Unique Place IDs from day one, avoids data debt |
| Auth | Social Only (Google/Apple) | Zero-friction onboarding, no password management |
| Media Storage | Supabase Storage / Firebase Storage | Client-compressed images (~500KB) |

### 3.2 Offline Strategy

**Full offline with sync:**
- Queue dish entries and comparisons locally when offline
- Sync to server when connectivity restored
- Conflict resolution: server wins for canonical dish data, merge for user entries

---

## 4. Data Model

### 4.1 Core Entities

```
User
├── id (UUID)
├── provider_id (Google/Apple ID)
├── display_name
├── avatar_url
├── created_at
└── settings (JSON)

Restaurant (also used for Custom Places)
├── id (UUID)
├── google_place_id (unique, from Places API - NULL for custom places)
├── name
├── city
├── address
├── is_closed (boolean)
├── is_custom_place (boolean, default: false)
├── place_type (enum: restaurant, home, food_truck, popup, other)
├── photo_url (optional, for custom places)
├── created_by (FK User, for custom places)
└── created_at

CanonicalDish
├── id (UUID)
├── restaurant_id (FK)
├── name (normalized)
├── cuisine_category (FK)
├── cuisine_subcategory (FK)
├── community_elo (float, default: cuisine average)
├── comparison_count (int)
├── created_at
└── created_by (FK User)

UserDishEntry
├── id (UUID)
├── user_id (FK)
├── canonical_dish_id (FK)
├── photo_url (optional)
├── location_tag (optional, city-level)
├── is_deleted (boolean, soft delete)
├── created_at
└── updated_at

Comparison
├── id (UUID)
├── user_id (FK)
├── dish_a_id (FK CanonicalDish)
├── dish_b_id (FK CanonicalDish)
├── winner_id (FK CanonicalDish, nullable for skip)
├── skipped (boolean)
├── created_at

Follow
├── follower_id (FK User)
├── following_id (FK User)
├── created_at

CuisineCategory
├── id (UUID)
├── name (e.g., "Asian")
├── is_admin_created (boolean)

CuisineSubcategory
├── id (UUID)
├── parent_id (FK CuisineCategory)
├── name (e.g., "Japanese", "Ramen")
├── is_admin_created (boolean)
```

### 4.2 Data Philosophy

| Principle | Implementation |
|-----------|----------------|
| Shared Canonical Dishes | One "Carbonara at L'Artusi" entity exists; all users contribute to its Elo |
| User-Scoped Entries | Each user has their own entry (with photo) linked to the canonical dish |
| Soft Deletes | Deleted entries hidden from user but retained for Elo integrity |
| User-Generated Taxonomy | Users create cuisine tags; admin cleans up duplicates/inappropriate |

---

## 5. Feature Specifications

### 5.1 Dish Entry System (P0)

#### User Flow

```
[Step 1: Dish Name]
├── Prompt: "What did you eat today?"
├── Text input with auto-capitalize, spellcheck
├── CTA: "Next"
└── Back button: N/A (first step)

[Step 2: Restaurant]
├── Prompt: "Where did you eat it?"
├── Google Places Autocomplete
├── Returns: place_id, name, city, address
├── CTA: "Next"
└── Back button: Return to Step 1

[Step 3: Cuisine Tags] (Optional)
├── Prompt: "What type of food is this?"
├── Two-level picker: Category > Subcategory
├── User can type custom tag (goes to admin review)
├── CTA: "Next" or "Skip"
└── Back button: Return to Step 2

[Step 4: Photo] (Optional)
├── Prompt: "Add a photo"
├── Camera capture or gallery select
├── Client-side compression to ~500KB before upload
├── CTA: "Done" or "Skip"
└── Back button: Return to Step 3

[Fuzzy Match Check]
├── If dish name + restaurant matches existing canonical dish (high confidence):
│   └── Auto-link silently (no user confirmation)
├── If no match:
│   └── Create new CanonicalDish with cuisine-average Elo
└── Proceed to comparison flow
```

#### Required vs Optional Fields

| Field | Required | Notes |
|-------|----------|-------|
| Dish Name | Yes | |
| Restaurant | Yes | Via Google Places API |
| Cuisine Tags | No | Improves filtering |
| Location Tag | No | Derived from restaurant city |
| Photo | No | Improves media gallery |

### 5.2 Elo Ranking Engine (P0)

#### Comparison Trigger

**Batched end-of-session + On-demand:**
- After completing dish entry, user is prompted with 3-5 comparisons
- Comparisons are also accessible via dedicated tab for on-demand ranking
- User can dismiss/skip the post-entry comparison flow

#### Comparison Selection Algorithm (Smart Bracketing)

```python
def select_comparison_dish(new_dish, user_dishes):
    """
    Select a dish to compare against based on Elo proximity.
    Prioritizes dishes with similar Elo scores for tighter ranking resolution.
    """
    candidates = user_dishes.exclude(id=new_dish.id)

    # Sort by Elo distance from new dish
    candidates = sorted(candidates, key=lambda d: abs(d.elo - new_dish.elo))

    # Add randomness to avoid predictable comparisons
    # Pick from top 30% closest Elo scores
    top_candidates = candidates[:max(1, len(candidates) // 3)]
    return random.choice(top_candidates)
```

#### Comparison UI

| Element | Specification |
|---------|---------------|
| Layout | Two cards side by side, tap to select winner |
| Display | Photo-forward (if available), dish name + restaurant below |
| Actions | Tap left card, Tap right card, Skip button |
| Skip | No Elo penalty, moves to next comparison |
| Draw | Not supported (skip instead) |
| Flow | One comparison per full screen, 3-5 in sequence |

#### Elo Calculation

**Dynamic K-Factor:**

```python
def get_k_factor(dish):
    """
    Higher K for new dishes (fast movement), lower for established.
    """
    if dish.comparison_count < 10:
        return 40  # New dish, high volatility OK
    elif dish.comparison_count < 30:
        return 24  # Stabilizing
    else:
        return 16  # Established, slow changes

def calculate_new_elo(winner, loser):
    k_winner = get_k_factor(winner)
    k_loser = get_k_factor(loser)

    expected_winner = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400))
    expected_loser = 1 - expected_winner

    winner.elo += k_winner * (1 - expected_winner)
    loser.elo += k_loser * (0 - expected_loser)

    winner.comparison_count += 1
    loser.comparison_count += 1
```

**Cold Start (New Dish):**
- New dishes inherit the average Elo of their cuisine subcategory
- If no subcategory, use cuisine category average
- If no category, use global average (1200)

#### Re-Rating

Users can re-do comparisons for any dish at any time:
- Navigate to dish detail → "Re-rank this dish"
- Triggers 3-5 new comparisons with smart bracketing
- Old comparisons remain valid; new comparisons add to history

### 5.3 Leaderboard (P0)

#### Views

| View | Description |
|------|-------------|
| Global (Default) | All dishes, all cities, ranked by community Elo |
| Filtered | By cuisine category, subcategory, or city |
| Friends | Dishes ranked only by followed users' comparisons |
| Personal | Your own Elo rankings based on your comparisons |

#### Leaderboard Item Display

```
┌─────────────────────────────────────────┐
│ #1  [Photo]  Carbonara                  │
│              L'Artusi · NYC             │
│              ⚔️ 89% win rate · 47 comparisons │
│              📈 +12 this week           │
└─────────────────────────────────────────┘
```

| Stat | Description |
|------|-------------|
| Win Rate | % of comparisons this dish won |
| Comparison Count | Total comparisons involving this dish |
| Trend | Elo change over past 7 days |

#### Filters

| Filter | Type | Options |
|--------|------|---------|
| Cuisine | Two-level hierarchy | Category → Subcategory |
| City | Single select | Derived from restaurant data |
| View Mode | Toggle | Community / Friends / Personal |

#### Closed Restaurants

Dishes from closed restaurants display a "Closed" badge but remain on leaderboards to preserve historical rankings.

### 5.4 Media Gallery (P1)

#### Layout

- Infinite scroll masonry grid (Pinterest-style)
- Photos sorted by Elo score of associated dish (highest rated first)
- Tap photo → Dish detail view

#### Photo Attribution

Each photo shows:
- Dish name overlay
- Uploader's display name
- Restaurant name

Photos are per-user (not aggregated). If 5 users upload photos for the same canonical dish, all 5 appear separately with attribution.

### 5.5 Search & Filter (P1)

#### Searchable Fields

| Field | Indexed |
|-------|---------|
| Dish name | Yes (full-text) |
| Restaurant name | Yes (full-text) |
| Cuisine category | Yes |
| Cuisine subcategory | Yes |
| City | Yes |

#### Search UX

1. Single search bar at top
2. As-you-type results grouped by type (Dishes, Restaurants, Tags)
3. Tap result → Navigate to dish detail, restaurant page, or filtered leaderboard

### 5.6 Social Features (P1)

#### Following

| Feature | Behavior |
|---------|----------|
| Follow a user | Via share invite link (no contact sync) |
| View friend's profile | Full history visible (all past entries + rankings) |
| Profile visibility | Friends-only (must follow to see) |

#### Invite Links

Each user has a unique invite link: `dishrank.app/u/{username}`
- Visiting link as logged-in user → Send follow request
- Visiting link as guest → Prompt to create account

#### No Push Notifications

v1 launches without push notifications. Users check the app when they want.

### 5.7 Custom Places (P1)

Support for ranking dishes from non-Google-registered locations like home cooking, food trucks, pop-ups, or friends' kitchens.

#### Place Types

| Type | Icon | Description |
|------|------|-------------|
| `home` | 🏠 | Home-cooked meals |
| `food_truck` | 🚚 | Food trucks without Google listing |
| `popup` | 🎪 | Pop-up restaurants, events |
| `other` | 📍 | Any other non-registered location |

#### Custom Place Creation

**Two entry points:**

1. **During dish entry (Step 2):**
   - After searching restaurants, show "Can't find it? Add a custom place"
   - Opens custom place creation flow

2. **Manage Places screen:**
   - Accessible from profile/settings
   - List all user's custom places
   - Edit, delete, or add new places

#### Custom Place Creation Flow

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│                      │    │                      │    │                      │
│  What type of place? │    │  Name this place     │    │  What city?          │
│                      │    │                      │    │                      │
│  ○ Home         🏠   │    │  ┌────────────────┐  │    │  ┌────────────────┐  │
│  ○ Food Truck   🚚   │    │  │ Mom's Kitchen  │  │    │  │ San Francisco  │  │
│  ○ Pop-up       🎪   │    │  └────────────────┘  │    │  └────────────────┘  │
│  ○ Other        📍   │    │                      │    │                      │
│                      │    │  [Optional: Add 📷]  │    │                      │
│      [ Next → ]      │    │      [ Next → ]      │    │      [ Done ✓ ]      │
│                      │    │                      │    │                      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

#### Custom Place Fields

| Field | Required | Notes |
|-------|----------|-------|
| Place Type | Yes | Enum: home, food_truck, popup, other |
| Name | Yes | User-defined (e.g., "Mom's Kitchen", "Taco Truck on 5th") |
| City | Yes | For leaderboard filtering |
| Photo | No | Optional place photo |
| Address | No | Optional, for personal reference |

#### Visibility & Sharing

| Aspect | Behavior |
|--------|----------|
| Public by default | Custom places and their dishes appear in community rankings |
| Display name | Shows user's custom name (e.g., "Mom's Kitchen") |
| Linkable | Other users can add dishes to existing custom places |
| Discovery | Search by name; suggested when similar name+city exists |

#### Linking to Existing Custom Places

When creating a dish at a custom place:

```python
def find_existing_custom_place(name, city):
    """
    Check if a similar custom place already exists.
    """
    existing = CustomPlace.filter(city=city, is_custom_place=True)

    for place in existing:
        similarity = fuzzy_match(name, place.name)
        if similarity > 0.90:
            return place  # Suggest linking to existing

    return None  # Create new
```

If match found:
- Prompt: "Did you mean 'Mom's Kitchen' in San Francisco?"
- User can confirm (link) or create new

#### Leaderboard Filtering

New filter option on leaderboard:

| Filter | Options |
|--------|---------|
| Source | All (default) / Restaurants Only / Homemade Only |

**"Homemade Only"** includes all custom place types (home, food_truck, popup, other).

#### Ranking Behavior

- Custom place dishes compete in the **same Elo pool** as restaurant dishes
- No separate leaderboard; unified rankings
- Filter allows users to isolate restaurant vs homemade if desired
- Custom place dishes use same smart bracketing algorithm

---

## 6. Admin System

### 6.1 Scope (v1)

Minimal admin functionality:

| Feature | Description |
|---------|-------------|
| Dish Merge Queue | Review fuzzy-matched dishes flagged for potential merge |
| Merge Action | Combine two CanonicalDish records into one, reassign all UserDishEntries |
| Reject Action | Mark as "not a match," prevent future flagging |

### 6.2 Fuzzy Match Algorithm

```python
def find_potential_duplicates(new_dish):
    """
    Flag potential duplicates for admin review.
    """
    same_restaurant = CanonicalDish.filter(restaurant_id=new_dish.restaurant_id)

    for existing in same_restaurant:
        similarity = fuzzy_match(new_dish.name, existing.name)  # Levenshtein or similar
        if similarity > 0.85:
            create_merge_flag(new_dish, existing, similarity)
```

Admin reviews flagged pairs and decides to merge or reject.

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target |
|--------|--------|
| Leaderboard load | < 500ms (cached) |
| Search results | < 300ms |
| Image upload | < 3s (post-compression) |
| Offline sync | < 10s when back online |

### 7.2 Scalability Considerations

| Concern | Mitigation |
|---------|------------|
| Elo recalculation | Batch processing, not real-time global recalc |
| Media storage | Client compression mandatory; CDN for delivery |
| Search index | Use Supabase full-text search or Algolia if needed |

---

## 8. Priority Matrix

### P0 (Must Have for Launch)

- [ ] User authentication (Google/Apple social login)
- [ ] Dish entry flow (4 steps)
- [ ] Google Places API integration for restaurants
- [ ] Elo comparison engine with smart bracketing
- [ ] Comparison UI (tap to select, skip option)
- [ ] Basic leaderboard (global view)
- [ ] Cuisine category filtering (two-level)
- [ ] City filtering
- [ ] Offline entry queueing with sync

### P1 (Launch Week)

- [ ] Media gallery (infinite scroll grid)
- [ ] Search (dish name, restaurant, tags)
- [ ] Following users via invite links
- [ ] Friends-only profile visibility
- [ ] Personal vs Community leaderboard toggle
- [ ] Admin merge queue
- [ ] Custom Places (home cooking, food trucks, pop-ups)
- [ ] Leaderboard source filter (All / Restaurants / Homemade)

### P2 (Post-Launch)

- [ ] Video support
- [ ] Push notifications
- [ ] Trending/hot dishes
- [ ] Neighborhood-level location filtering
- [ ] Contact sync for friend discovery
- [ ] Advanced analytics dashboard

---

## 9. Success Metrics

| Metric | Target (Month 1) | Measurement |
|--------|------------------|-------------|
| Dishes entered per user | ≥ 10 | Avg entries / MAU |
| Comparisons per session | ≥ 3 | Avg comparisons when comparison UI is shown |
| Data quality | ≥ 95% | % entries with valid Place ID |
| Retention (D7) | ≥ 30% | Users returning after 7 days |

---

## 10. Launch Strategy

**Open Launch:**
- Public from day one
- No invite codes or waitlist
- All cities supported (not geo-restricted)
- Lean into organic growth via invite links

---

## 11. Open Questions / Future Considerations

1. **Cuisine taxonomy governance:** As user-generated tags grow, need process for admin cleanup
2. **Cross-city comparisons:** Should "Best Pizza in NYC" be comparable to "Best Pizza in LA"?
3. **Restaurant deduplication:** What if same restaurant has multiple Place IDs (chains)?
4. **Elo decay:** Should old comparisons matter less over time? (Currently: no)
5. **API for partners:** Future potential for restaurant partners to embed rankings

---

## Appendix A: Wireframe Reference

### Dish Entry Flow

```
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│                      │    │                      │    │                      │    │                      │
│  What did you eat    │    │  Where did you       │    │  What type of food?  │    │  Add a photo         │
│  today?              │    │  eat it?             │    │                      │    │                      │
│                      │    │                      │    │  [Asian      ▼]      │    │  ┌──────────────┐    │
│  ┌────────────────┐  │    │  ┌────────────────┐  │    │  [Japanese   ▼]      │    │  │              │    │
│  │ Carbonara      │  │    │  │ L'Artusi    🔍 │  │    │                      │    │  │    📷        │    │
│  └────────────────┘  │    │  │ NYC, NY        │  │    │                      │    │  │              │    │
│                      │    │  └────────────────┘  │    │                      │    │  └──────────────┘    │
│                      │    │                      │    │                      │    │                      │
│      [ Next → ]      │    │  [ ← Back ] [Next →] │    │  [ ← Back ] [ Skip ] │    │  [ ← Back ] [ Done ] │
│                      │    │                      │    │                      │    │                      │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

### Comparison UI

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Would you rather eat...                           │
│                                                     │
│   ┌───────────────────┐  ┌───────────────────┐     │
│   │                   │  │                   │     │
│   │   [Photo]         │  │   [Photo]         │     │
│   │                   │  │                   │     │
│   │   Carbonara       │  │   Cacio e Pepe    │     │
│   │   L'Artusi        │  │   Via Carota      │     │
│   │                   │  │                   │     │
│   └───────────────────┘  └───────────────────┘     │
│                                                     │
│                  [ Skip ]                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Leaderboard

```
┌─────────────────────────────────────────────────────┐
│  🏆 Leaderboard                      [Filter 🔽]    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ #1  [📷] Carbonara                          │   │
│  │          L'Artusi · NYC                     │   │
│  │          ⚔️ 89% · 47 comparisons · 📈 +12   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ #2  [📷] Cacio e Pepe                       │   │
│  │          Via Carota · NYC                   │   │
│  │          ⚔️ 85% · 62 comparisons · 📈 +5    │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ #3  [📷] Spicy Ramen                        │   │
│  │          Ippudo · NYC                       │   │
│  │          ⚔️ 82% · 38 comparisons · 📉 -3    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                      ∞ scroll                       │
└─────────────────────────────────────────────────────┘
```

---

*Document Version: 1.1*
*Last Updated: 2026-01-09*
*Author: Product Team*

---

## Changelog

### v1.1 (2026-01-09)
- Added **Custom Places** feature (Section 5.7) for ranking dishes from non-Google-registered locations
- Updated Restaurant entity to support custom places with `is_custom_place`, `place_type`, `photo_url` fields
- Added leaderboard source filter (All / Restaurants / Homemade)
