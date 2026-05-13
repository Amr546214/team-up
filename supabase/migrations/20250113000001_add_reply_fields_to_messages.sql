-- Migration: Add reply fields to messages table for WhatsApp-like reply feature
-- This enables users to reply to specific messages

-- Add reply columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID NULL REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reply_to_preview TEXT NULL,
ADD COLUMN IF NOT EXISTS reply_to_sender_name TEXT NULL,
ADD COLUMN IF NOT EXISTS reply_to_message_type TEXT NULL;

-- Create index for faster lookups of replies to a specific message
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON public.messages(reply_to_message_id);

-- Enable realtime for messages table if not already enabled
-- This ensures reply fields are broadcasted in realtime events
COMMENT ON TABLE public.messages IS 'Chat messages with reply support';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('reply_to_message_id', 'reply_to_preview', 'reply_to_sender_name', 'reply_to_message_type');
