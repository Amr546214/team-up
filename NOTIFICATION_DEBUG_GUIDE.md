# Notification Debugging Guide

## Debug Logging Added

The following debug logs have been added to trace notification flow:

### 1. Message Send Flow (`supabaseChatService.ts`)
```
[Message Send] Triggering notifications for message: <messageId>
```

### 2. Message Notification Flow (`chatNotifications.ts`)
```
[Notification Trigger] message_received { messageId, conversationId, senderId, excludeUserIds }
[Notification Trigger] message already notified, skipping
[Notification Trigger] creating notifications for recipients: [ids]
[Notification Trigger] creating notification for recipient: <recipientId>
[Notification Trigger] suppressed — recipient has conversation open
[Notification Trigger] message notification results: X sent, Y failed
```

### 3. Missed Call Flow (`supabaseCallService.ts`)
```
[Calls] Triggering missed call notification for receiver: <receiverId>
```

### 4. Missed Call Notification Flow (`chatNotifications.ts`)
```
[Notification Trigger] call_missed { callId, callerId, receiverId, conversationId, callType }
[Notification Trigger] call already notified, skipping
[Notification Trigger] creating missed call notification for receiver: <receiverId>
[Notification Trigger] suppressed — user has conversation open
[Notification Trigger] missed call notification created: <notificationId>
[Notification Trigger] failed to create missed call notification: <error>
```

### 5. Create Notification (`notificationsService.js`)
```
[Notification Trigger] createNotification called: { userId, type, title, actorId }
[Notification Trigger] missing required fields: { ... }
[Notification Trigger] created successfully: <notificationId>
[Notification Trigger] create failed: <error>
```

## How to Test

### Test 1: Message Received Notification

**Setup:**
1. Open browser console (F12)
2. Log in as User A in Browser 1
3. Log in as User B in Browser 2 (or incognito)
4. Both users should have a conversation between them

**Action:**
1. User A sends a message to User B
2. User B should NOT have the conversation open

**Expected Console Logs (Browser 1 - Sender):**
```
[Message Send] Triggering notifications for message: <uuid>
[Notification Trigger] message_received { messageId: <uuid>, conversationId: <uuid>, senderId: <userA-id>, excludeUserIds: [] }
[Notification Trigger] creating notifications for recipients: [<userB-id>]
[Notification Trigger] creating notification for recipient: <userB-id>
[Notification Trigger] createNotification called: { userId: <userB-id>, type: 'message_received', ... }
[Notification Trigger] created successfully: <notification-uuid>
[Notification Trigger] message notification results: 1 sent, 0 failed
```

**Expected Result (Browser 2 - Receiver):**
- Notification appears in dropdown
- Toast notification shows (if implemented)
- Realtime subscription receives new notification

### Test 2: Missed Call Notification

**Setup:**
1. Open browser console (F12)
2. Log in as User A (caller)
3. Log in as User B (receiver) in another browser/incognito
4. Both should have a conversation

**Action:**
1. User A starts a call to User B
2. User B does NOT answer
3. Wait for timeout (or User A ends call while ringing)

**Expected Console Logs (Browser 1 - Caller):**
```
[Calls] creating call { conversationId: <uuid>, receiverId: <userB-id>, type: 'audio' }
[Calls] created call { id: <call-id>, ... }
... (wait for timeout or manual end) ...
[Calls] marking call missed <call-id>
[Calls] marked missed <call-id>
[Calls] Triggering missed call notification for receiver: <userB-id>
```

**Expected Console Logs (notification trigger):**
```
[Notification Trigger] call_missed { callId: <call-id>, callerId: <userA-id>, receiverId: <userB-id>, ... }
[Notification Trigger] creating missed call notification for receiver: <userB-id>
[Notification Trigger] createNotification called: { userId: <userB-id>, type: 'call_missed', ... }
[Notification Trigger] created successfully: <notification-uuid>
[Notification Trigger] missed call notification created: <notification-uuid>
```

## Common Issues & Solutions

### Issue 1: "No notifications yet" despite no errors

**Check:** RLS Policy on `notifications` table

**Solution:** Add RLS policy to allow authenticated users to insert notifications:

```sql
-- Allow authenticated users to create notifications
CREATE POLICY "Allow authenticated insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Or more restrictive: only allow users to create notifications for themselves
CREATE POLICY "Allow users to create own notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (recipient_id = auth.uid());
```

**Note:** The second policy is more secure but requires the notification trigger to run with service role or the notification is for the recipient themselves (which our frontend notifications are).

### Issue 2: "create failed: new row violates row-level security policy"

**Cause:** RLS is blocking the insert

**Solutions:**
1. Add the RLS policy above
2. Or use service role key for notification creation (backend only)
3. Or disable RLS temporarily for testing:
   ```sql
   ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
   ```

### Issue 3: "message already notified, skipping"

**Cause:** Deduplication is working - message was already processed

**Solution:** This is expected behavior. To test again, send a new message.

### Issue 4: "suppressed — recipient has conversation open"

**Cause:** Notification suppression is working

**Solution:** This is expected. To receive the notification, the recipient should have a different conversation open or be on a different page.

### Issue 5: Notifications not appearing in realtime

**Check:** Realtime subscription is working

**In Browser 2 console, check for:**
```
[Notifications] Subscribing to realtime for user: <userB-id>
[Notifications Realtime] Subscription status: <status>
[Notifications Realtime] New notification: { ... }
```

## Verification Checklist

- [ ] `createNotification` is called with valid UUIDs (not names/emails)
- [ ] RLS policy allows authenticated inserts
- [ ] Realtime subscription is active
- [ ] Message send triggers notification
- [ ] Call missed triggers notification
- [ ] No duplicate notifications for same message/call
- [ ] Sender does not receive their own notification
- [ ] Recipient receives notification when conversation not open
- [ ] Notification appears in dropdown
- [ ] Notification appears in toast (if implemented)

## Files Modified

1. `src/features/notifications/notificationsService.js` - Added debug logging to `createNotification`
2. `src/features/chat/services/chatNotifications.ts` - Added debug logging to `notifyMessageRecipients` and `notifyMissedCall`
3. `src/features/chat/services/supabaseChatService.ts` - Added debug logging when triggering message notifications
4. `src/features/chat/services/supabaseCallService.ts` - Added debug logging when triggering missed call notifications
