/*
  # Update Room Deletion Policy

  1. Changes
    - Remove 5-minute inactivity deletion condition
    - Keep only 1-minute empty room deletion
    - Update auto_delete_expired_rooms function
    - Add language_level column if not exists

  2. Functions
    - Update auto_delete_empty_rooms to only handle empty rooms and expired rooms
    - Remove inactivity-based deletion logic

  3. Indexes
    - Ensure proper indexing for performance
*/

-- Add language_level column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'language_level'
  ) THEN
    ALTER TABLE rooms ADD COLUMN language_level text DEFAULT 'any';
  END IF;
END $$;

-- Update the auto-delete function to remove 5-minute inactivity condition
CREATE OR REPLACE FUNCTION public.auto_delete_empty_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms that have been empty for more than 1 minute
  DELETE FROM rooms 
  WHERE participant_count = 0 
  AND empty_since IS NOT NULL 
  AND empty_since < NOW() - INTERVAL '1 minute';
  
  -- Delete expired rooms (past auto_delete_at) - this is for the general room expiration
  DELETE FROM rooms 
  WHERE auto_delete_at < NOW();
  
  -- Delete old messages (older than 24 hours)
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for language_level if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rooms_language_level ON rooms(language_level);

-- Update existing rooms to have language_level if null
UPDATE rooms 
SET language_level = 'any' 
WHERE language_level IS NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_delete_empty_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_delete_empty_rooms() TO anon;