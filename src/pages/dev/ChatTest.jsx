import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatLayout, ChatDevRail } from '../../features/chat';
import {
  requestNotificationPermission,
  showUnreadNotification,
  hasMockNotificationBeenShown,
  markMockNotificationShown,
  playNotificationSound,
} from '../../features/chat';
import { getAvailableProfiles } from '../../features/chat/services/profileService';
import { getOrCreateDirectConversation, getConversationById, getConversationMessages, createGroupConversation } from '../../features/chat/services/supabaseChatService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Dev-only test page for the experimental chat feature.
 * This page is NOT available in production.
 * Access: /dev/chat-test
 */
function ChatTest() {
  const navigate = useNavigate();
  const { session } = useAuth();
  // Disable in production
  const isProd = import.meta.env.PROD;

  // Available Users panel state
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [startingChatFor, setStartingChatFor] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  // Ref to ChatLayout actions for opening real conversations
  const chatActionsRef = useRef(null);
  const selectConversationRef = useRef(null);

  const fetchProfiles = async () => {
    console.log('[Profiles Debug] fetchProfiles() called');
    if (!session) {
      console.log('[Profiles Debug] current user not ready yet');
      setProfilesError('Waiting for auth session...');
      setProfilesLoading(false);
      return;
    }
    setProfilesLoading(true);
    setProfilesError(null);
    const currentUserId = session.id || null;
    console.log('[Profiles Debug] current auth user', session);
    console.log('[Profiles Debug] current user id passed', currentUserId);
    const { data, error } = await getAvailableProfiles(currentUserId);
    if (error) {
      setProfilesError(error);
    } else {
      setProfiles(data || []);
    }
    setProfilesLoading(false);
  };

  const handleStartChat = async (targetUserId, targetName) => {
    console.log('[Chat] start chat clicked', targetUserId, targetName);
    setStartingChatFor(targetUserId);

    // Step 1: Get or create the conversation
    const { conversationId, error } = await getOrCreateDirectConversation(targetUserId);

    if (error || !conversationId) {
      console.error('[Chat] start chat failed', error);
      setStartingChatFor(null);
      return;
    }

    console.log('[Chat] conversation ready', conversationId);

    // Step 2: Load the conversation and messages from Supabase
    const [convoResult, msgsResult] = await Promise.all([
      getConversationById(conversationId),
      getConversationMessages(conversationId),
    ]);

    if (convoResult.error || !convoResult.conversation) {
      console.error('[Chat] load real conversation failed', convoResult.error);
      setStartingChatFor(null);
      return;
    }

    if (msgsResult.error) {
      console.error('[Chat] load real messages failed', msgsResult.error);
    }

    // Step 3: Open in ChatWindow via ChatLayout actions
    if (chatActionsRef.current) {
      chatActionsRef.current.openRealConversation(
        convoResult.conversation,
        msgsResult.messages || [],
        convoResult.currentUserId
      );
    }

    // Step 4: Refresh conversations list so new conversation appears in sidebar
    await refreshAndSelectConversation(conversationId);

    setStartingChatFor(null);
  };

  const handleChatLayoutReady = (actions) => {
    chatActionsRef.current = actions;
    selectConversationRef.current = actions.selectConversation;
    setCurrentUserId(actions.currentUserId);
    setTotalUnreadCount(actions.totalUnreadCount);
    setUnreadChatsCount(actions.unreadChatsCount);
  };

  const handleCreateGroup = async (title, memberIds) => {
    console.log('[ChatTest] creating group', { title, memberIds });
    const { conversationId, error } = await createGroupConversation({ title, memberIds });

    if (error || !conversationId) {
      console.error('[ChatTest] create group failed', error);
      return null;
    }

    console.log('[ChatTest] group created, loading conversation', conversationId);

    // Load the new group conversation
    const [convoResult, msgsResult] = await Promise.all([
      getConversationById(conversationId),
      getConversationMessages(conversationId),
    ]);

    if (convoResult.error || !convoResult.conversation) {
      console.error('[ChatTest] load group conversation failed', convoResult.error);
      return conversationId; // Still return ID so it can be selected later
    }

    // Open the group conversation
    if (chatActionsRef.current) {
      chatActionsRef.current.openRealConversation(
        convoResult.conversation,
        msgsResult.messages || [],
        convoResult.currentUserId
      );
    }

    // Refresh conversations list
    if (chatActionsRef.current?.refreshConversations) {
      await chatActionsRef.current.refreshConversations();
    }

    return conversationId;
  };

  const handleSelectConversation = (conversationId, messageId) => {
    if (messageId && chatActionsRef.current?.selectConversationAndHighlight) {
      chatActionsRef.current.selectConversationAndHighlight(conversationId, messageId);
    } else if (selectConversationRef.current) {
      selectConversationRef.current(conversationId);
    }
  };

  // Helper to refresh and select a conversation
  const refreshAndSelectConversation = async (conversationId) => {
    if (chatActionsRef.current?.refreshConversations) {
      await chatActionsRef.current.refreshConversations();
    }
    // After refresh, select the conversation
    if (chatActionsRef.current?.openRealConversation && conversationId) {
      // The conversation should now be in the list from refresh
      // Just activate it via selectConversation which is handled by ChatLayout internally
      // We need to trigger selection - for now we rely on the fact that
      // openRealConversation was already called earlier, so the conversation exists
    }
  };

  const handleCopyId = useCallback((id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  // Auto-show notification on first load (once per session) - uses real unread counts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (totalUnreadCount === 0) return;
    if (hasMockNotificationBeenShown()) return;

    // Delay slightly to not be too intrusive
    const timer = setTimeout(() => {
      if (Notification.permission === 'granted') {
        showUnreadNotification(totalUnreadCount, unreadChatsCount, () => {
          // On notification click, navigate to chat
          window.focus();
        });
        playNotificationSound();
        markMockNotificationShown();
      } else if (Notification.permission === 'default') {
        console.log('[Chat] Notification permission not requested automatically. Click the test button to request.');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [totalUnreadCount, unreadChatsCount]);

  const handleTestNotification = useCallback(async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      showUnreadNotification(totalUnreadCount, unreadChatsCount, () => {
        window.focus();
      });
      playNotificationSound();
    } else {
      alert('Notification permission denied. Please allow notifications in your browser settings to test.');
    }
  }, [totalUnreadCount, unreadChatsCount]);

  if (isProd) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Available</h1>
          <p className="text-gray-500">This feature is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50">
      {/* Chat Layout with Dev Rail inside the shell */}
      <ChatLayout
        onReady={handleChatLayoutReady}
        devRail={
          <ChatDevRail
            totalUnreadCount={totalUnreadCount}
            unreadChatsCount={unreadChatsCount}
            profiles={profiles}
            profilesLoading={profilesLoading}
            profilesError={profilesError}
            startingChatFor={startingChatFor}
            currentUserId={currentUserId}
            onBackHome={() => navigate('/')}
            onTestNotification={handleTestNotification}
            onFetchAvailableUsers={fetchProfiles}
            onStartChat={handleStartChat}
            onCreateGroup={handleCreateGroup}
            onCopyId={handleCopyId}
            onSelectConversation={handleSelectConversation}
            copiedId={copiedId}
          />
        }
      />
    </div>
  );
}

export default ChatTest;
