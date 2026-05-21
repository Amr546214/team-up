import { supabase } from '../../../lib/supabase';
import type { Conversation, Message, ChatUser, MessageReaction } from '../types';
import { notifyMessageRecipients, notifyMentions } from './chatNotifications';

/**
 * Get or create a direct conversation between the current user and a target user.
 * Returns the conversation id.
 */
export async function getOrCreateDirectConversation(
  targetUserId: string
): Promise<{ conversationId: string | null; isNew: boolean; error: string | null }> {
  try {
    // 1. Get current auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Chat] No authenticated user', authError);
      return { conversationId: null, isNew: false, error: 'Not authenticated' };
    }

    const currentUserId = user.id;

    // 2. Check if a direct conversation already exists between these two users
    // Step A: Get all conversation_ids where current user is a participant
    const { data: myParticipations, error: myPartError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (myPartError) {
      console.error('[Chat] Failed to fetch my participations', myPartError);
      return { conversationId: null, isNew: false, error: myPartError.message };
    }

    if (myParticipations && myParticipations.length > 0) {
      const myConversationIds = myParticipations.map((p) => p.conversation_id);

      // Step B: Among those, find direct conversations
      const { data: directConvos, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .in('id', myConversationIds)
        .eq('type', 'direct');

      if (convError) {
        console.error('[Chat] Failed to fetch direct conversations', convError);
        return { conversationId: null, isNew: false, error: convError.message };
      }

      if (directConvos && directConvos.length > 0) {
        const directConvoIds = directConvos.map((c) => c.id);

        // Step C: Check if target user is a participant in any of these direct conversations
        const { data: targetParticipations, error: targetPartError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', targetUserId)
          .in('conversation_id', directConvoIds);

        if (targetPartError) {
          console.error('[Chat] Failed to check target participations', targetPartError);
          return { conversationId: null, isNew: false, error: targetPartError.message };
        }

        if (targetParticipations && targetParticipations.length > 0) {
          const existingConvId = targetParticipations[0].conversation_id;
          return { conversationId: existingConvId, isNew: false, error: null };
        }
      }
    }

    // 3. No existing conversation found — create one
    const { data: newConvo, error: createError } = await supabase
      .from('conversations')
      .insert({ type: 'direct', created_by: currentUserId })
      .select('id')
      .single();

    if (createError || !newConvo) {
      console.error('[Chat] Failed to create conversation', createError);
      return { conversationId: null, isNew: false, error: createError?.message || 'Failed to create conversation' };
    }

    const newConvoId = newConvo.id;

    // 4. Insert participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConvoId, user_id: currentUserId, role: 'member' },
        { conversation_id: newConvoId, user_id: targetUserId, role: 'member' },
      ]);

    if (participantsError) {
      console.error('[Chat] Failed to add participants', participantsError);
      // Attempt cleanup
      await supabase.from('conversations').delete().eq('id', newConvoId);
      return { conversationId: null, isNew: false, error: participantsError.message };
    }

    return { conversationId: newConvoId, isNew: true, error: null };
  } catch (err: any) {
    console.error('[Chat] start chat failed', err);
    return { conversationId: null, isNew: false, error: err?.message || 'Unexpected error' };
  }
}

// ─── Helper: map a Supabase profile row to ChatUser ───
const VALID_ROLES = ['client', 'developer', 'company', 'admin', 'team-leader'] as const;
type ValidRole = typeof VALID_ROLES[number];

function toValidRole(role: string | null): ValidRole {
  if (role && (VALID_ROLES as readonly string[]).includes(role)) return role as ValidRole;
  return 'client';
}

function isTemporaryAuthError(error: any) {
  if (!error) return false;
  const message = String(error.message || error.msg || '').toLowerCase();
  return (
    error.status === 429 ||
    /rate limit/i.test(message) ||
    /timeout/i.test(message) ||
    /network/i.test(message) ||
    /fetch/i.test(message)
  );
}

function profileToChatUser(profile: any): ChatUser {
  return {
    id: profile.id,
    name: profile.full_name || profile.email || 'Unknown',
    role: toValidRole(profile.role),
    avatar: profile.avatar_url || undefined,
    status: 'offline',
  };
}

/**
 * Fetch the current authenticated user's profile from public.profiles.
 * Falls back to auth user metadata if profile fetch fails.
 */
export async function getCurrentUserProfile(): Promise<{
  user: ChatUser | null;
  error: string | null;
  temporary?: boolean;
}> {
  try {
    // 1. Get current auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const authTemporary = isTemporaryAuthError(authError);
    if (authError || !user) {
      console.warn('[Chat] No authenticated user', authError);
      return {
        user: null,
        error: 'Not authenticated',
        temporary: authTemporary,
      };
    }

    // 2. Fetch profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('[Chat] Failed to fetch profile, using auth metadata fallback', profileError);
      const profileTemporary = isTemporaryAuthError(profileError);
      const userMetadata = user.user_metadata;
      return {
        user: {
          id: user.id,
          name: userMetadata?.full_name || user.email || 'You',
          role: toValidRole(userMetadata?.role),
          avatar: userMetadata?.avatar_url || undefined,
          status: 'online',
        },
        error: null,
        temporary: profileTemporary,
      };
    }

    // Profile not found - use auth metadata fallback
    if (!profile) {
      console.warn('[Chat] Profile not found for user', user.id, '- using auth metadata fallback');
      const userMetadata = user.user_metadata;
      return {
        user: {
          id: user.id,
          name: userMetadata?.full_name || user.email || 'You',
          role: toValidRole(userMetadata?.role),
          avatar: userMetadata?.avatar_url || undefined,
          status: 'online',
        },
        error: null,
      };
    }

    // 4. Return profile data
    const chatUser: ChatUser = {
      id: profile.id,
      name: profile.full_name || profile.email || 'You',
      role: toValidRole(profile.role),
      avatar: profile.avatar_url || undefined,
      status: 'online',
    };

    return { user: chatUser, error: null };
  } catch (err: any) {
    console.error('[Chat] getCurrentUserProfile failed', err);
    return { user: null, error: err?.message || 'Unexpected error' };
  }
}

// ─── Helper: map a Supabase message row to Message ───
function rowToMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content || undefined,
    timestamp: new Date(row.created_at),
    status: 'sent',
    type: row.type || 'text',
    fileName: row.file_name || undefined,
    fileSize: row.file_size || undefined,
    fileType: row.file_type || undefined,
    mediaUrl: row.media_url || undefined,
    duration: row.duration || undefined,
    deletedAt: row.deleted_at ?? null,
    deletedBy: row.deleted_by ?? null,
    deleteScope: row.delete_scope ?? null,
    deleteReason: row.delete_reason ?? null,
    readAt: row.read_at ?? null,
    // Reply fields
    replyToMessageId: row.reply_to_message_id ?? null,
    replyToPreview: row.reply_to_preview ?? null,
    replyToSenderName: row.reply_to_sender_name ?? null,
    replyToMessageType: row.reply_to_message_type ?? null,
  };
}

/**
 * Fetch a conversation by ID, including participants with their profiles.
 * Returns data shaped as a Conversation compatible with the existing UI.
 */
export async function getConversationById(
  conversationId: string
): Promise<{ conversation: Conversation | null; currentUserId: string | null; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { conversation: null, currentUserId: null, error: 'Not authenticated' };

    // Fetch conversation
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .select('id, type, created_at')
      .eq('id', conversationId)
      .single();

    if (convoErr || !convo) {
      console.error('[Chat] load real conversation failed', convoErr);
      return { conversation: null, currentUserId: user.id, error: convoErr?.message || 'Conversation not found' };
    }

    // Fetch participants
    const { data: participants, error: partErr } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (partErr) {
      console.error('[Chat] load real conversation failed', partErr);
      return { conversation: null, currentUserId: user.id, error: partErr.message };
    }

    const otherUserIds = (participants || [])
      .map((p) => p.user_id)
      .filter((uid: string) => uid !== user.id);

    // Fetch profiles for other participants
    let otherUsers: ChatUser[] = [];
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role')
        .in('id', otherUserIds);

      otherUsers = (profiles || []).map(profileToChatUser);
    }

    // Fetch last message
    const { data: lastMsgRows } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMessage = lastMsgRows && lastMsgRows.length > 0 ? rowToMessage(lastMsgRows[0]) : undefined;

    const conversation: Conversation = {
      id: convo.id,
      type: convo.type || 'direct',
      participants: otherUsers,
      unreadCount: 0,
      updatedAt: lastMessage ? lastMessage.timestamp : new Date(convo.created_at),
      lastMessage,
    };

    return { conversation, currentUserId: user.id, error: null };
  } catch (err: any) {
    console.error('[Chat] load real conversation failed', err);
    return { conversation: null, currentUserId: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Fetch all messages for a conversation, ordered by created_at ascending.
 * Filters out messages that were hidden (deleted) for the current user.
 */
export async function getConversationMessages(
  conversationId: string
): Promise<{ messages: Message[]; error: string | null }> {
  try {
    // 1. Fetch messages from public.messages (including reply fields)
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        reply_to_message_id,
        reply_to_preview,
        reply_to_sender_name,
        reply_to_message_type
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Messages Debug] messages fetch error', error);
      return { messages: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { messages: [], error: null };
    }

    // 2. Get current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated, return all messages (shouldn't happen in normal use)
      const mapped = data.map(rowToMessage);
      return { messages: mapped, error: null };
    }

    // 3. Fetch user actions for these messages (all fields needed)
    const messageIds = data.map((m) => m.id);
    const { data: actions, error: actionsError } = await supabase
      .from('message_user_actions')
      .select('message_id, is_starred, hidden_at, reported_at, report_reason')
      .eq('user_id', user.id)
      .in('message_id', messageIds);

    if (actionsError) {
      console.error('[DeleteForMe] actions fetch error', actionsError);
      // Continue without filtering if actions fetch fails
      const mapped = data.map(rowToMessage);
      return { messages: mapped, error: null };
    }

    // 4. Build a map of actions by message_id for fast lookup
    const actionsByMessageId = new Map(
      (actions || []).map((a) => [a.message_id, a])
    );

    // 5. Build set of hidden message ids (hidden_at is not null)
    const hiddenIds = new Set(
      (actions || [])
        .filter((a) => a.hidden_at !== null && a.hidden_at !== undefined)
        .map((a) => a.message_id)
    );

    // 6. Filter messages - exclude hidden ones
    const visibleMessages = data.filter((m) => !hiddenIds.has(m.id));

    // 7. Fetch sender profiles for visible messages
    const senderIds = [...new Set(visibleMessages.map((m) => m.sender_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role')
      .in('id', senderIds);

    const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));
    // 8. Collect media paths for signed URL generation
    const mediaPaths = visibleMessages
      .filter((m) => ['image', 'file', 'voice'].includes(m.type) && m.media_url)
      .map((m) => m.media_url as string);

    // 9. Create signed URLs for media (7 days expiry)
    const signedUrlsMap = new Map<string, string>();
    if (mediaPaths.length > 0) {
      try {
        const { data: signedUrlsData, error: signedUrlsError } = await supabase.storage
          .from('chat-media')
          .createSignedUrls(mediaPaths, 60 * 60 * 24 * 7);

        if (signedUrlsError) {
          console.error('[Media URL] batch signed URL creation failed', signedUrlsError);
        } else if (signedUrlsData) {
          signedUrlsData.forEach((item) => {
            if (item.signedUrl && item.path) {
              signedUrlsMap.set(item.path, item.signedUrl);
            }
          });
        }
      } catch (err) {
        console.error('[Media URL] failed to create signed URLs', err);
      }
    }

    // 10. Map visible messages with sender profiles, user actions, and signed URLs
    const mapped = visibleMessages.map((row) => {
      const msg = rowToMessage(row);
      const action = actionsByMessageId.get(row.id);
      const profile = profilesMap.get(row.sender_id);

      // Merge user-specific action states
      msg.isStarred = action?.is_starred === true;
      msg.hiddenAt = action?.hidden_at ?? null;
      msg.reportedAt = action?.reported_at ?? null;
      msg.reportReason = action?.report_reason ?? null;

      msg.senderProfile = {
        id: row.sender_id,
        name: profile?.full_name || null,
        email: profile?.email || null,
        avatarUrl: profile?.avatar_url || null,
        role: profile?.role || null,
      };

      // Add signed URL for media messages
      if (row.media_url && signedUrlsMap.has(row.media_url)) {
        (msg as any).mediaUrl = signedUrlsMap.get(row.media_url);
        (msg as any).mediaPath = row.media_url;
      }

      return msg;
    });

    return { messages: mapped, error: null };
  } catch (err: any) {
    console.error('[Messages Debug] messages fetch error', err);
    console.error('[Chat] load real messages failed', err);
    return { messages: [], error: err?.message || 'Unexpected error' };
  }
}

/**
 * Send a text message to a real conversation.
 * Returns the inserted message mapped to the Message type.
 */
export async function sendTextMessage(
  conversationId: string,
  content: string,
  replyTo?: {
    messageId: string;
    preview: string;
    senderName: string;
    messageType: string;
  } | null
): Promise<{ message: Message | null; error: string | null }> {
  try {
    if (!content.trim()) {
      return { message: null, error: 'Message cannot be empty' };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: null, error: 'Not authenticated' };

    const insertData: any = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      type: 'text',
    };

    // Add reply fields if replying to a message
    if (replyTo) {
      insertData.reply_to_message_id = replyTo.messageId;
      insertData.reply_to_preview = replyTo.preview.slice(0, 80);
      insertData.reply_to_sender_name = replyTo.senderName;
      insertData.reply_to_message_type = replyTo.messageType;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select(`
        *,
        reply_to_message_id,
        reply_to_preview,
        reply_to_sender_name,
        reply_to_message_type
      `)
      .single();

    if (error || !data) {
      console.error('[Chat] send real message failed', error);
      return { message: null, error: error?.message || 'Failed to send message' };
    }

    const mapped = rowToMessage(data);

    // Fire-and-forget: detect mentions and notify mentioned users first (priority)
    // Mentioned users get priority notification and are excluded from generic message notification
    // TODO: Attach push notifications / mobile notifications here in the future
    // TODO: In the future, add autocomplete mention picker in the UI
    console.log('[Message Send] Triggering notifications for message:', mapped.id);
    (async () => {
      try {
        const mentionedIds = await notifyMentions(mapped.id, conversationId, user.id, content.trim());
        await notifyMessageRecipients(mapped.id, conversationId, user.id, mentionedIds);
      } catch (err) {
        console.error('[Message Send] Notification error:', err);
      }
    })();

    return { message: mapped, error: null };
  } catch (err: any) {
    console.error('[Chat] send real message failed', err);
    return { message: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Upload a file/blob to Supabase Storage chat-media bucket.
 * Returns the storage path and signed URL.
 */
export async function uploadChatMedia(
  fileOrBlob: File | Blob,
  options: {
    conversationId: string;
    fileName: string;
    fileType: string;
  }
): Promise<{ path: string; signedUrl: string; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { path: '', signedUrl: '', error: 'Not authenticated' };

    const { conversationId, fileName, fileType } = options;

    // Create safe storage path
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${user.id}/${conversationId}/${Date.now()}-${safeFileName}`;

    // Upload to bucket
    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(path, fileOrBlob, {
        contentType: fileType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Media Upload] failed', uploadError);
      return { path: '', signedUrl: '', error: uploadError.message };
    }

    // Create signed URL (7 days expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('chat-media')
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signedUrlError) {
      console.error('[Media URL] failed', signedUrlError);
      return { path, signedUrl: '', error: signedUrlError.message };
    }

    return { path, signedUrl: signedUrlData.signedUrl, error: null };
  } catch (err: any) {
    console.error('[Media Upload] failed', err);
    return { path: '', signedUrl: '', error: err?.message || 'Unexpected error' };
  }
}

/**
 * Send a media message (image, file, or voice) to a conversation.
 * Uploads to storage and inserts into public.messages.
 */
export async function sendMediaMessage({
  conversationId,
  type,
  fileOrBlob,
  fileName,
  fileSize,
  fileType,
  duration,
  replyTo,
}: {
  conversationId: string;
  type: 'image' | 'file' | 'voice' | 'audio';
  fileOrBlob: File | Blob;
  fileName: string;
  fileSize: number;
  fileType: string;
  duration?: number;
  replyTo?: {
    messageId: string;
    preview: string;
    senderName: string;
    messageType: string;
  } | null;
}): Promise<{ message: Message | null; error: string | null }> {
  try {
    // 1. Upload to storage
    const { path, signedUrl, error: uploadError } = await uploadChatMedia(fileOrBlob, {
      conversationId,
      fileName,
      fileType,
    });

    if (uploadError || !path) {
      return { message: null, error: uploadError || 'Upload failed' };
    }

    // 2. Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { message: null, error: 'Not authenticated' };

    // 3. Build insert data
    const insertData: any = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: type === 'file' || type === 'audio' ? fileName : null,
      type,
      media_url: path,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      duration: duration || null,
    };

    // Add reply fields if replying to a message
    if (replyTo) {
      insertData.reply_to_message_id = replyTo.messageId;
      insertData.reply_to_preview = replyTo.preview.slice(0, 80);
      insertData.reply_to_sender_name = replyTo.senderName;
      insertData.reply_to_message_type = replyTo.messageType;
    }

    // 4. Insert message row
    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select(`
        *,
        reply_to_message_id,
        reply_to_preview,
        reply_to_sender_name,
        reply_to_message_type
      `)
      .single();

    if (error || !data) {
      console.error('[Media Message] insert failed', error);
      return { message: null, error: error?.message || 'Failed to save message' };
    }

    // 4. Map to Message type with signed URL
    const mapped = rowToMessage(data);
    (mapped as any).mediaUrl = signedUrl; // Use signed URL for immediate rendering
    (mapped as any).mediaPath = path; // Keep path for future reference

    // Fire-and-forget: create in-app notifications for recipients
    // TODO: Attach push notifications / mobile notifications here in the future
    notifyMessageRecipients(mapped.id, conversationId, user.id).catch(() => {});

    return { message: mapped, error: null };
  } catch (err: any) {
    console.error('[Media Message] failed', err);
    return { message: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Create a new group conversation.
 * Creates conversation row and adds participants (current user + selected members).
 */
export async function createGroupConversation({
  title,
  memberIds,
}: {
  title: string;
  memberIds: string[];
}): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    // 1. Get current authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { conversationId: null, error: 'Not authenticated' };

    const currentUserId = user.id;

    // 2. Create the group conversation
    const { data: convo, error: convoError } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        title: title.trim(),
        created_by: currentUserId,
      })
      .select('id')
      .single();

    if (convoError || !convo) {
      console.error('[Group Chat] failed to create conversation', convoError);
      return { conversationId: null, error: convoError?.message || 'Failed to create group' };
    }

    const conversationId = convo.id;

    // 3. Prepare participants list (avoid duplicates)
    const uniqueMemberIds = [...new Set(memberIds)].filter((id) => id !== currentUserId);
    const participants = [
      // Current user as admin
      { conversation_id: conversationId, user_id: currentUserId, role: 'admin' },
      // Selected members
      ...uniqueMemberIds.map((id) => ({
        conversation_id: conversationId,
        user_id: id,
        role: 'member',
      })),
    ];

    // 4. Insert participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) {
      console.error('[Group Chat] failed to add participants', partError);
      // Don't delete the conversation - let the user retry or clean up manually
      return { conversationId: null, error: partError.message };
    }

    return { conversationId, error: null };
  } catch (err: any) {
    console.error('[Group Chat] create error', err);
    return { conversationId: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Fetch all conversations where the current user is a participant.
 * Returns conversations with participants, profiles, last messages, and unread counts.
 */
export async function getMyConversations(): Promise<{
  conversations: Conversation[];
  currentUserId: string | null;
  error: string | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { conversations: [], currentUserId: null, error: 'Not authenticated' };

    const currentUserId = user.id;

    // 1. Get all conversation participants for current user
    const { data: myParticipations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, is_pinned, is_muted, last_read_at, role')
      .eq('user_id', currentUserId);

    if (partError) {
      console.error('[Chat] load real conversations failed', partError);
      return { conversations: [], currentUserId, error: partError.message };
    }

    if (!myParticipations || myParticipations.length === 0) {
      return { conversations: [], currentUserId, error: null };
    }

    const conversationIds = myParticipations.map((p) => p.conversation_id);

    // 2. Fetch conversations
    const { data: convos, error: convoError } = await supabase
      .from('conversations')
      .select('id, type, title, avatar_url, created_by, created_at, updated_at')
      .in('id', conversationIds);

    if (convoError) {
      console.error('[Chat] load real conversations failed', convoError);
      return { conversations: [], currentUserId, error: convoError.message };
    }

    if (!convos || convos.length === 0) {
      return { conversations: [], currentUserId, error: null };
    }

    // 3. Fetch all participants for these conversations
    const { data: allParticipants, error: allPartError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, role')
      .in('conversation_id', conversationIds);

    if (allPartError) {
      console.error('[Chat] load real conversations failed', allPartError);
    }

    // 4. Get other user IDs (excluding current user)
    const otherUserIds = (allParticipants || [])
      .filter((p) => p.user_id !== currentUserId)
      .map((p) => p.user_id);

    // 5. Fetch profiles for other participants
    let profilesMap = new Map<string, any>();
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role')
        .in('id', otherUserIds);

      (profiles || []).forEach((p) => profilesMap.set(p.id, p));
    }

    // 6. Fetch last messages for all conversations
    const lastMessageMap = new Map<string, any>();
    for (const convId of conversationIds) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastMsg && lastMsg.length > 0) {
        lastMessageMap.set(convId, lastMsg[0]);
      }
    }

    // 6b. Fetch all messages for unread count calculation
    const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, created_at, deleted_at, delete_scope')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('[Chat] fetch messages for unread count failed', messagesError);
    }

    // Group messages by conversation
    const messagesByConversation = new Map<string, any[]>();
    (allMessages || []).forEach((msg) => {
      const list = messagesByConversation.get(msg.conversation_id) || [];
      list.push(msg);
      messagesByConversation.set(msg.conversation_id, list);
    });

    // 7. Build conversations
    const conversations: Conversation[] = convos.map((convo) => {
      const myPart = myParticipations.find((p) => p.conversation_id === convo.id)!;
      const convoParticipants = (allParticipants || []).filter((p) => p.conversation_id === convo.id);
      const otherParticipants = convoParticipants.filter((p) => p.user_id !== currentUserId);

      // Build participants array with profiles
      const participants: ChatUser[] = otherParticipants.map((p) => {
        const profile = profilesMap.get(p.user_id);
        if (profile) {
          const chatUser = profileToChatUser(profile);
          return chatUser;
        }
        // Fallback for missing profile
        return {
          id: p.user_id,
          name: 'Unknown User',
          role: 'client',
          status: 'offline',
        };
      });

      // Get last message
      const lastMsgRow = lastMessageMap.get(convo.id);
      const lastMessage = lastMsgRow ? rowToMessage(lastMsgRow) : undefined;

      // Calculate unread count
      const convoMessages = messagesByConversation.get(convo.id) || [];
      const lastReadAt = myPart.last_read_at;

      const unreadCount = convoMessages.filter((msg) => {
        // From other users only
        if (msg.sender_id === currentUserId) return false;

        // Not deleted for everyone
        if (msg.deleted_at && msg.delete_scope === 'everyone') return false;

        // After last read (or all if never read)
        if (lastReadAt) {
          return new Date(msg.created_at) > new Date(lastReadAt);
        }
        return true;
      }).length;

      const conversation: Conversation = {
        id: convo.id,
        type: convo.type || 'direct',
        participants,
        name: convo.type === 'group' ? convo.title || 'Group' : undefined,
        avatar: convo.type === 'group' ? convo.avatar_url || undefined : undefined,
        membersCount: convo.type === 'group' ? convoParticipants.length : undefined,
        lastMessage,
        unreadCount,
        updatedAt: lastMessage ? lastMessage.timestamp : new Date(convo.updated_at || convo.created_at),
        isMuted: myPart.is_muted || false,
        isPinned: myPart.is_pinned || false,
        pinnedAt: myPart.is_pinned ? new Date() : undefined,
      };

      return conversation;
    });

    // Sort: pinned first, then by updatedAt desc
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return { conversations, currentUserId, error: null };
  } catch (err: any) {
    console.error('[Chat] load real conversations failed', err);
    return { conversations: [], currentUserId: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Mark a conversation as read for the current user.
 * Updates conversation_participants.last_read_at to now.
 */
export async function markConversationAsRead(
  conversationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Unread] mark read failed', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Unread] mark read failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Read Receipts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark all incoming messages in a conversation as read using RPC.
 * The RPC function handles sender_id filtering and RLS bypass server-side.
 * currentUserId parameter kept for API compatibility and debug logging.
 */
export async function markConversationMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<{ success: boolean; data: any[] | null; error: string | null }> {
  try {
    // Use RPC to bypass RLS and mark messages as read
    // The RPC function handles the update logic server-side with proper permissions

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'mark_conversation_messages_read',
      {
        p_conversation_id: conversationId,
      }
    );

    if (rpcError) {
      console.error('[Read Receipts] RPC failed', rpcError);
      return { success: false, data: null, error: rpcError.message };
    }

    // RPC returns the updated message IDs, fetch their full data
    if (rpcData && rpcData.length > 0) {
      const { data: updatedMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, read_at')
        .in('id', rpcData);

      return { success: true, data: updatedMessages || [], error: null };
    }

    // No unread messages to update
    return { success: true, data: [], error: null };
  } catch (err: any) {
    console.error('[Read Receipts] failed to mark as read', err);
    return { success: false, data: null, error: err?.message || 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Message User Actions (Star, Hide, Report)
// ─────────────────────────────────────────────────────────────────────────────

export interface MessageUserAction {
  messageId: string;
  isStarred: boolean;
  hiddenAt: string | null;
  reportedAt: string | null;
  reportReason: string | null;
}

/**
 * Fetch user-specific actions for a list of message IDs.
 * Returns a map of messageId -> action data.
 */
export async function getMessageUserActions(
  messageIds: string[]
): Promise<{ actions: Map<string, MessageUserAction>; error: string | null }> {
  try {
    if (messageIds.length === 0) {
      return { actions: new Map(), error: null };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { actions: new Map(), error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('message_user_actions')
      .select('message_id, is_starred, hidden_at, reported_at, report_reason')
      .in('message_id', messageIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Message Actions] fetch failed', error);
      return { actions: new Map(), error: error.message };
    }

    const actionsMap = new Map<string, MessageUserAction>();
    (data || []).forEach((row) => {
      actionsMap.set(row.message_id, {
        messageId: row.message_id,
        isStarred: row.is_starred || false,
        hiddenAt: row.hidden_at,
        reportedAt: row.reported_at,
        reportReason: row.report_reason,
      });
    });

    return { actions: actionsMap, error: null };
  } catch (err: any) {
    console.error('[Message Actions] fetch failed', err);
    return { actions: new Map(), error: err?.message || 'Unexpected error' };
  }
}

/**
 * Toggle star status for a message (user-specific).
 */
export async function toggleMessageStar(
  messageId: string,
  isStarred: boolean
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('message_user_actions').upsert(
      {
        message_id: messageId,
        user_id: user.id,
        is_starred: isStarred,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'message_id,user_id' }
    );

    if (error) {
      console.error('[Message Actions] star failed', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Message Actions] star failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Hide a message for the current user only (Delete for me).
 */
export async function hideMessageForMe(
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase.from('message_user_actions').upsert(
      {
        message_id: messageId,
        user_id: user.id,
        hidden_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'message_id,user_id' }
    );

    if (error) {
      console.error('[Message Actions] hide failed', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Message Actions] hide failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Report a user for moderation.
 */
export async function reportUser({
  reportedUserId,
  conversationId,
  reason,
  details,
}: {
  reportedUserId: string;
  conversationId: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error: string | null; alreadyReported?: boolean }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    if (reportedUserId === user.id) {
      console.warn('[Report User] cannot report yourself');
      return { success: false, error: 'Cannot report yourself' };
    }

    // Check for existing report
    const { data: existing } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_user_id', reportedUserId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_reports')
        .update({ reason, details: details || null })
        .eq('id', existing.id);
      if (error) {
        console.error('[Report User] update failed', error);
        return { success: false, error: error.message };
      }
      return { success: true, error: null, alreadyReported: true };
    }

    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        conversation_id: conversationId,
        reason,
        details: details || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[Report User] failed', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Report User] failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Report a message for moderation.
 */
export async function reportMessage(
  messageId: string,
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase.from('message_user_actions').upsert(
      {
        message_id: messageId,
        user_id: user.id,
        reported_at: new Date().toISOString(),
        report_reason: reason || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'message_id,user_id' }
    )
    .select()
    .maybeSingle();

    if (error) {
      console.error('[Report Message] failed', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Message Actions] report failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Soft-delete a message for everyone (sets deleted_at, deleted_by, delete_scope).
 * Only the sender can do this (enforced by RLS + sender_id check).
 */
export async function deleteMessageForEveryone(
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // 1. Fetch the row to verify ownership before update
    const { data: beforeRow, error: beforeError } = await supabase
      .from('messages')
      .select('id, sender_id, content, deleted_at, delete_scope')
      .eq('id', messageId)
      .single();

    if (beforeError) {
      console.error('[DeleteEveryone Debug] before fetch error', beforeError);
      return { success: false, error: beforeError.message };
    }

    if (beforeRow.sender_id !== user.id) {
      return { success: false, error: 'You can only delete your own messages for everyone.' };
    }

    // 2. Run the update
    const { data, error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        delete_scope: 'everyone',
        delete_reason: 'user_deleted_for_everyone',
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select('id, sender_id, deleted_at, delete_scope')
      .maybeSingle();

    if (error) {
      console.error('[DeleteEveryone Debug] update error', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('[DeleteEveryone Debug] update matched 0 rows', { messageId, userId: user.id });
      return { success: false, error: 'No message was updated. This message may not belong to the current user.' };
    }

    // Also unstar the message for the current user
    await supabase
      .from('message_user_actions')
      .upsert(
        { message_id: messageId, user_id: user.id, is_starred: false, updated_at: new Date().toISOString() },
        { onConflict: 'message_id,user_id' }
      );

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[DeleteEveryone Debug] unexpected error', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Starred Messages
// ─────────────────────────────────────────────────────────────────────────────

export interface StarredMessageItem {
  messageId: string;
  conversationId: string;
  content: string | null;
  type: string;
  createdAt: Date;
  senderId: string;
  senderName: string;
  conversationName: string;
  conversationAvatar: string | null;
}

/**
 * Fetch all starred messages for the current user.
 * Returns formatted items ready for display in the starred messages panel.
 */
export async function getMyStarredMessages(): Promise<{
  items: StarredMessageItem[];
  error: string | null;
}> {
  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { items: [], error: 'Not authenticated' };

    // 1. Fetch starred actions for current user
    const { data: starredActions, error: actionsError } = await supabase
      .from('message_user_actions')
      .select('message_id, hidden_at')
      .eq('user_id', user.id)
      .eq('is_starred', true);

    if (actionsError) {
      console.error('[Starred] actions fetch error', actionsError);
      return { items: [], error: actionsError.message };
    }

    if (!starredActions || starredActions.length === 0) {
      return { items: [], error: null };
    }

    // Filter out hidden messages
    const visibleStarred = starredActions.filter((a) => !a.hidden_at);
    const messageIds = visibleStarred.map((a) => a.message_id);

    if (messageIds.length === 0) {
      return { items: [], error: null };
    }

    // 2. Fetch the actual messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .in('id', messageIds)
      .is('deleted_at', null) // Exclude deleted messages
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('[Starred] messages fetch error', messagesError);
      return { items: [], error: messagesError.message };
    }

    if (!messagesData || messagesData.length === 0) {
      console.log('[Starred] loaded count', 0);
      return { items: [], error: null };
    }

    // 3. Fetch conversation data for these messages
    const conversationIds = [...new Set(messagesData.map((m) => m.conversation_id))];
    const { data: conversationsData, error: convoError } = await supabase
      .from('conversations')
      .select('id, type, title, avatar_url')
      .in('id', conversationIds);

    if (convoError) {
      console.error('[Starred] conversations fetch error', convoError);
    }

    const conversationMap = new Map(
      (conversationsData || []).map((c) => [c.id, c])
    );

    // 4. Fetch participants for direct conversations
    const { data: participantsData, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds);

    if (partError) {
      console.error('[Starred] participants fetch error', partError);
    }

    // 5. Fetch profiles for participant names
    const participantUserIds = [...new Set((participantsData || []).map((p) => p.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', participantUserIds);

    if (profilesError) {
      console.error('[Starred] profiles fetch error', profilesError);
    }

    const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

    // Build participant map by conversation
    const participantsByConvo = new Map<string, string[]>();
    for (const p of participantsData || []) {
      const list = participantsByConvo.get(p.conversation_id) || [];
      list.push(p.user_id);
      participantsByConvo.set(p.conversation_id, list);
    }

    // 6. Format the result
    const items: StarredMessageItem[] = messagesData.map((msg) => {
      const convo = conversationMap.get(msg.conversation_id);
      const senderProfile = profilesMap.get(msg.sender_id);

      let conversationName: string;
      let conversationAvatar: string | null = null;

      if (convo?.type === 'group') {
        conversationName = convo.title || 'Group';
        conversationAvatar = convo.avatar_url || null;
      } else {
        // Direct conversation - find the other participant
        const participantIds = participantsByConvo.get(msg.conversation_id) || [];
        const otherId = participantIds.find((id) => id !== user.id);
        const otherProfile = otherId ? profilesMap.get(otherId) : null;
        conversationName = otherProfile?.full_name || 'Unknown';
        conversationAvatar = otherProfile?.avatar_url || null;
      }

      return {
        messageId: msg.id,
        conversationId: msg.conversation_id,
        content: msg.content,
        type: msg.type || 'text',
        createdAt: new Date(msg.created_at),
        senderId: msg.sender_id,
        senderName: senderProfile?.full_name || 'Unknown',
        conversationName,
        conversationAvatar,
      };
    });

    console.log('[Starred] loaded count', items.length);
    return { items, error: null };
  } catch (err: any) {
    console.error('[Starred] load failed', err);
    return { items: [], error: err?.message || 'Unexpected error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pinned Messages
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PINNED_MESSAGES = 3;

export interface PinnedMessageWithData {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
  message: Message;
}

/**
 * Get all pinned messages for a conversation.
 * Returns pinned messages with full message data joined.
 */
export async function getPinnedMessages(
  conversationId: string
): Promise<{ pinnedMessages: PinnedMessageWithData[]; error: string | null }> {
  try {
    console.log('[Pinned Service] fetching for conversation', conversationId);

    // First try with join
    let data: any[] | null = null;
    let error: any = null;

    try {
      const result = await supabase
        .from('pinned_messages')
        .select(`
          id,
          conversation_id,
          message_id,
          pinned_by,
          pinned_at,
          message:messages!inner(*)
        `)
        .eq('conversation_id', conversationId)
        .order('pinned_at', { ascending: false });

      data = result.data;
      error = result.error;
    } catch (joinErr) {
      console.warn('[Pinned Service] join query failed, trying without join', joinErr);
    }

    // If join failed or returned no data with error, try simpler query
    if (error || !data) {
      console.log('[Pinned Service] trying simple query without join');
      const simpleResult = await supabase
        .from('pinned_messages')
        .select('id, conversation_id, message_id, pinned_by, pinned_at')
        .eq('conversation_id', conversationId)
        .order('pinned_at', { ascending: false });

      if (simpleResult.error) {
        console.error('[Pinned Service] simple query failed', simpleResult.error);
        return { pinnedMessages: [], error: simpleResult.error.message };
      }

      // Fetch messages separately
      const pinnedData = simpleResult.data || [];
      const messageIds = pinnedData.map((p: any) => p.message_id);

      let messagesData: any[] = [];
      if (messageIds.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('id', messageIds);

        if (msgsError) {
          console.error('[Pinned Service] fetch messages failed', msgsError);
        } else {
          messagesData = msgs || [];
        }
      }

      // Merge data
      const merged = pinnedData.map((pin: any) => ({
        ...pin,
        message: messagesData.find((m: any) => m.id === pin.message_id),
      }));

      data = merged;
    }

    // Map to our type format and filter out any without message data
    const pinnedMessages = (data || [])
      .map((row: any) => ({
        id: row.id,
        conversationId: row.conversation_id,
        messageId: row.message_id,
        pinnedBy: row.pinned_by,
        pinnedAt: row.pinned_at,
        message: row.message ? rowToMessage(row.message) : null,
      }))
      .filter((p): p is PinnedMessageWithData => p.message !== null);

    console.log('[Pinned Service] loaded count', conversationId, pinnedMessages.length);
    return { pinnedMessages, error: null };
  } catch (err: any) {
    console.error('[Pinned Service] get failed', err);
    return { pinnedMessages: [], error: err?.message || 'Unexpected error' };
  }
}

/**
 * Pin a message to a conversation.
 * Returns success or error with specific code for max pinned limit.
 */
export async function pinMessage(
  conversationId: string,
  messageId: string
): Promise<{ success: boolean; error: string | null; errorCode?: 'MAX_PINNED' | 'ALREADY_PINNED' | 'NOT_FOUND' | string }> {
  try {
    // Check current pinned count
    const { count, error: countError } = await supabase
      .from('pinned_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (countError) {
      console.error('[Pinned] count check failed', countError);
      return { success: false, error: countError.message };
    }

    if (count && count >= MAX_PINNED_MESSAGES) {
      console.warn('[Pinned] max pinned messages reached', conversationId, count);
      return {
        success: false,
        error: `Maximum ${MAX_PINNED_MESSAGES} pinned messages allowed. Please unpin a message first.`,
        errorCode: 'MAX_PINNED',
      };
    }

    // Use RPC to pin message (bypasses RLS)
    const { data: pinData, error: pinError } = await supabase.rpc('pin_message', {
      p_conversation_id: conversationId,
      p_message_id: messageId,
    });

    if (pinError) {
      // Check for specific error codes from the RPC function
      if (pinError.message?.includes('already pinned')) {
        console.warn('[Pinned] message already pinned', messageId);
        return {
          success: false,
          error: 'Message is already pinned.',
          errorCode: 'ALREADY_PINNED',
        };
      }
      if (pinError.message?.includes('Maximum') || pinError.message?.includes('max')) {
        console.warn('[Pinned] max pinned messages reached', conversationId);
        return {
          success: false,
          error: `Maximum ${MAX_PINNED_MESSAGES} pinned messages allowed. Please unpin a message first.`,
          errorCode: 'MAX_PINNED',
        };
      }
      console.error('[Pinned] pin failed', pinError);
      return { success: false, error: pinError.message };
    }

    console.log('[Pinned] pinned message', conversationId, messageId, pinData);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Pinned] pin failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Unpin a message from a conversation.
 */
export async function unpinMessage(
  conversationId: string,
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Use RPC to unpin message (bypasses RLS)
    const { data: unpinData, error: unpinError } = await supabase.rpc('unpin_message', {
      p_conversation_id: conversationId,
      p_message_id: messageId,
    });

    if (unpinError) {
      console.error('[Pinned] unpin failed', unpinError);
      return { success: false, error: unpinError.message };
    }

    console.log('[Pinned] unpinned message', conversationId, messageId, unpinData);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Pinned] unpin failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Check if a message is pinned in a conversation.
 */
export async function isMessagePinned(
  conversationId: string,
  messageId: string
): Promise<{ isPinned: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('pinned_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('message_id', messageId)
      .maybeSingle();

    if (error) {
      console.error('[Pinned] check failed', error);
      return { isPinned: false, error: error.message };
    }

    return { isPinned: !!data, error: null };
  } catch (err: any) {
    console.error('[Pinned] check failed', err);
    return { isPinned: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Fetch all reactions for a conversation's messages.
 * Returns reactions grouped by message_id.
 */
export async function getConversationReactions(
  conversationId: string
): Promise<{ reactions: Record<string, MessageReaction[]>; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select(`
        id,
        message_id,
        conversation_id,
        user_id,
        emoji,
        created_at,
        updated_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Reactions] fetch failed', error);
      return { reactions: {}, error: error.message };
    }

    // Group reactions by message_id
    const grouped: Record<string, MessageReaction[]> = {};
    data?.forEach((row: any) => {
      const reaction: MessageReaction = {
        id: row.id,
        messageId: row.message_id,
        conversationId: row.conversation_id,
        userId: row.user_id,
        emoji: row.emoji,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      if (!grouped[reaction.messageId]) {
        grouped[reaction.messageId] = [];
      }
      grouped[reaction.messageId].push(reaction);
    });

    console.log('[Reactions] fetched', conversationId, Object.keys(grouped).length, 'messages with reactions');
    return { reactions: grouped, error: null };
  } catch (err: any) {
    console.error('[Reactions] fetch failed', err);
    return { reactions: {}, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Add or update a reaction to a message.
 * Uses upsert with unique constraint (message_id, user_id).
 */
export async function addOrUpdateReaction(
  messageId: string,
  conversationId: string,
  emoji: string
): Promise<{ reaction: MessageReaction | null; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { reaction: null, error: 'Not authenticated' };

    const reactionPayload = {
      message_id: messageId,
      conversation_id: conversationId,
      user_id: user.id,
      emoji: emoji,
    };
    console.log('[REACTION] inserting', reactionPayload);

    const { data, error } = await supabase
      .from('message_reactions')
      .upsert(reactionPayload, {
        onConflict: 'message_id,user_id',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[REACTION] insert failed', error);
      return { reaction: null, error: error?.message || 'Failed to add reaction' };
    }

    const reaction: MessageReaction = {
      id: data.id,
      messageId: data.message_id,
      conversationId: data.conversation_id,
      userId: data.user_id,
      emoji: data.emoji,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log('[REACTION] inserted', reaction.id);
    return { reaction, error: null };
  } catch (err: any) {
    console.error('[Reactions] add failed', err);
    return { reaction: null, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Remove the current user's reaction from a message.
 */
export async function removeReaction(
  messageId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    console.log('[REACTION] deleting', { messageId, userId: user.id });

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[REACTION] delete failed', error);
      return { success: false, error: error.message };
    }

    console.log('[REACTION] deleted', messageId);
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[Reactions] remove failed', err);
    return { success: false, error: err?.message || 'Unexpected error' };
  }
}

/**
 * Get the current user's reaction for a specific message.
 */
export async function getUserReaction(
  messageId: string
): Promise<{ reaction: MessageReaction | null; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { reaction: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('message_reactions')
      .select()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Reactions] get user reaction failed', error);
      return { reaction: null, error: error.message };
    }

    if (!data) {
      return { reaction: null, error: null };
    }

    const reaction: MessageReaction = {
      id: data.id,
      messageId: data.message_id,
      conversationId: data.conversation_id,
      userId: data.user_id,
      emoji: data.emoji,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { reaction, error: null };
  } catch (err: any) {
    console.error('[Reactions] get user reaction failed', err);
    return { reaction: null, error: err?.message || 'Unexpected error' };
  }
}
