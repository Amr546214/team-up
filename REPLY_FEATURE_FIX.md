# Reply Feature Fix

This document describes the fix for the WhatsApp-like reply feature to ensure reply metadata is persisted and rendered correctly for both sender and receiver.

## Problem
Reply messages worked visually for the sender, but the receiver saw the same message as a normal message without the reply preview. The reply metadata was not being persisted or not being read/rendered on the receiver side.

## Root Causes
1. **Missing reply columns in select queries** - The Supabase select queries didn't include the reply columns
2. **No payload logging** - Couldn't verify what was being sent to the database
3. **Realtime payload handling** - The realtime handler needed to properly map reply fields

## Changes Made

### 1. Database Migrations
Created migration files in `supabase/migrations/`:
- `20250113000001_add_reply_fields_to_messages.sql` - Adds the reply columns
- `20250113000002_enable_realtime_for_messages.sql` - Enables realtime for messages table

### 2. Supabase Service (supabaseChatService.ts)
- Added `[SEND MESSAGE PAYLOAD]` logging before insert
- Updated select queries to include reply columns:
  - `sendTextMessage()` - Added reply columns to select
  - `sendMediaMessage()` - Added reply columns to select
  - `getConversationMessages()` - Added reply columns to select

### 3. Realtime Handler (useChat.ts)
- Added `[REALTIME MESSAGE RECEIVED]` logging
- Added `[REALTIME REPLY DATA]` logging with reply fields
- Updated message mapping to include both snake_case and camelCase property names:
  ```javascript
  replyToMessageId: row.reply_to_message_id ?? row.replyToMessageId ?? null,
  replyToPreview: row.reply_to_preview ?? row.replyToPreview ?? null,
  replyToSenderName: row.reply_to_sender_name ?? row.replyToSenderName ?? null,
  replyToMessageType: row.reply_to_message_type ?? row.replyToMessageType ?? null,
  ```

### 4. MessageBubble Component
- Added `[MessageBubble] renderReplyBlock` logging to debug reply data

## Testing Steps

1. **Run the migrations** in Supabase SQL Editor:
   ```sql
   -- First migration
   ALTER TABLE public.messages
   ADD COLUMN IF NOT EXISTS reply_to_message_id UUID NULL REFERENCES public.messages(id) ON DELETE SET NULL,
   ADD COLUMN IF NOT EXISTS reply_to_preview TEXT NULL,
   ADD COLUMN IF NOT EXISTS reply_to_sender_name TEXT NULL,
   ADD COLUMN IF NOT EXISTS reply_to_message_type TEXT NULL;

   CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id ON public.messages(reply_to_message_id);
   ```

2. **Enable realtime** (if not already enabled):
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ```

3. **Test the flow**:
   - Open browser console on sender side
   - Open browser console on receiver side
   - Sender: Click Reply on a message, type response, send
   - Check sender console for: `[SEND MESSAGE PAYLOAD]` with reply fields
   - Check receiver console for: `[REALTIME MESSAGE RECEIVED]` with reply fields
   - Check both sides show the reply preview block

## Expected Console Output

### Sender side when sending reply:
```
[SEND MESSAGE PAYLOAD] {
  conversation_id: "...",
  sender_id: "...",
  content: "Reply text",
  type: "text",
  reply_to_message_id: "uuid-of-original-message",
  reply_to_preview: "Original message preview...",
  reply_to_sender_name: "Original Sender",
  reply_to_message_type: "text"
}
[Messages] saved message reply data {
  replyToMessageId: "uuid-of-original-message",
  replyToPreview: "Original message preview...",
  replyToSenderName: "Original Sender",
  replyToMessageType: "text"
}
```

### Receiver side when receiving reply:
```
[REALTIME MESSAGE RECEIVED] {
  id: "...",
  conversation_id: "...",
  sender_id: "...",
  content: "Reply text",
  reply_to_message_id: "uuid-of-original-message",
  reply_to_preview: "Original message preview...",
  reply_to_sender_name: "Original Sender",
  reply_to_message_type: "text",
  ...
}
[REALTIME REPLY DATA] {
  reply_to_message_id: "uuid-of-original-message",
  reply_to_preview: "Original message preview...",
  reply_to_sender_name: "Original Sender",
  reply_to_message_type: "text"
}
[MessageBubble] renderReplyBlock {
  messageId: "...",
  replyToMessageId: "uuid-of-original-message",
  replyToPreview: "Original message preview...",
  replyToSenderName: "Original Sender",
  replyToMessageType: "text"
}
```

## Verification

1. Both sender and receiver should see the reply preview block in the message bubble
2. Reply preview shows sender name and preview text with teal accent bar
3. Clicking reply preview scrolls to original message
4. After page refresh, reply preview is still visible (persisted in database)
