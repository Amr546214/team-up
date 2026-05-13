-- Migration: Enable realtime for message_reactions table
-- This ensures reactions sync instantly between all users

-- Enable full replica identity for DELETE events to include old row data
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;

-- Add message_reactions table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END;
$$;

-- Verify realtime is enabled
SELECT pubname, tablename, schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'message_reactions';
