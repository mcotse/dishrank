-- DishRank Database Schema
-- Migration: 002_custom_places
-- Add support for custom places (home cooking, food trucks, pop-ups)

-- ============================================
-- CREATE PLACE TYPE ENUM
-- ============================================
CREATE TYPE place_type AS ENUM ('restaurant', 'home', 'food_truck', 'popup', 'other');

-- ============================================
-- ALTER RESTAURANTS TABLE FOR CUSTOM PLACES
-- ============================================

-- Make google_place_id nullable for custom places
ALTER TABLE restaurants ALTER COLUMN google_place_id DROP NOT NULL;

-- Drop the unique constraint on google_place_id and recreate to allow multiple NULLs
ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_google_place_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_google_place_id_unique
  ON restaurants(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- Add new columns for custom places
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_custom_place BOOLEAN DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_type place_type DEFAULT 'restaurant';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for filtering by custom places
CREATE INDEX IF NOT EXISTS idx_restaurants_custom ON restaurants(is_custom_place);
CREATE INDEX IF NOT EXISTS idx_restaurants_place_type ON restaurants(place_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON restaurants(created_by);

-- ============================================
-- UPDATE RLS POLICIES FOR CUSTOM PLACES
-- ============================================

-- Allow users to update their own custom places
CREATE POLICY "Users can update their own custom places"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (is_custom_place = TRUE AND created_by = auth.uid())
  WITH CHECK (is_custom_place = TRUE AND created_by = auth.uid());

-- Allow users to delete their own custom places
CREATE POLICY "Users can delete their own custom places"
  ON restaurants FOR DELETE
  TO authenticated
  USING (is_custom_place = TRUE AND created_by = auth.uid());
