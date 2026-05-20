import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Conversation, Message, ChatUser, MessageReaction } from '../types';
import type { UploadModalState } from '../components/ChatUploadModal';
import { useAuth } from '../../../hooks/useAuth';
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
  markConversationMessagesAsRead,
  getPinnedMessages,
  pinMessage,
  unpinMessage,
  getConversationReactions,
  addOrUpdateReaction,
  removeReaction,
  type PinnedMessageWithData,
} from '../services/supabaseChatService';
import { supabase } from '../../../lib/supabase';
import {
  setActiveConversationForNotifications,
  setCachedLocalUserId,
} from '../services/chatNotifications';

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
  totalUnreadCount: number;
  unreadChatsCount: number;

  // Actions
  setActiveConversationId: (id: string | null) => void;
  setIsMobileChatOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectConversation: (id: string) => void;
  backToList: () => void;
  sendMessage: (content: string, replyTo?: { messageId: string; preview: string; senderName: string; messageType: string } | null) => void;
  sendAttachment: (attachmentData: { type: 'image' | 'file' | 'voice' | 'audio'; fileOrBlob: File | Blob; fileName: string; fileSize: number; fileType: string; duration?: number }, replyTo?: { messageId: string; preview: string; senderName: string; messageType: string } | null) => void;
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

  // Pinned messages
  pinnedMessages: PinnedMessageWithData[];
  isLoadingPinnedMessages: boolean;
  pinMessageError: string | null;
  onPinMessage: (messageId: string) => Promise<void>;
  onUnpinMessage: (messageId: string) => Promise<void>;
  loadPinnedMessages: (conversationId: string) => Promise<void>;

  // Message reactions
  messageReactions: Record<string, MessageReaction[]>; // keyed by messageId
  onAddReaction: (messageId: string, emoji: string) => Promise<void>;
  onRemoveReaction: (messageId: string) => Promise<void>;
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

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageWithData[]>([]);
  const [isLoadingPinnedMessages, setIsLoadingPinnedMessages] = useState(false);
  const [pinMessageError, setPinMessageError] = useState<string | null>(null);

  // Message reactions state - keyed by messageId
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>({});

  // Track which conversation IDs are real Supabase conversations
  const realConversationIds = useRef<Set<string>>(new Set());

  // Track the real current user ID (from Supabase auth)
  const realUserIdRef = useRef<string | null>(null);

  // Track the current user profile (from public.profiles)
  const [currentUserProfile, setCurrentUserProfile] = useState<ChatUser | null>(null);

  // Refs to avoid stale closures in realtime callbacks
  const activeConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  // Loading state for current user profile
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);

  // Use real conversations flag (dev-only, could be disabled for mock fallback)
  const USE_REAL_CONVERSATIONS = true;

  const { session, isAuthReady, isProfileReady } = useAuth();

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Conversations state - starts empty, loads real conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Keep refs synced with state to avoid stale closures
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
    // Sync to notification suppression tracker
    setActiveConversationForNotifications(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserProfile?.id || null;
    // Cache local user id for notification suppression
    setCachedLocalUserId(currentUserProfile?.id || null);
  }, [currentUserProfile?.id]);

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

  // Total unread counts for UI badges
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const unreadChatsCount = useMemo(() => {
    return conversations.filter((c) => (c.unreadCount || 0) > 0).length;
  }, [conversations]);

  // Debug log for unread UI and notify navbar
  useEffect(() => {
    console.log('[Unread UI]', {
      totalUnreadCount,
      unreadChatsCount,
    });

    // Notify navbar and other components that unread count changed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('chat-unread-updated'));
    }
  }, [totalUnreadCount, unreadChatsCount]);

  // Actions
  const selectConversation = useCallback(async (id: string) => {
    console.log('[Messages] selectConversation called', id);
    console.log('[Read Receipts Debug] selectConversation currentUserIdRef:', currentUserIdRef.current);
    console.log('[Read Receipts Debug] selectConversation currentUserProfile?.id:', currentUserProfile?.id);
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

      // Load messages and reactions in parallel with error handling
      let loadedMessages: Message[] = [];
      let reactionsMap: Record<string, MessageReaction[]> = {};

      try {
        const [{ messages: msgs, error: msgErr }, { reactions, error: reactionErr }] = await Promise.all([
          getConversationMessages(id),
          getConversationReactions(id).catch((err) => {
            console.error('[Reactions] load error (non-fatal):', err);
            return { reactions: {}, error: err?.message };
          }),
        ]);

        if (msgErr) {
          console.error('[Messages] load failed', id, msgErr);
          setIsLoadingMessages(false);
          return;
        }

        loadedMessages = msgs || [];
        reactionsMap = reactions || {};

        // Attach reactions to messages safely
        const messagesWithReactions = loadedMessages.map((msg) => ({
          ...msg,
          reactions: Array.isArray(reactionsMap[msg.id]) ? reactionsMap[msg.id] : [],
        }));

        console.log('[Messages] loaded with reactions', id, messagesWithReactions.length, 'messages');
        setMessages((prev) => ({
          ...prev,
          [id]: messagesWithReactions,
        }));

        // Store reactions in state for future use
        setMessageReactions(reactionsMap);
      } catch (err) {
        console.error('[Messages] unexpected error loading messages:', err);
        // Don't crash - just set empty messages
        setMessages((prev) => ({
          ...prev,
          [id]: [],
        }));
      }

      setIsLoadingMessages(false);

      // Mark incoming messages as read for read receipts (don't block)
      // Use realUserIdRef which has the actual Supabase auth user ID
      const currentUserIdForRead = realUserIdRef.current || currentUserIdRef.current;
      console.log('[Read Receipts Debug] realUserIdRef.current:', realUserIdRef.current);
      console.log('[Read Receipts Debug] currentUserIdRef.current:', currentUserIdRef.current);
      console.log('[Read Receipts Debug] using currentUserIdForRead:', currentUserIdForRead);
      if (currentUserIdForRead) {
        const userIdForRead = currentUserIdForRead; // narrow type
        console.log('[Read Receipts] marking messages as read for conversation', id);
        markConversationMessagesAsRead(id, userIdForRead).then((result) => {
          if (result.success && result.data && result.data.length > 0) {
            console.log('[Read Receipts] updating local state with read messages', result.data);
            // Update local messages state immediately
            setMessages((prev) => {
              const conversationMessages = prev[id] || [];
              const updatedMessages = conversationMessages.map((msg) => {
                const updated = result.data?.find((item) => item.id === msg.id);
                if (!updated) return msg;
                return {
                  ...msg,
                  readAt: updated.read_at,
                };
              });
              return {
                ...prev,
                [id]: updatedMessages,
              };
            });
          }
        }).catch((err) => {
          console.error('[Read Receipts] mark messages as read failed', err);
        });
      }
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

  const sendMessage = useCallback((content: string, replyTo?: { messageId: string; preview: string; senderName: string; messageType: string } | null) => {
    console.log('[CHAT] sending message', { conversationId: activeConversationId, content: content.slice(0, 50), replyTo });

    if (!activeConversationId) return;

    if (realConversationIds.current.has(activeConversationId)) {
      const convId = activeConversationId;
      setIsSendingMessage(true);
      setSendMessageError(null);

      // Create optimistic message immediately
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        conversationId: convId,
        senderId: currentUser.id,
        content,
        timestamp: new Date(),
        status: 'sending',
        type: 'text',
        // Add reply fields to optimistic message
        replyToMessageId: replyTo?.messageId ?? null,
        replyToPreview: replyTo?.preview ?? null,
        replyToSenderName: replyTo?.senderName ?? null,
        replyToMessageType: replyTo?.messageType ?? null,
      };

      console.log('[CHAT] optimistic message appended', optimisticId);
      setMessages((prev) => ({
        ...prev,
        [convId]: [...(prev[convId] || []), optimisticMessage],
      }));

      supabaseSendTextMessage(convId, content, replyTo ?? null).then(({ message: msg, error: err }) => {
        if (err || !msg) {
          console.error('[Messages] send failed', convId, err);
          setSendMessageError(err || 'Failed to send');
          // Mark optimistic message as failed
          setMessages((prev) => {
            const current = prev[convId] || [];
            return {
              ...prev,
              [convId]: current.map((m) =>
                m.id === optimisticId ? { ...m, status: 'failed' } : m
              ),
            };
          });
          setIsSendingMessage(false);
          return;
        }

        console.log('[Messages] sent successfully, replacing optimistic', optimisticId, 'with', msg.id);
        console.log('[Messages] saved message reply data', {
          replyToMessageId: msg.replyToMessageId,
          replyToPreview: msg.replyToPreview,
          replyToSenderName: msg.replyToSenderName,
          replyToMessageType: msg.replyToMessageType
        });

        // Replace optimistic message with real one
        setMessages((prev) => {
          const current = prev[convId] || [];
          const exists = current.some((m) => m.id === msg.id);
          if (exists) {
            console.log('[CHAT] message already exists (from realtime), removing optimistic');
            return {
              ...prev,
              [convId]: current.filter((m) => m.id !== optimisticId),
            };
          }
          return {
            ...prev,
            [convId]: current.map((m) =>
              m.id === optimisticId ? msg : m
            ),
          };
        });

        setConversations((prev) => {
          console.log('[CHAT] conversations updated without refetch');
          return prev.map((c) => (c.id === convId ? { ...c, lastMessage: msg, updatedAt: msg.timestamp } : c));
        });

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
  }, replyTo?: { messageId: string; preview: string; senderName: string; messageType: string } | null) => {
    if (!activeConversationId) return;

    const convId = activeConversationId;

    setUploadModal({
      open: true,
      fileName,
      fileType,
      status: 'uploading',
    });

    if (realConversationIds.current.has(convId)) {
      console.log('[Media] uploading to Supabase Storage', convId, { replyTo });

      const { message, error } = await supabaseSendMediaMessage({
        conversationId: convId,
        type,
        fileOrBlob,
        fileName,
        fileSize,
        fileType,
        duration,
        replyTo: replyTo ?? null,
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
    // Safely access session properties (session comes from JS context)
    const sessionAny = session as any;
    const currentAuthUserId = sessionAny?.id || sessionAny?.user?.id || null;

    if (!isAuthReady || !isProfileReady) {
      console.warn('[Chat] profile load skipped: auth/profile not ready', {
        isAuthReady,
        isProfileReady,
        currentAuthUserId,
      });
      setIsLoadingCurrentUser(false);
      return;
    }

    if (!currentAuthUserId) {
      console.warn('[Chat] profile load skipped: no auth user', {
        isAuthReady,
        isProfileReady,
        currentAuthUserId,
      });
      setIsLoadingCurrentUser(false);
      return;
    }

    console.log('[Chat] loading current user profile', {
      isAuthReady,
      isProfileReady,
      currentAuthUserId,
    });
    setIsLoadingCurrentUser(true);

    let attempt = 0;
    let result;

    while (attempt < 2) {
      result = await getCurrentUserProfile();

      if (result.user) {
        console.log('[Chat] current user profile loaded', result.user.id, result.user.name, result.user.avatar);
        setCurrentUserProfile(result.user);
        realUserIdRef.current = result.user.id;
        setIsLoadingCurrentUser(false);
        return;
      }

      const temporary = (result as any)?.temporary;
      if ((temporary || result.error === 'Not authenticated') && attempt === 0) {
        console.warn('[Chat] profile load transient error, retrying', result.error);
        await sleep(1000);
        attempt += 1;
        continue;
      }

      console.error('[Chat] failed to load current user profile', result.error);
      setIsLoadingCurrentUser(false);
      return;
    }
  }, [isAuthReady, isProfileReady, session]);

  useEffect(() => {
    // Safely access session properties (session comes from JS context)
    const sessionAny = session as any;
    const currentAuthUserId = sessionAny?.id || sessionAny?.user?.id;

    console.log('[Chat Auth Gate]', {
      isAuthReady,
      isProfileReady,
      hasSession: !!session,
      authUserId: currentAuthUserId,
    });

    if (!isAuthReady || !isProfileReady) {
      console.log('[Chat] waiting for auth/profile ready');
      return;
    }

    if (!currentAuthUserId) {
      console.warn('[Chat] auth/profile ready but no user/session, skipping chat load', {
        isAuthReady,
        isProfileReady,
        currentAuthUserId,
      });
      return;
    }

    loadCurrentUserProfile();
  }, [isAuthReady, isProfileReady, session, loadCurrentUserProfile]);

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

          // Also mark messages as read for read receipts
          const currentUserIdForRead = realUserIdRef.current || currentUserIdRef.current;
          if (currentUserIdForRead) {
            const userIdForRead = currentUserIdForRead; // narrow type
            markConversationMessagesAsRead(savedId, userIdForRead).then((result) => {
              if (result.success && result.data && result.data.length > 0) {
                console.log('[Read Receipts Restore] updating local state', result.data);
                setMessages((prev) => {
                  const conversationMessages = prev[savedId] || [];
                  const updatedMessages = conversationMessages.map((msg) => {
                    const updated = result.data?.find((item) => item.id === msg.id);
                    if (!updated) return msg;
                    return {
                      ...msg,
                      readAt: updated.read_at,
                    };
                  });
                  return {
                    ...prev,
                    [savedId]: updatedMessages,
                  };
                });
              }
            }).catch((err) => {
              console.error('[Read Receipts Restore] mark failed', err);
            });
          }
        }
      }
    }
  }, [conversations.length]);

  // Realtime: listen to INSERT messages for ALL loaded conversations.
  // Active conversation messages are appended immediately without reload.
  // Inactive conversations get sidebar lastMessage/updatedAt updated and unread incremented.
  useEffect(() => {
    // Only subscribe once we have loaded some real conversations
    if (realConversationIds.current.size === 0) return;

    console.log('[CHAT] subscription created for messages INSERT');
    console.log('[CHAT] subscription covers conversations:', Array.from(realConversationIds.current));

    const channel = supabase
      .channel('chat-messages-insert')
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

          console.log('[REALTIME MESSAGE RECEIVED]', payload.new);
          console.log('[REALTIME REPLY DATA]', {
            reply_to_message_id: payload.new.reply_to_message_id,
            reply_to_preview: payload.new.reply_to_preview,
            reply_to_sender_name: payload.new.reply_to_sender_name,
            reply_to_message_type: payload.new.reply_to_message_type
          });

          // Ignore messages for conversations we haven't loaded
          if (!realConversationIds.current.has(convId)) {
            console.log('[Realtime Insert] ignored unknown conversation', convId);
            return;
          }

          // Check if this is for the active conversation
          const isActiveConversation = convId === activeConversationIdRef.current;
          const currentUserId = realUserIdRef.current || currentUserIdRef.current;
          const isFromOtherUser = row.sender_id !== currentUserId;

          if (isActiveConversation) {
            console.log('[CHAT] realtime message received for active conversation', convId);

            // Check for duplicate using functional state update to avoid stale closure
            setMessages((prev) => {
              const existingMessages = prev[convId] || [];
              if (existingMessages.some((m) => m.id === row.id)) {
                console.log('[CHAT] ignored duplicate message', row.id);
                return prev;
              }

              console.log('[CHAT] appending new message without reload', row.id);

              // Build the new message object from the row
              const newMessage: Message = {
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
                hiddenAt: null,
                isStarred: false,
                readAt: isFromOtherUser ? null : new Date().toISOString(), // Mark own messages as read
                // Reply fields - map from database column names
                replyToMessageId: row.reply_to_message_id ?? row.replyToMessageId ?? null,
                replyToPreview: row.reply_to_preview ?? row.replyToPreview ?? null,
                replyToSenderName: row.reply_to_sender_name ?? row.replyToSenderName ?? null,
                replyToMessageType: row.reply_to_message_type ?? row.replyToMessageType ?? null,
              };

              return {
                ...prev,
                [convId]: [...existingMessages, newMessage],
              };
            });

            // Keep unread at 0 for active conversation - build lastMessage from row
            const lastMsgPreview: Message = {
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
              // Reply fields - map from database column names
              replyToMessageId: row.reply_to_message_id ?? row.replyToMessageId ?? null,
              replyToPreview: row.reply_to_preview ?? row.replyToPreview ?? null,
              replyToSenderName: row.reply_to_sender_name ?? row.replyToSenderName ?? null,
              replyToMessageType: row.reply_to_message_type ?? row.replyToMessageType ?? null,
            };

            setConversations((prev) => {
              console.log('[CHAT] conversations updated without refetch (active)');
              return prev.map((c) =>
                c.id === convId
                  ? { ...c, lastMessage: lastMsgPreview, updatedAt: lastMsgPreview.timestamp, unreadCount: 0 }
                  : c
              );
            });
          } else {
            // Inactive conversation - increment unread count and update sidebar
            console.log('[CHAT] realtime message for inactive conversation', convId);

            setConversations((prev) => {
              return prev.map((c) => {
                if (c.id !== convId) return c;
                const currentUnread = c.unreadCount || 0;
                return {
                  ...c,
                  lastMessage: {
                    id: row.id,
                    conversationId: row.conversation_id,
                    senderId: row.sender_id,
                    content: row.content || undefined,
                    timestamp: new Date(row.created_at),
                    status: 'sent',
                    type: row.type || 'text',
                  },
                  updatedAt: new Date(row.created_at),
                  unreadCount: isFromOtherUser ? currentUnread + 1 : currentUnread,
                };
              });
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[CHAT] subscription status:', status);
      });

    return () => {
      console.log('[CHAT] cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime: subscribe to messages for the ACTIVE conversation only
  // This ensures messages appear instantly when the chat is open
  useEffect(() => {
    if (!activeConversationId) return;

    console.log('[MESSAGES REALTIME] subscribing to', activeConversationId);
    console.log('[ACTIVE CONVERSATION ID]', activeConversationId);

    const channel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          console.log('[MESSAGES REALTIME] INSERT received', payload.new);
          console.log('[MESSAGES REALTIME] payload', payload);
          console.log('[MESSAGES REALTIME] activeConversation', activeConversationId);

          const row = payload.new as any;
          const convId = row.conversation_id;

          // Double-check this is for the active conversation
          if (convId !== activeConversationId) {
            console.log('[MESSAGES REALTIME] ignored - wrong conversation', convId);
            return;
          }

          // Check for duplicate
          setMessages((prev) => {
            const existingMessages = prev[convId] || [];
            console.log('[MESSAGES STATE] before append', existingMessages.length);

            if (existingMessages.some((m) => m.id === row.id)) {
              console.log('[MESSAGES REALTIME] ignored duplicate', row.id);
              return prev;
            }

            console.log('[MESSAGES REALTIME] appending message', row.id);

            const currentUserId = realUserIdRef.current || currentUserIdRef.current;
            const isFromOtherUser = row.sender_id !== currentUserId;

            // Build new message object
            const newMessage: Message = {
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
              hiddenAt: null,
              isStarred: false,
              readAt: isFromOtherUser ? null : new Date().toISOString(),
              // Reply fields - map from database column names
              replyToMessageId: row.reply_to_message_id ?? row.replyToMessageId ?? null,
              replyToPreview: row.reply_to_preview ?? row.replyToPreview ?? null,
              replyToSenderName: row.reply_to_sender_name ?? row.replyToSenderName ?? null,
              replyToMessageType: row.reply_to_message_type ?? row.replyToMessageType ?? null,
              reactions: [], // Initialize with empty reactions, will be populated by reactions realtime
            };

            return {
              ...prev,
              [convId]: [...existingMessages, newMessage],
            };
          });

          // Update sidebar last message without refetching
          console.log('[CONVERSATION LIST] updating last message');
          setConversations((prev) => {
            return prev.map((c) => {
              if (c.id !== convId) return c;
              return {
                ...c,
                lastMessage: {
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
                  replyToMessageId: row.reply_to_message_id ?? null,
                  replyToPreview: row.reply_to_preview ?? null,
                  replyToSenderName: row.reply_to_sender_name ?? null,
                  replyToMessageType: row.reply_to_message_type ?? null,
                } as Message,
                updatedAt: new Date(row.created_at),
                // Keep unread at 0 for active conversation
                unreadCount: 0,
              };
            });
          });
        }
      )
      .subscribe((status) => {
        console.log('[MESSAGES REALTIME] subscription status', status);
      });

    return () => {
      console.log('[MESSAGES REALTIME] cleanup', activeConversationId);
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  // Realtime: subscribe to message_reactions for the ACTIVE conversation only
  useEffect(() => {
    if (!activeConversationId) return;

    console.log('[REACTIONS REALTIME] subscribing to', activeConversationId);

    const channel = supabase
      .channel(`message-reactions:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          console.log('[REACTIONS REALTIME] event received', payload.eventType, payload);

          const reaction = (payload.new || payload.old) as any;
          const messageId = reaction?.message_id;

          if (!messageId) {
            console.warn('[REACTIONS REALTIME] missing message_id', payload);
            return;
          }

          console.log('[REACTIONS REALTIME] applying to message', messageId);

          // Update messages state directly
          setMessages((prev) => {
            const conversationMessages = prev[activeConversationId] || [];

            const updatedMessages = conversationMessages.map((msg) => {
              if (msg.id !== messageId) return msg;

              const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];

              if (payload.eventType === 'INSERT') {
                const newReaction: MessageReaction = {
                  id: reaction.id,
                  messageId: reaction.message_id,
                  conversationId: reaction.conversation_id,
                  userId: reaction.user_id,
                  emoji: reaction.emoji,
                  createdAt: reaction.created_at,
                  updatedAt: reaction.updated_at,
                };

                const exists = currentReactions.some(
                  (r) =>
                    r.id === newReaction.id ||
                    (r.messageId === newReaction.messageId && r.userId === newReaction.userId)
                );

                if (exists) return msg;

                const updatedMessage = {
                  ...msg,
                  reactions: [...currentReactions, newReaction],
                };
                console.log('[MESSAGE REACTIONS AFTER UPDATE]', updatedMessage.reactions);
                return updatedMessage;
              }

              if (payload.eventType === 'UPDATE') {
                const updatedReaction: MessageReaction = {
                  id: reaction.id,
                  messageId: reaction.message_id,
                  conversationId: reaction.conversation_id,
                  userId: reaction.user_id,
                  emoji: reaction.emoji,
                  createdAt: reaction.created_at,
                  updatedAt: reaction.updated_at,
                };

                const updatedMessage = {
                  ...msg,
                  reactions: currentReactions.map((r) =>
                    r.id === updatedReaction.id ||
                    (r.messageId === updatedReaction.messageId && r.userId === updatedReaction.userId)
                      ? updatedReaction
                      : r
                  ),
                };
                console.log('[MESSAGE REACTIONS AFTER UPDATE]', updatedMessage.reactions);
                return updatedMessage;
              }

              if (payload.eventType === 'DELETE') {
                const deletedReaction = payload.old as any;

                const updatedMessage = {
                  ...msg,
                  reactions: currentReactions.filter(
                    (r) =>
                      r.id !== deletedReaction?.id &&
                      !(r.messageId === deletedReaction?.message_id && r.userId === deletedReaction?.user_id)
                  ),
                };
                console.log('[MESSAGE REACTIONS AFTER UPDATE]', updatedMessage.reactions);
                return updatedMessage;
              }

              return msg;
            });

            return {
              ...prev,
              [activeConversationId]: updatedMessages,
            };
          });

          // Also update messageReactions state for reference
          setMessageReactions((prev) => {
            const currentReactions = prev[messageId] || [];

            if (payload.eventType === 'INSERT') {
              const newReaction: MessageReaction = {
                id: reaction.id,
                messageId: reaction.message_id,
                conversationId: reaction.conversation_id,
                userId: reaction.user_id,
                emoji: reaction.emoji,
                createdAt: reaction.created_at,
                updatedAt: reaction.updated_at,
              };
              const exists = currentReactions.some(
                (r) =>
                  r.id === newReaction.id ||
                  (r.messageId === newReaction.messageId && r.userId === newReaction.userId)
              );
              if (exists) return prev;
              return {
                ...prev,
                [messageId]: [...currentReactions, newReaction],
              };
            }

            if (payload.eventType === 'UPDATE') {
              const updatedReaction: MessageReaction = {
                id: reaction.id,
                messageId: reaction.message_id,
                conversationId: reaction.conversation_id,
                userId: reaction.user_id,
                emoji: reaction.emoji,
                createdAt: reaction.created_at,
                updatedAt: reaction.updated_at,
              };
              return {
                ...prev,
                [messageId]: currentReactions.map((r) =>
                  r.id === updatedReaction.id ||
                  (r.messageId === updatedReaction.messageId && r.userId === updatedReaction.userId)
                    ? updatedReaction
                    : r
                ),
              };
            }

            if (payload.eventType === 'DELETE') {
              const deletedReaction = payload.old as any;
              return {
                ...prev,
                [messageId]: currentReactions.filter(
                  (r) =>
                    r.id !== deletedReaction?.id &&
                    !(r.messageId === deletedReaction?.message_id && r.userId === deletedReaction?.user_id)
                ),
              };
            }

            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('[REACTIONS REALTIME] subscription status', status);
      });

    return () => {
      console.log('[REACTIONS REALTIME] cleanup', activeConversationId);
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

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

  // Load pinned messages for a conversation
  const loadPinnedMessages = useCallback(async (conversationId: string) => {
    console.log('[Pinned Messages] fetch CALLED', {
      conversationId,
      isRealConversation: realConversationIds.current.has(conversationId),
    });

    if (!realConversationIds.current.has(conversationId)) {
      // Mock conversations don't support pinned messages
      console.log('[Pinned Messages] skipping mock conversation');
      setPinnedMessages([]);
      return;
    }

    setIsLoadingPinnedMessages(true);
    setPinMessageError(null);

    const { pinnedMessages: loaded, error } = await getPinnedMessages(conversationId);

    console.log('[Pinned Messages] fetch result', {
      count: loaded?.length || 0,
      data: loaded,
      error,
    });

    if (error) {
      console.error('[Pinned] load failed', error);
      setPinMessageError(error);
    } else {
      console.log('[Pinned] loaded', loaded.length);
      setPinnedMessages(loaded);
    }

    setIsLoadingPinnedMessages(false);
  }, []);

  // Pin a message
  const onPinMessage = useCallback(async (messageId: string) => {
    console.log('[Pinned Messages] pin CALLED', {
      conversationId: activeConversationId,
      messageId,
      pinnedMessagesCount: pinnedMessages.length,
    });

    if (!activeConversationId) {
      console.warn('[Pin] no active conversation');
      return;
    }

    setPinMessageError(null);

    const { success, error, errorCode } = await pinMessage(activeConversationId, messageId);

    console.log('[Pinned Messages] pin RPC result', {
      success,
      error,
      errorCode,
    });

    if (!success) {
      console.error('[Pin] failed', error);
      setPinMessageError(error);

      // Show alert for max pinned messages
      if (errorCode === 'MAX_PINNED') {
        alert(error); // User-friendly error message from service
      }
      return;
    }

    console.log('[Pin] success', messageId);
    // Reload pinned messages
    await loadPinnedMessages(activeConversationId);
  }, [activeConversationId, loadPinnedMessages, pinnedMessages.length]);

  // Unpin a message
  const onUnpinMessage = useCallback(async (messageId: string) => {
    console.log('[Pinned Messages] unpin CALLED', {
      conversationId: activeConversationId,
      messageId,
    });

    if (!activeConversationId) {
      console.warn('[Unpin] no active conversation');
      return;
    }

    setPinMessageError(null);

    const { success, error } = await unpinMessage(activeConversationId, messageId);

    console.log('[Pinned Messages] unpin RPC result', {
      success,
      error,
    });

    if (!success) {
      console.error('[Unpin] failed', error);
      setPinMessageError(error);
      return;
    }

    console.log('[Unpin] success', messageId);
    // Update local state
    setPinnedMessages((prev) => prev.filter((p) => p.messageId !== messageId));
  }, [activeConversationId]);

  // Load pinned messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadPinnedMessages(activeConversationId);
    } else {
      setPinnedMessages([]);
    }
  }, [activeConversationId, loadPinnedMessages]);

  // Message reactions handlers
  const onAddReaction = useCallback(async (messageId: string, emoji: string) => {
    const convId = activeConversationId;
    if (!convId) return;

    console.log('[REACTION ACTION] insert/update', { messageId, emoji });

    // Optimistic update
    setMessageReactions((prev) => {
      const currentReactions = prev[messageId] || [];
      const newReaction: MessageReaction = {
        id: `temp-${Date.now()}`,
        messageId,
        conversationId: convId,
        userId: realUserIdRef.current || 'unknown',
        emoji,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [messageId]: [...currentReactions, newReaction],
      };
    });

    // Update messages with new reaction
    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      for (const [id, msgs] of Object.entries(prev)) {
        updated[id] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          return {
            ...m,
            reactions: [...currentReactions, {
              id: `temp-${Date.now()}`,
              messageId,
              conversationId: convId,
              userId: realUserIdRef.current || 'unknown',
              emoji,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
          };
        });
      }
      return updated;
    });

    const { reaction, error } = await addOrUpdateReaction(messageId, convId, emoji);

    if (error || !reaction) {
      console.error('[Reactions] add failed', error);
      // Revert optimistic update
      setMessageReactions((prev) => {
        const currentReactions = prev[messageId] || [];
        return {
          ...prev,
          [messageId]: currentReactions.filter((r) => r.id !== `temp-${Date.now()}`),
        };
      });
      return;
    }

    console.log('[REACTION] inserted', reaction.id);
  }, [activeConversationId]);

  const onRemoveReaction = useCallback(async (messageId: string) => {
    const convId = activeConversationId;
    if (!convId) return;

    console.log('[REACTION ACTION] delete', { messageId });

    // Optimistic update
    setMessageReactions((prev) => {
      const currentReactions = prev[messageId] || [];
      const userId = realUserIdRef.current;
      return {
        ...prev,
        [messageId]: currentReactions.filter((r) => r.userId !== userId),
      };
    });

    // Update messages
    setMessages((prev) => {
      const updated: Record<string, Message[]> = {};
      const userId = realUserIdRef.current;
      for (const [id, msgs] of Object.entries(prev)) {
        updated[id] = msgs.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          return {
            ...m,
            reactions: currentReactions.filter((r) => r.userId !== userId),
          };
        });
      }
      return updated;
    });

    const { success, error } = await removeReaction(messageId);

    if (!success) {
      console.error('[Reactions] remove failed', error);
      // Note: In a production app, you might want to re-fetch reactions here
    }
  }, [activeConversationId]);

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
    totalUnreadCount,
    unreadChatsCount,
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

    // Pinned messages
    pinnedMessages,
    isLoadingPinnedMessages,
    pinMessageError,
    onPinMessage,
    onUnpinMessage,
    loadPinnedMessages,

    // Message reactions
    messageReactions,
    onAddReaction,
    onRemoveReaction,
  };
}