-- Migration: Enable realtime for messages table
-- This ensures all message changes (including replies) are broadcasted to clients

-- Enable realtime for the messages table
-- This is required for Supabase to broadcast INSERT/UPDATE/DELETE events
BEGIN;

-- Check if messages table is in the realtime publication
DO $$
BEGIN
    -- Add messages table to supabase_realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END
$$;

-- Verify realtime is enabled
SELECT pubname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages';

COMMIT;
