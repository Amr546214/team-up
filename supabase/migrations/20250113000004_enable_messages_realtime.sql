-- Migration: Enable realtime for messages table
-- This ensures messages sync instantly between all users in active chats

-- Enable full replica identity for DELETE events to include old row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;

-- Verify realtime is enabled
SELECT pubname, tablename, schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messages';
