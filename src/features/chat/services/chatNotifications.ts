/**
 * Chat Message Notifications
 *
 * Creates in-app notifications when a message is sent in a conversation.
 * Notifications are NOT created if the recipient currently has the
 * conversation open or if the sender is messaging themselves.
 *
 * Fire-and-forget — errors are logged but never block the send flow.
 *
 * @module features/chat/services/chatNotifications
 */

import { supabase } from '../../../lib/supabase';
import { createNotification } from '../../notifications';

// ---------------------------------------------------------------------------
// Active conversation tracking
// ---------------------------------------------------------------------------
// The chat UI sets this when a conversation is opened/closed.
// Used to suppress notifications for the conversation the user is viewing.
let _activeConversationId: string | null = null;

export function setActiveConversationForNotifications(id: string | null) {
  _activeConversationId = id;
}

export function getActiveConversationForNotifications(): string | null {
  return _activeConversationId;
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------
// Keep a small set of recently-notified message IDs to guard against
// double-fire from optimistic + realtime flows.
const _recentlyNotifiedMessageIds = new Set<string>();
const MAX_RECENT = 200;

function markAsNotified(messageId: string) {
  _recentlyNotifiedMessageIds.add(messageId);
  if (_recentlyNotifiedMessageIds.size > MAX_RECENT) {
    const entries = [..._recentlyNotifiedMessageIds];
    _recentlyNotifiedMessageIds.clear();
    entries.slice(-100).forEach((id) => _recentlyNotifiedMessageIds.add(id));
  }
}

function wasAlreadyNotified(messageId: string): boolean {
  return _recentlyNotifiedMessageIds.has(messageId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send in-app notifications for a newly sent chat message.
 *
 * @param messageId  - The inserted message row id (used for dedup)
 * @param conversationId - The conversation the message belongs to
 * @param senderId - The user who sent the message
 *
 * Call this fire-and-forget after a successful message insert.
 *
 * TODO: In the future, attach push notifications / mobile notifications here.
 */
/**
 * Set of message IDs that have already triggered mention notifications.
 * Used to prevent duplicate mention notifications.
 */
const _mentionNotifiedMessages = new Set<string>();
const MAX_MENTION_CACHE = 200;

function markMentionsSent(messageId: string) {
  _mentionNotifiedMessages.add(messageId);
  if (_mentionNotifiedMessages.size > MAX_MENTION_CACHE) {
    const entries = [..._mentionNotifiedMessages];
    _mentionNotifiedMessages.clear();
    entries.slice(-100).forEach((id) => _mentionNotifiedMessages.add(id));
  }
}

function wereMentionsAlreadySent(messageId: string): boolean {
  return _mentionNotifiedMessages.has(messageId);
}

/**
 * Detect @mentions in message content and notify mentioned users.
 * Returns the list of user IDs who were mentioned and notified.
 *
 * @param messageId - The message ID
 * @param conversationId - The conversation ID
 * @param senderId - The sender user ID
 * @param content - The message content to parse for mentions
 * @returns Array of mentioned user IDs who received notifications
 *
 * TODO: In the future, add autocomplete mention picker in the UI.
 */
export async function notifyMentions(
  messageId: string,
  conversationId: string,
  senderId: string,
  content: string,
): Promise<string[]> {
  try {
    // --- Guard: dedup mentions for this message ---
    if (wereMentionsAlreadySent(messageId)) {
      return [];
    }

    // --- 1. Parse mentions from content (@username or @"full name") ---
    // Matches @username or @"full name" patterns
    const mentionRegex = /@(?:"([^"]+)"|(\S+))/g;
    const mentionedNames: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const name = match[1] || match[2]; // quoted name or unquoted username
      if (name && name.trim()) {
        mentionedNames.push(name.trim().toLowerCase());
      }
    }

    if (mentionedNames.length === 0) {
      return [];
    }

    // --- 2. Get conversation participants with their profiles ---
    const { data: participants, error: partErr } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (partErr || !participants || participants.length === 0) {
      return [];
    }

    const participantIds = participants
      .map((p) => p.user_id as string)
      .filter((uid) => uid !== senderId); // Don't notify sender

    if (participantIds.length === 0) return [];

    // --- 3. Fetch participant profiles to match against mentions ---
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', participantIds);

    if (!profiles || profiles.length === 0) return [];

    // --- 4. Match mentions to users ---
    const mentionedUserIds: string[] = [];

    for (const profile of profiles) {
      const fullName = (profile.full_name || '').toLowerCase();
      const firstName = fullName.split(' ')[0];

      const isMentioned = mentionedNames.some((mention) => {
        // Match full name or first name
        return fullName === mention || firstName === mention;
      });

      if (isMentioned) {
        mentionedUserIds.push(profile.id);
      }
    }

    if (mentionedUserIds.length === 0) return [];

    // --- 5. Get sender name and conversation title ---
    const [{ data: senderProfile }, { data: convo }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', senderId).single(),
      supabase.from('conversations').select('type, title').eq('id', conversationId).single(),
    ]);

    const senderName = senderProfile?.full_name || 'Someone';
    const isGroup = convo?.type === 'group';

    // --- 6. Create mention notifications (high priority) ---
    const body = isGroup
      ? `${senderName} mentioned you in ${convo?.title || 'a group chat'}`
      : `${senderName} mentioned you in a conversation`;

    const results = await Promise.allSettled(
      mentionedUserIds.map((userId) => {
        // Suppress if local user has conversation open
        if (userId === _getLocalUserId() && _activeConversationId === conversationId) {
          console.log('[ChatNotif] Mention suppressed — user has conversation open');
          return Promise.resolve({ data: null, error: null });
        }

        return createNotification({
          userId,
          type: 'mention_received',
          title: 'You were mentioned',
          body,
          metadata: {
            conversationId,
            messageId,
            senderId,
            redirectTo: `/dev/chat-test?conversation=${conversationId}&message=${messageId}`,
          },
          actorId: senderId,
        });
      }),
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any)?.data,
    ).length;

    if (sent > 0) {
      console.log(`[ChatNotif] ${sent} mention notification(s) created for message ${messageId}`);
      markMentionsSent(messageId);
    }

    return mentionedUserIds;
  } catch (err) {
    console.error('[ChatNotif] Error sending mention notifications:', err);
    return [];
  }
}

/**
 * Send in-app notifications for a newly sent chat message.
 *
 * @param messageId  - The inserted message row id (used for dedup)
 * @param conversationId - The conversation the message belongs to
 * @param senderId - The user who sent the message
 * @param excludeUserIds - User IDs to exclude from notification (e.g., mentioned users who got priority notification)
 *
 * Call this fire-and-forget after a successful message insert.
 *
 * TODO: In the future, attach push notifications / mobile notifications here.
 */
export async function notifyMessageRecipients(
  messageId: string,
  conversationId: string,
  senderId: string,
  excludeUserIds: string[] = [],
): Promise<void> {
  try {
    console.log('[Notification Trigger] message_received', { messageId, conversationId, senderId, excludeUserIds });

    // --- Guard: dedup ---
    if (wasAlreadyNotified(messageId)) {
      console.log('[Notification Trigger] message already notified, skipping');
      return;
    }
    markAsNotified(messageId);

    // --- 1. Get conversation participants ---
    const { data: participants, error: partErr } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (partErr || !participants || participants.length === 0) {
      console.warn('[ChatNotif] No participants found', partErr?.message);
      return;
    }

    // --- 2. Determine recipients (everyone except sender and excluded users) ---
    const excludeSet = new Set([senderId, ...excludeUserIds]);
    const recipientIds = participants
      .map((p) => p.user_id as string)
      .filter((uid) => !excludeSet.has(uid));

    if (recipientIds.length === 0) return; // no one to notify

    // --- 3. Get conversation metadata (type, title) ---
    const { data: convo } = await supabase
      .from('conversations')
      .select('type, title')
      .eq('id', conversationId)
      .single();

    const isGroup = convo?.type === 'group';
    const groupName = convo?.title || 'a group chat';

    // --- 4. Get sender profile for display name ---
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();

    const senderName = senderProfile?.full_name || 'Someone';

    // --- 5. Build notification body ---
    const body = isGroup
      ? `${senderName} sent a message in ${groupName}`
      : `${senderName} sent you a message`;

    // --- 6. Create notifications (skip recipients viewing this conversation) ---
    // NOTE: We can only suppress for the LOCAL user's active conversation.
    // For other recipients on different devices, suppression happens client-side
    // (the dropdown/toast already handles dedup by notification id).
    console.log('[Notification Trigger] creating notifications for recipients:', recipientIds);

    const results = await Promise.allSettled(
      recipientIds.map((recipientId) => {
        // Suppress if this recipient is the local user AND the conversation is open
        if (recipientId === _getLocalUserId() && _activeConversationId === conversationId) {
          console.log('[Notification Trigger] suppressed — recipient has conversation open');
          return Promise.resolve({ data: null, error: null });
        }

        console.log('[Notification Trigger] creating notification for recipient:', recipientId);
        return createNotification({
          userId: recipientId,
          type: 'message_received',
          title: 'New message',
          body,
          metadata: {
            conversationId,
            senderId,
            redirectTo: `/dev/chat-test?conversation=${conversationId}`,
          },
          actorId: senderId,
        });
      }),
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any)?.data,
    ).length;
    const failed = results.length - sent;

    console.log(`[Notification Trigger] message notification results: ${sent} sent, ${failed} failed`);
  } catch (err) {
    // Never let notification errors propagate to the send flow
    console.error('[Notification Trigger] failed', err);
  }
}

// ---------------------------------------------------------------------------
// Missed Call Notifications
// ---------------------------------------------------------------------------
// Track which calls have already triggered missed call notifications
const _missedCallNotifiedIds = new Set<string>();
const MAX_MISSED_CALL_CACHE = 100;

function markMissedCallNotified(callId: string) {
  _missedCallNotifiedIds.add(callId);
  if (_missedCallNotifiedIds.size > MAX_MISSED_CALL_CACHE) {
    const entries = [..._missedCallNotifiedIds];
    _missedCallNotifiedIds.clear();
    entries.slice(-50).forEach((id) => _missedCallNotifiedIds.add(id));
  }
}

function wasMissedCallAlreadyNotified(callId: string): boolean {
  return _missedCallNotifiedIds.has(callId);
}

/**
 * Send a missed call notification to the receiver.
 * Called when a call times out or is marked as missed.
 *
 * @param callId - The call session ID (used for dedup)
 * @param callerId - The user who initiated the call
 * @param receiverId - The user who missed the call (notification recipient)
 * @param conversationId - The conversation the call was in
 * @param callType - 'audio' | 'video'
 *
 * TODO: In the future, save call history to a call_history table here.
 *       This would enable call logs, analytics, and detailed call records.
 */
export async function notifyMissedCall(
  callId: string,
  callerId: string,
  receiverId: string,
  conversationId: string,
  callType: 'audio' | 'video',
): Promise<void> {
  try {
    console.log('[Notification Trigger] call_missed', { callId, callerId, receiverId, conversationId, callType });

    // --- Guard: dedup ---
    if (wasMissedCallAlreadyNotified(callId)) {
      console.log('[Notification Trigger] call already notified, skipping');
      return;
    }

    // --- Get caller profile for display name ---
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', callerId)
      .single();

    const callerName = callerProfile?.full_name || 'Someone';

    // --- Build notification body ---
    const body = `${callerName} tried to call you`;

    // --- Create notification ---
    // Suppress if local user has conversation open
    if (receiverId === _getLocalUserId() && _activeConversationId === conversationId) {
      console.log('[Notification Trigger] suppressed — user has conversation open');
      markMissedCallNotified(callId);
      return;
    }

    console.log('[Notification Trigger] creating missed call notification for receiver:', receiverId);
    const result = await createNotification({
      userId: receiverId,
      type: 'call_missed',
      title: 'Missed call',
      body,
      metadata: {
        callerId,
        conversationId,
        callType,
        redirectTo: `/dev/chat-test?conversation=${conversationId}`,
      },
      actorId: callerId,
    });

    if (result.data) {
      console.log('[Notification Trigger] missed call notification created:', result.data.id);
      markMissedCallNotified(callId);
    } else {
      console.error('[Notification Trigger] failed to create missed call notification:', result.error);
    }
  } catch (err) {
    console.error('[Notification Trigger] failed', err);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Cached local user id to avoid repeated auth calls */
let _cachedLocalUserId: string | null = null;

function _getLocalUserId(): string | null {
  return _cachedLocalUserId;
}

/**
 * Cache the local user id. Called once during auth initialisation.
 * Also re-exported so the chat hook can set it on mount.
 */
export function setCachedLocalUserId(id: string | null) {
  _cachedLocalUserId = id;
}
