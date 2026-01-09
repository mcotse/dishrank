import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasValidCredentials = !!(supabaseUrl && supabaseAnonKey)

if (!hasValidCredentials) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// Database types for Supabase client
export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          google_place_id: string
          name: string
          city: string
          address: string | null
          is_closed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
      }
      cuisine_categories: {
        Row: {
          id: string
          name: string
          is_admin_created: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cuisine_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cuisine_categories']['Insert']>
      }
      cuisine_subcategories: {
        Row: {
          id: string
          parent_id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cuisine_subcategories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cuisine_subcategories']['Insert']>
      }
      canonical_dishes: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['canonical_dishes']['Row'], 'id' | 'created_at' | 'community_elo' | 'comparison_count'>
        Update: Partial<Database['public']['Tables']['canonical_dishes']['Insert']> & {
          community_elo?: number
          comparison_count?: number
        }
      }
      user_dish_entries: {
        Row: {
          id: string
          user_id: string
          canonical_dish_id: string
          photo_url: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_dish_entries']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_dish_entries']['Insert']>
      }
      comparisons: {
        Row: {
          id: string
          user_id: string
          dish_a_id: string
          dish_b_id: string
          winner_id: string | null
          skipped: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comparisons']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comparisons']['Insert']>
      }
    }
  }
}
