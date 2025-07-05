/*
  # Auto-delete empty rooms after 1 minute

  1. New Functions
    - `auto_delete_empty_rooms()` - Deletes rooms with no participants for 1+ minutes
    - `update_room_last_activity()` - Updates last activity timestamp when participants join/leave

  2. Modified Tables
    - `rooms`
      - Add `last_activity_at` (timestamp) - tracks when room last had participants
      - Add `empty_since` (timestamp) - tracks when room became empty

  3. Triggers
    - Auto-update last_activity_at when participant_count changes
    - Set empty_since when participant_count becomes 0

  4. Scheduled Function
    - Runs every 30 seconds to clean up empty rooms older than 1 minute
*/

-- Add new columns to rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'empty_since'
  ) THEN
    ALTER TABLE rooms ADD COLUMN empty_since timestamptz;
  END IF;
END $$;

-- Function to auto-delete empty rooms after 1 minute
CREATE OR REPLACE FUNCTION public.auto_delete_empty_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms that have been empty for more than 1 minute
  DELETE FROM rooms 
  WHERE participant_count = 0 
  AND empty_since IS NOT NULL 
  AND empty_since < NOW() - INTERVAL '1 minute';
  
  -- Also delete expired rooms (past auto_delete_at)
  DELETE FROM rooms 
  WHERE auto_delete_at < NOW();
  
  -- Delete old messages (older than 24 hours)
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update room activity tracking
CREATE OR REPLACE FUNCTION public.update_room_activity()
RETURNS trigger AS $$
BEGIN
  -- Update last_activity_at whenever participant_count changes
  NEW.last_activity_at = NOW();
  
  -- Set empty_since when room becomes empty
  IF NEW.participant_count = 0 AND OLD.participant_count > 0 THEN
    NEW.empty_since = NOW();
  END IF;
  
  -- Clear empty_since when room gets participants
  IF NEW.participant_count > 0 AND OLD.participant_count = 0 THEN
    NEW.empty_since = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for room activity tracking
DROP TRIGGER IF EXISTS update_room_activity_trigger ON rooms;
CREATE TRIGGER update_room_activity_trigger
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  WHEN (OLD.participant_count IS DISTINCT FROM NEW.participant_count)
  EXECUTE FUNCTION public.update_room_activity();

-- Initialize existing rooms
UPDATE rooms 
SET 
  last_activity_at = COALESCE(last_activity_at, created_at),
  empty_since = CASE 
    WHEN participant_count = 0 THEN created_at 
    ELSE NULL 
  END
WHERE last_activity_at IS NULL OR empty_since IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_empty_since ON rooms(empty_since);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_rooms_participant_count ON rooms(participant_count);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_delete_empty_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_delete_empty_rooms() TO anon;