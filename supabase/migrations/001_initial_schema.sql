-- DishRank Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_place_id ON restaurants(google_place_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);

-- ============================================
-- CUISINE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cuisine_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_admin_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common cuisine categories
INSERT INTO cuisine_categories (name, is_admin_created) VALUES
  ('American', true),
  ('Asian', true),
  ('Chinese', true),
  ('French', true),
  ('Indian', true),
  ('Italian', true),
  ('Japanese', true),
  ('Korean', true),
  ('Mediterranean', true),
  ('Mexican', true),
  ('Middle Eastern', true),
  ('Thai', true),
  ('Vietnamese', true),
  ('Seafood', true),
  ('Steakhouse', true),
  ('Vegetarian', true),
  ('Dessert', true),
  ('Breakfast', true),
  ('Fast Food', true),
  ('Other', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CUISINE SUBCATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cuisine_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES cuisine_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, name)
);

-- Index for parent lookup
CREATE INDEX IF NOT EXISTS idx_subcategories_parent ON cuisine_subcategories(parent_id);

-- Seed some subcategories
INSERT INTO cuisine_subcategories (parent_id, name)
SELECT c.id, s.name
FROM cuisine_categories c
CROSS JOIN (
  VALUES
    ('Japanese', 'Sushi'),
    ('Japanese', 'Ramen'),
    ('Japanese', 'Izakaya'),
    ('Italian', 'Pasta'),
    ('Italian', 'Pizza'),
    ('Italian', 'Risotto'),
    ('Chinese', 'Dim Sum'),
    ('Chinese', 'Sichuan'),
    ('Chinese', 'Cantonese'),
    ('Mexican', 'Tacos'),
    ('Mexican', 'Burritos'),
    ('Korean', 'BBQ'),
    ('Korean', 'Fried Chicken'),
    ('American', 'Burgers'),
    ('American', 'BBQ'),
    ('American', 'Southern')
) AS s(category, name)
WHERE c.name = s.category
ON CONFLICT (parent_id, name) DO NOTHING;

-- ============================================
-- CANONICAL DISHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS canonical_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cuisine_category_id UUID REFERENCES cuisine_categories(id) ON DELETE SET NULL,
  cuisine_subcategory_id UUID REFERENCES cuisine_subcategories(id) ON DELETE SET NULL,
  community_elo FLOAT DEFAULT 1200,
  comparison_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, name)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant ON canonical_dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_elo ON canonical_dishes(community_elo DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_cuisine ON canonical_dishes(cuisine_category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_subcategory ON canonical_dishes(cuisine_subcategory_id);
CREATE INDEX IF NOT EXISTS idx_dishes_created_by ON canonical_dishes(created_by);

-- ============================================
-- USER DISH ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_dish_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  canonical_dish_id UUID REFERENCES canonical_dishes(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, canonical_dish_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entries_user ON user_dish_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_dish ON user_dish_entries(canonical_dish_id);
CREATE INDEX IF NOT EXISTS idx_entries_not_deleted ON user_dish_entries(user_id) WHERE is_deleted = FALSE;

-- ============================================
-- COMPARISONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dish_a_id UUID REFERENCES canonical_dishes(id) ON DELETE CASCADE NOT NULL,
  dish_b_id UUID REFERENCES canonical_dishes(id) ON DELETE CASCADE NOT NULL,
  winner_id UUID REFERENCES canonical_dishes(id) ON DELETE CASCADE,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_dish_a ON comparisons(dish_a_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_dish_b ON comparisons(dish_b_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_winner ON comparisons(winner_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisine_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dish_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

-- Restaurants: Anyone can read, authenticated users can insert
CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cuisine categories: Anyone can read
CREATE POLICY "Anyone can view cuisine categories"
  ON cuisine_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON cuisine_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cuisine subcategories: Anyone can read
CREATE POLICY "Anyone can view cuisine subcategories"
  ON cuisine_subcategories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subcategories"
  ON cuisine_subcategories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Canonical dishes: Anyone can read and insert
CREATE POLICY "Anyone can view dishes"
  ON canonical_dishes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert dishes"
  ON canonical_dishes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update dishes"
  ON canonical_dishes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User dish entries: Users can only see/modify their own
CREATE POLICY "Users can view their own entries"
  ON user_dish_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON user_dish_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON user_dish_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comparisons: Users can only see/modify their own
CREATE POLICY "Users can view their own comparisons"
  ON comparisons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comparisons"
  ON comparisons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET FOR PHOTOS
-- ============================================
-- Note: Run this in Supabase SQL editor or via dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('dish-photos', 'dish-photos', true);

-- Storage policies would be set up via Supabase dashboard or:
-- CREATE POLICY "Users can upload their own photos"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'dish-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Anyone can view photos"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'dish-photos');
