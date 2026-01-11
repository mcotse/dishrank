// Database types matching Supabase schema

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

// Place type enum for custom places
export type PlaceType = 'restaurant' | 'home' | 'food_truck' | 'popup' | 'other'

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  restaurant: 'Restaurant',
  home: 'Home',
  food_truck: 'Food Truck',
  popup: 'Pop-up',
  other: 'Other',
}

export const PLACE_TYPE_ICONS: Record<PlaceType, string> = {
  restaurant: '🍽️',
  home: '🏠',
  food_truck: '🚚',
  popup: '🎪',
  other: '📍',
}

export interface Restaurant {
  id: string
  google_place_id: string | null
  name: string
  city: string
  address: string | null
  is_closed: boolean
  is_custom_place: boolean
  place_type: PlaceType
  photo_url: string | null
  created_by: string | null
  created_at: string
}

export interface CuisineCategory {
  id: string
  name: string
  is_admin_created: boolean
  created_at: string
}

export interface CuisineSubcategory {
  id: string
  parent_id: string
  name: string
  created_at: string
}

export interface CanonicalDish {
  id: string
  restaurant_id: string
  name: string
  cuisine_category_id: string | null
  cuisine_subcategory_id: string | null
  community_elo: number
  comparison_count: number
  created_by: string | null
  created_at: string
}

export interface UserDishEntry {
  id: string
  user_id: string
  canonical_dish_id: string
  photo_url: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Comparison {
  id: string
  user_id: string
  dish_a_id: string
  dish_b_id: string
  winner_id: string | null
  skipped: boolean
  created_at: string
}

// Extended types with joins for frontend use

export interface DishWithDetails extends CanonicalDish {
  restaurant: Restaurant
  cuisine_category: CuisineCategory | null
  cuisine_subcategory: CuisineSubcategory | null
  user_entry?: UserDishEntry
  win_rate?: number
  trend?: number
}

export interface LeaderboardDish extends DishWithDetails {
  rank: number
  photo_url: string | null
}

// Entry wizard state
export interface DishEntryData {
  dishName: string
  restaurant: {
    google_place_id: string
    name: string
    city: string
    address: string
  } | null
  customPlace: {
    name: string
    city: string
    place_type: PlaceType
    address?: string
    photoFile?: File | null
    photoPreview?: string | null
  } | null
  isCustomPlace: boolean
  cuisineCategory: CuisineCategory | null
  cuisineSubcategory: CuisineSubcategory | null
  // Fusion support - additional cuisines when dish is a fusion
  isFusion: boolean
  fusionCategories: CuisineCategory[]
  photoFile: File | null
  photoPreview: string | null
}

// Custom place creation data
export interface CustomPlaceData {
  name: string
  city: string
  place_type: PlaceType
  address?: string
  photo_url?: string
}

// Comparison types
export interface ComparisonPair {
  dishA: DishWithDetails
  dishB: DishWithDetails
}

// Offline queue types
export interface OfflineQueueItem {
  id: string
  type: 'dish_entry' | 'comparison'
  data: unknown
  createdAt: number
  retryCount: number
}

// Google Places types
export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

// Filter types
export type SourceFilter = 'all' | 'restaurants' | 'homemade'

export interface LeaderboardFilters {
  cuisineCategoryId: string | null
  cuisineSubcategoryId: string | null
  city: string | null
  viewMode: 'community' | 'personal' | 'friends'
  source: SourceFilter
}
