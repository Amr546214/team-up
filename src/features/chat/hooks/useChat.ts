import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Conversation, Message, ChatUser } from '../types';
import type { UploadModalState } from '../components/ChatUploadModal';
import {
  mockCurrentUser,
  mockConversations,
  mockMessages,
} from '../data/mockChatData';
import {
  getReadConversationIds,
  addReadConversationId,
  removeReadConversationId,
  cleanReadConversationIds,
} from '../utils/chatStorage';
import {
  sendTextMessage as supabaseSendTextMessage,
  sendMediaMessage as supabaseSendMediaMessage,
  getMyConversations,
  getConversationMessages,
  getMessageUserActions,
  getCurrentUserProfile,
  toggleMessageStar,
  hideMessageForMe,
  reportMessage,
  deleteMessageForEveryone,
  markConversationAsRead,
} from '../services/supabaseChatService';
import { supabase } from '../../../lib/supabase';

const LAST_CONVERSATION_STORAGE_KEY = 'chat:lastConversationId';
const PINNED_CHATS_STORAGE_KEY = 'chat:pinnedConversationIds';

interface UseChatState {
  // State
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  conversations: Conversation[];
  isMobileChatOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Derived
  activeConversation: Conversation | null;
  activeMessages: Message[];
  sortedConversations: Conversation[];
  currentUser: ChatUser;
  isLoadingCurrentUser: boolean;

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setIsMobileChatOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectConversation: (id: string) => void;
  backToList: () => void;
  sendMessage: (content: string) => void;
  sendAttachment: (attachmentData: { type: 'image' | 'file' | 'voice' | 'audio'; fileOrBlob: File | Blob; fileName: string; fileSize: number; fileType: string; duration?: number }) => void;
  togglePin: (conversationId: string) => void;
  toggleMute: (conversationId: string) => void;
  markUnread: (conversationId: string) => void;
  clearChat: (conversationId: string) => void;
  deleteChat: (conversationId: string) => void;
  refresh: () => void;
  openRealConversation: (conversation: Conversation, messages: Message[], realUserId: string) => void;
  refreshConversations: () => Promise<void>;
  isSendingMessage: boolean;
  sendMessageError: string | null;
  isLoadingMessages: boolean;

  // Message actions
  onToggleMessageStar: (messageId: string, isStarred: boolean) => Promise<void>;
  onHideMessageForMe: (messageId: string) => Promise<void>;
  onReportMessage: (messageId: string, reason: string) => Promise<void>;
  onDeleteForEveryone: (messageId: string) => Promise<void>;

  // Highlight
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;

  // Upload modal
  uploadModal: UploadModalState;
  setUploadModal: (state: UploadModalState) => void;
}

export function useChat(): UseChatState {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Upload modal state for media uploads
  const [uploadModal, setUploadModal] = useState<UploadModalState>({
    open: false,
    status: 'uploading',
  });

  // Track which conversation IDs are real Supabase conversations
  const realConversationIds = useRef<Set<string>>(new Set());

  // Track the real current user ID (from Supabase auth)
  const realUserIdRef = useRef<string | null>(null);

  // Track the current user profile (from public.profiles)
  const [currentUserProfile, setCurrentUserProfile] = useState<ChatUser | null>(null);

  // Loading state for current user profile
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);

  // Use real conversations flag (dev-only, could be disabled for mock fallback)
  const USE_REAL_CONVERSATIONS = true;

  // Conversations state - starts empty, loads real conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load pinned conversations from localStorage and apply on mount (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pinnedIdsJson = localStorage.getItem(PINNED_CHATS_STORAGE_KEY);
    if (pinnedIdsJson) {
      try {
        const pinnedIds: string[] = JSON.parse(pinnedIdsJson);
        setConversations(prev => {
          const validPinnedIds = pinnedIds.filter(id => prev.some(c => c.id === id));
          if (validPinnedIds.length !== pinnedIds.length) {
            localStorage.setItem(PINNED_CHATS_STORAGE_KEY, JSON.stringify(validPinnedIds));
          }
          return prev.map(c => {
            if (validPinnedIds.includes(c.id)) {
              const existingPinned = prev.find(cp => cp.id === c.id && cp.isPinned);
              return {
                ...c,
                isPinned: true,
                pinnedAt: existingPinned?.pinnedAt || new Date(),
              };
            }
            return { ...c, isPinned: false, pinnedAt: undefined };
          });
        });
      } catch {
        localStorage.removeItem(PINNED_CHATS_STORAGE_KEY);
      }
    }

    // Only restore mock conversations on mount if not using real conversations
    // Real conversations are restored in a separate effect after loading
    if (!USE_REAL_CONVERSATIONS) {
      const savedId = sessionStorage.getItem(LAST_CONVERSATION_STORAGE_KEY);
      if (savedId) {
        const conversationExists = mockConversations.some((c) => c.id === savedId);
        if (conversationExists) {
          setActiveConversationId(savedId);
          setIsMobileChatOpen(true);
          addReadConversationId(savedId);
          setConversations((prev) =>
            prev.map((c) => (c.id === savedId ? { ...c, unreadCount: 0 } : c))
          );
        } else {
          sessionStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
        }
      }
    }
  }, []);

  // Persist pinned IDs to localStorage
  const persistPinnedIds = useCallback((convs: Conversation[]) => {
    if (typeof window === 'undefined') return;
    const pinnedIds = convs
      .filter(c => c.isPinned)
      .sort((a, b) => {
        const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return bTime - aTime;
      })
      .map(c => c.id);
    localStorage.setItem(PINNED_CHATS_STORAGE_KEY, JSON.stringify(pinnedIds));
  }, []);

  // Derived: current user (profile from Supabase, or mock for demo conversations)
  const currentUser = useMemo((): ChatUser => {
    if (currentUserProfile) {
      return currentUserProfile;
    }

    if (activeConversationId && realConversationIds.current.has(activeConversationId) && realUserIdRef.current) {
      return {
        id: realUserIdRef.current,
        name: 'You',
        role: 'client',
        avatar: undefined,
        status: 'online',
      };
    }

    return mockCurrentUser;
  }, [activeConversationId, currentUserProfile]);

  // Derived state
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const activeMessages = useMemo(() => {
    const msgs = activeConversationId ? (messages[activeConversationId] || []) : [];
    return msgs.filter((m) => !m.hiddenAt);
  }, [activeConversationId, messages]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
        const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
        return bTime - aTime;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  // Actions
  const selectConversation = useCallback(async (id: string) => {
    console.log('[Messages] selectConversation called', id);
    setActiveConversationId(id);
    setIsMobileChatOpen(true);

    // Clear unread count locally
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(LAST_CONVERSATION_STORAGE_KEY, id);
    }

    if (realConversationIds.current.has(id)) {
      // Mark as read in Supabase (don't block on this)
      markConversationAsRead(id).catch((err) => {
        console.error('[Unread] mark read failed', err);
      });

      console.log('[Messages] loading', id);
      setIsLoadingMessages(true);

      const { messages: loadedMessages, error } = await getConversationMessages(id);

      if (error) {
        console.error('[Messages] load failed', id, error);
        setIsLoadingMessages(false);
        return;
      }

      console.log('[Messages] loaded count', id, loadedMessages.length);
      setMessages((prev) => ({
        ...prev,
        [id]: loadedMessages,
      }));
      setIsLoadingMessages(false);
    } else {
      // Mock fallback: use localStorage
      addReadConversationId(id);
    }
  }, []);

  const backToList = useCallback(() => {
    setIsMobileChatOpen(false);
    setActiveConversationId(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!activeConversationId) return;

    if (realConversationIds.current.has(activeConversationId)) {
      const convId = activeConversationId;
      setIsSendingMessage(true);
      setSendMessageError(null);

      supabaseSendTextMessage(convId, content).then(({ message: msg, error: err }) => {
        if (err || !msg) {
          console.error('[Messages] send failed', convId, err);
          setSendMessageError(err || 'Failed to send');
          setIsSendingMessage(false);
          return;
        }

        console.log('[Messages] sent', convId, msg.id);

        setMessages((prev) => {
          const current = prev[convId] || [];
          const exists = current.some((m) => m.id === msg.id);

          return {
            ...prev,
            [convId]: exists ? current : [...current, msg],
          };
        });

        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastMessage: msg, updatedAt: msg.timestamp } : c))
        );

        setIsSendingMessage(false);
      });

      return;
    }

    const now = new Date();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      content,
      timestamp: now,
      status: 'sent',
      type: 'text',
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
    }));

    setConversations(prev => prev.map(c =>
      c.id === activeConversationId
        ? { ...c, lastMessage: newMessage, updatedAt: now }
        : c
    ));
  }, [activeConversationId, currentUser]);

  const sendAttachment = useCallback(async ({
    type,
    fileOrBlob,
    fileName,
    fileSize,
    fileType,
    duration,
  }: {
    type: 'image' | 'file' | 'voice' | 'audio';
    fileOrBlob: File | Blob;
    fileName: string;
    fileSize: number;
    fileType: string;
    duration?: number;
  }) => {
    if (!activeConversationId) return;

    const convId = activeConversationId;

    setUploadModal({
      open: true,
      fileName,
      fileType,
      status: 'uploading',
    });

    if (realConversationIds.current.has(convId)) {
      console.log('[Media] uploading to Supabase Storage', convId);

      const { message, error } = await supabaseSendMediaMessage({
        conversationId: convId,
        type,
        fileOrBlob,
        fileName,
        fileSize,
        fileType,
        duration,
      });

      if (error || !message) {
        console.error('[Media Upload] failed', convId, error);
        setUploadModal({
          open: true,
          fileName,
          fileType,
          status: 'error',
          errorMessage: error || 'Upload failed. Please try again.',
        });
        return;
      }

      console.log('[Media] uploaded and saved', convId, message.id);

      setUploadModal({
        open: true,
        fileName,
        fileType,
        status: 'success',
      });

      setTimeout(() => {
        setUploadModal({ open: false, status: 'uploading' });

        setMessages((prev) => {
          const current = prev[convId] || [];
          const exists = current.some((m) => m.id === message.id);

          return {
            ...prev,
            [convId]: exists ? current : [...current, message],
          };
        });

        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, lastMessage: message, updatedAt: message.timestamp } : c))
        );
      }, 500);

      return;
    }

    const now = new Date();
    const mediaUrl = URL.createObjectURL(fileOrBlob);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: currentUser.id,
      content: type === 'file' ? fileName : undefined,
      timestamp: now,
      status: 'sent',
      type,
      fileName,
      fileSize,
      fileType,
      mediaUrl,
      duration,
    };

    console.log('[Media Debug] creating local media message', {
      type,
      currentUserId: currentUser.id,
      senderId: newMessage.senderId,
      convId,
    });

    setUploadModal({
      open: true,
      fileName,
      fileType,
      status: 'success',
    });

    setTimeout(() => {
      setUploadModal({ open: false, status: 'uploading' });
      setMessages((prev) => ({
        ...prev,
        [convId]: [...(prev[convId] || []), newMessage],
      }));

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, lastMessage: newMessage, updatedAt: now } : c))
      );
    }, 500);
  }, [activeConversationId, currentUser]);

  const togglePin = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === conversationId) {
          const newIsPinned = !c.isPinned;
          return {
            ...c,
            isPinned: newIsPinned,
            pinnedAt: newIsPinned ? new Date() : undefined,
          };
        }
        return c;
      });
      persistPinnedIds(updated);
      return updated;
    });
  }, [persistPinnedIds]);

  const toggleMute = useCallback((conversationId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c
    ));
  }, []);

  const markUnread = useCallback((conversationId: string) => {
    removeReadConversationId(conversationId);
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: Math.max(c.unreadCount, 1) } : c
    ));
  }, []);

  const clearChat = useCallback((conversationId: string) => {
    setMessages(prev => ({
      ...prev,
      [conversationId]: [],
    }));
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, lastMessage: undefined } : c
    ));
  }, []);

  const deleteChat = useCallback((conversationId: string) => {
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setIsMobileChatOpen(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
      }
    }

    setConversations(prev => prev.filter(c => c.id !== conversationId));

    setMessages(prev => {
      const { [conversationId]: _, ...rest } = prev;
      return rest;
    });

    const updatedConvs = conversations.filter(c => c.id !== conversationId);
    persistPinnedIds(updatedConvs);
  }, [activeConversationId, conversations, persistPinnedIds]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const openRealConversation = useCallback(
    (conversation: Conversation, msgs: Message[], realUserId: string) => {
      console.log('[Messages] openRealConversation', conversation.id, msgs.length);
      realConversationIds.current.add(conversation.id);
      realUserIdRef.current = realUserId;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        // Mark as read (unreadCount = 0)
        const conversationWithRead = { ...conversation, unreadCount: 0 };
        if (exists) {
          return prev.map((c) => (c.id === conversation.id ? conversationWithRead : c));
        }
        return [conversationWithRead, ...prev];
      });

      setMessages((prev) => ({ ...prev, [conversation.id]: msgs }));

      setActiveConversationId(conversation.id);
      setIsMobileChatOpen(true);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(LAST_CONVERSATION_STORAGE_KEY, conversation.id);
      }

      // Mark as read in Supabase
      markConversationAsRead(conversation.id).catch((err) => {
        console.error('[Unread] mark read failed', err);
      });
    },
    []
  );

  const loadRealConversations = useCallback(async () => {
    if (!USE_REAL_CONVERSATIONS) return;

    setIsLoading(true);
    setError(null);

    const { conversations: loadedConvs, currentUserId, error: loadError } = await getMyConversations();

    if (loadError) {
      setError(loadError);
      setIsLoading(false);
      return;
    }

    if (currentUserId) {
      realUserIdRef.current = currentUserId;
      loadedConvs.forEach((c) => realConversationIds.current.add(c.id));
    }

    setConversations((prev) => {
      const merged = loadedConvs.map((loaded) => {
        const existing = prev.find((p) => p.id === loaded.id);
        if (existing) {
          return {
            ...loaded,
            isPinned: existing.isPinned ?? loaded.isPinned,
            isMuted: existing.isMuted ?? loaded.isMuted,
            pinnedAt: existing.pinnedAt ?? loaded.pinnedAt,
          };
        }
        return loaded;
      });
      return merged;
    });

    console.log('[Messages] loaded conversations', loadedConvs.length);
    setIsLoading(false);
  }, []);

  const loadCurrentUserProfile = useCallback(async () => {
    console.log('[Chat] loading current user profile');
    setIsLoadingCurrentUser(true);

    const { user, error } = await getCurrentUserProfile();

    if (error || !user) {
      console.error('[Chat] failed to load current user profile', error);
      setIsLoadingCurrentUser(false);
      return;
    }

    console.log('[Chat] current user profile loaded', user.id, user.name, user.avatar);
    setCurrentUserProfile(user);
    realUserIdRef.current = user.id;
    setIsLoadingCurrentUser(false);
  }, []);

  useEffect(() => {
    loadCurrentUserProfile();
  }, [loadCurrentUserProfile]);

  useEffect(() => {
    if (!isLoadingCurrentUser && currentUserProfile) {
      console.log('[Chat] profile ready, loading conversations');
      loadRealConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingCurrentUser, currentUserProfile?.id]);

  useEffect(() => {
    if (!USE_REAL_CONVERSATIONS || conversations.length === 0) return;

    const savedId = sessionStorage.getItem(LAST_CONVERSATION_STORAGE_KEY);
    if (savedId) {
      const conversationExists = conversations.some((c) => c.id === savedId);
      if (conversationExists) {
        console.log('[Messages] restoring active conversation', savedId);
        setActiveConversationId(savedId);
        setIsMobileChatOpen(true);
        setConversations((prev) =>
          prev.map((c) => (c.id === savedId ? { ...c, unreadCount: 0 } : c))
        );

        // Mark as read in Supabase for real conversations
        if (realConversationIds.current.has(savedId)) {
          markConversationAsRead(savedId).catch((err) => {
            console.error('[Unread] mark read failed', err);
          });
        }

        setMessages((prevMessages) => {
          const existingMessages = prevMessages[savedId];
          if (!existingMessages || existingMessages.length === 0) {
            console.log('[Messages] loading messages for restored conversation', savedId);
            setIsLoadingMessages(true);
            getConversationMessages(savedId).then(({ messages: loadedMessages, error }) => {
              if (error) {
                console.error('[Messages] load failed for restored conversation', savedId, error);
                setIsLoadingMessages(false);
                return;
              }
              console.log('[Messages] loaded count for restored conversation', savedId, loadedMessages.length);
              setMessages((prev) => ({
                ...prev,
                [savedId]: loadedMessages,
              }));
              setIsLoadingMessages(false);
            });
          }
          return prevMessages;
        });
      } else {
        sessionStorage.removeItem(LAST_CONVERSATION_STORAGE_KEY);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // Realtime: listen to INSERT messages for ALL loaded conversations.
  // Active conversation messages are appended immediately (with signed URLs & profiles).
  // Inactive conversations get sidebar lastMessage/updatedAt updated.
  useEffect(() => {
    // Only subscribe once we have loaded some real conversations
    if (realConversationIds.current.size === 0) return;

    console.log('[Realtime] subscribing to chat-messages channel');

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const row = payload.new as any;
          const convId = row.conversation_id;

          console.log('[Realtime] message inserted', row);

          // Ignore messages for conversations we haven't loaded
          if (!realConversationIds.current.has(convId)) {
            console.log('[Realtime] ignored message for unloaded conversation', convId);
            return;
          }

          // Avoid duplicates - check if we already have this message
          setMessages((prev) => {
            const current = prev[convId] || [];
            if (current.some((m) => m.id === row.id)) {
              console.log('[Realtime] duplicate message ignored', row.id);
              return prev;
            }
            // Trigger async message processing (cannot return promise from setState)
            processRealtimeMessage(row, convId);
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] subscription status', status);
      });

    return () => {
      console.log('[Realtime] cleanup chat-messages channel');
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // Process a realtime message: map row, generate signed URL, fetch sender profile
  const processRealtimeMessage = useCallback(async (row: any, convId: string) => {
    // 1. Map row to Message type
    const msg: Message = {
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
    };

    // 2. Generate signed URL if media
    if (row.media_url && ['image', 'file', 'voice', 'audio'].includes(row.type)) {
      try {
        const { data: signedUrlData } = await supabase.storage
          .from('chat-media')
          .createSignedUrl(row.media_url, 60 * 60 * 24 * 7);

        if (signedUrlData?.signedUrl) {
          (msg as any).mediaUrl = signedUrlData.signedUrl;
          (msg as any).mediaPath = row.media_url;
        }
      } catch (err) {
        console.error('[Realtime] signed URL generation failed', err);
      }
    }

    // 3. Fetch sender profile
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .eq('id', row.sender_id)
        .single();

      if (profile) {
        msg.senderProfile = {
          id: profile.id,
          name: profile.full_name || null,
          email: profile.email || null,
          avatarUrl: profile.avatar_url || null,
          role: profile.role || null,
        };
      }
    } catch (err) {
      console.error('[Realtime] sender profile fetch failed', err);
    }

    // 4. Default action states
    msg.isStarred = false;
    msg.hiddenAt = null;
    msg.reportedAt = null;
    msg.reportReason = null;

    // 5. Add message to state (re-check for duplicates)
    setMessages((prev) => {
      const current = prev[convId] || [];
      if (current.some((m) => m.id === msg.id)) {
        console.log('[Realtime] duplicate message ignored (post-process)', msg.id);
        return prev;
      }
      return {
        ...prev,
        [convId]: [...current, msg],
      };
    });

    // 6. Build sidebar preview content
    let previewContent = msg.content || '';
    const msgType = row.type || 'text';
    const msgFileName = row.file_name || '';
    const msgFileType = row.file_type || '';

    if (msgType === 'image') {
      previewContent = '📷 Photo';
    } else if (msgType === 'file') {
      // Check if video
      const ext = msgFileName.split('.').pop()?.toLowerCase() || '';
      if (msgFileType.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(ext)) {
        previewContent = `🎬 ${msgFileName}`;
      } else {
        previewContent = `📎 ${msgFileName}`;
      }
    } else if (msgType === 'voice') {
      previewContent = '🎤 Voice message';
    } else if (msgType === 'audio') {
      previewContent = `🎵 ${msgFileName || 'Audio'}`;
    }

    // 7. Update conversation lastMessage and updatedAt
    const previewMessage: Message = {
      ...msg,
      content: previewContent,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: previewMessage, updatedAt: msg.timestamp }
          : c
      )
    );
  }, []);

  const refreshConversations = useCallback(async () => {
    await loadRealConversations();
  }, [loadRealConversations]);

  const onToggleMessageStar = useCallback(async (messageId: string, isStarred: boolean) => {
    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      for (const [convId, msgs] of Object.entries(prev)) {
        updated[convId] = msgs.map((m) =>
          m.id === messageId ? { ...m, isStarred } : m
        );
      }
      return updated;
    });

    const { success, error } = await toggleMessageStar(messageId, isStarred);
    if (!success) {
      console.error('[Message Actions] star failed', error);
      setMessages((prev) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(prev)) {
          updated[convId] = msgs.map((m) =>
            m.id === messageId ? { ...m, isStarred: !isStarred } : m
          );
        }
        return updated;
      });
    }
  }, []);

  const onHideMessageForMe = useCallback(async (messageId: string) => {
    const now = new Date().toISOString();

    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      for (const [convId, msgs] of Object.entries(prev)) {
        updated[convId] = msgs.map((m) =>
          m.id === messageId ? { ...m, hiddenAt: now } : m
        );
      }
      return updated;
    });

    const { success, error } = await hideMessageForMe(messageId);
    if (!success) {
      console.error('[Message Actions] hide failed', error);
      setMessages((prev) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(prev)) {
          updated[convId] = msgs.map((m) =>
            m.id === messageId ? { ...m, hiddenAt: null } : m
          );
        }
        return updated;
      });
    }
  }, []);

  const onDeleteForEveryone = useCallback(async (messageId: string) => {
    const now = new Date().toISOString();
    const currentUserId = realUserIdRef.current;

    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      for (const [convId, msgs] of Object.entries(prev)) {
        updated[convId] = msgs.map((m) =>
          m.id === messageId
            ? {
                ...m,
                deletedAt: now,
                deletedBy: currentUserId ?? undefined,
                deleteScope: 'everyone',
                deleteReason: 'user_deleted_for_everyone',
                isStarred: false,
              }
            : m
        );
      }
      return updated;
    });

    const { success, error } = await deleteMessageForEveryone(messageId);
    if (!success) {
      console.error('[DeleteEveryone] failed, reverting local state', error);
      setMessages((prev) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(prev)) {
          updated[convId] = msgs.map((m) =>
            m.id === messageId
              ? { ...m, deletedAt: null, deletedBy: null, deleteScope: null, deleteReason: null }
              : m
          );
        }
        return updated;
      });
    }
  }, []);

  const onReportMessage = useCallback(async (messageId: string, reason: string) => {
    const now = new Date().toISOString();

    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      for (const [convId, msgs] of Object.entries(prev)) {
        updated[convId] = msgs.map((m) =>
          m.id === messageId ? { ...m, reportedAt: now, reportReason: reason } : m
        );
      }
      return updated;
    });

    const { success, error } = await reportMessage(messageId, reason);
    if (!success) {
      console.error('[Message Actions] report failed', error);
      setMessages((prev) => {
        const updated: Record<string, Message[]> = {};
        for (const [convId, msgs] of Object.entries(prev)) {
          updated[convId] = msgs.map((m) =>
            m.id === messageId ? { ...m, reportedAt: null, reportReason: null } : m
          );
        }
        return updated;
      });
    }
  }, []);

  return {
    activeConversationId,
    messages,
    conversations,
    isMobileChatOpen,
    isLoading,
    error,
    activeConversation,
    activeMessages,
    sortedConversations,
    currentUser,
    isLoadingCurrentUser,
    setActiveConversationId,
    setIsMobileChatOpen,
    setIsLoading,
    setError,
    selectConversation,
    backToList,
    sendMessage,
    sendAttachment,
    togglePin,
    toggleMute,
    markUnread,
    clearChat,
    deleteChat,
    refresh,
    openRealConversation,
    refreshConversations,
    isSendingMessage,
    sendMessageError,
    isLoadingMessages,
    onToggleMessageStar,
    onHideMessageForMe,
    onReportMessage,
    onDeleteForEveryone,
    highlightedMessageId,
    setHighlightedMessageId,
    uploadModal,
    setUploadModal,
  };
}