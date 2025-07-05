/*
  # Enhanced Room Features

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references auth.users)
      - `username` (text)
      - `message` (text)
      - `created_at` (timestamp)

  2. Modified Tables
    - `rooms`
      - Add `language` (text)
      - Add `max_participants` (integer)
      - Add `description` (text)
      - Add `auto_delete_at` (timestamp)

  3. Security
    - Enable RLS on messages table
    - Add policies for message access
    - Add function for auto-cleanup

  4. Functions
    - Auto-delete rooms after 5 minutes
    - Clean up old messages
*/

-- Add new columns to rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'language'
  ) THEN
    ALTER TABLE rooms ADD COLUMN language text DEFAULT 'english';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE rooms ADD COLUMN max_participants integer DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'description'
  ) THEN
    ALTER TABLE rooms ADD COLUMN description text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'auto_delete_at'
  ) THEN
    ALTER TABLE rooms ADD COLUMN auto_delete_at timestamptz DEFAULT (now() + interval '5 minutes');
  END IF;
END $$;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Anyone can view messages in active rooms"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = messages.room_id 
      AND rooms.is_active = true
    )
  );

CREATE POLICY "Authenticated users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = messages.room_id 
      AND rooms.is_active = true
    )
  );

CREATE POLICY "Anonymous users can send messages"
  ON messages
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = messages.room_id 
      AND rooms.is_active = true
    )
  );

-- Function to auto-delete expired rooms
CREATE OR REPLACE FUNCTION public.auto_delete_expired_rooms()
RETURNS void AS $$
BEGIN
  -- Delete rooms that have passed their auto_delete_at time
  DELETE FROM rooms 
  WHERE auto_delete_at < NOW()
  OR (created_at < NOW() - INTERVAL '5 minutes' AND participant_count = 0);
  
  -- Delete old messages (older than 24 hours)
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_language ON rooms(language);
CREATE INDEX IF NOT EXISTS idx_rooms_auto_delete ON rooms(auto_delete_at);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Update existing rooms to have auto_delete_at
UPDATE rooms 
SET auto_delete_at = created_at + interval '5 minutes'
WHERE auto_delete_at IS NULL;