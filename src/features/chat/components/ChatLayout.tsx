import { useEffect, useCallback, useState, useRef } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatUploadModal } from './ChatUploadModal';
import { IncomingCallModal } from './IncomingCallModal';
import { useChat } from '../hooks/useChat';
import { useChatPresence } from '../hooks/useChatPresence';
import { MessageSquare, ArrowRight } from 'lucide-react';
import type { Conversation, Message } from '../types';
import type { CallSession } from '../services/supabaseCallService';
import { supabase } from '../../../lib/supabase';
import { stopIncomingCallRingtone, stopOutgoingCallWaitingSound } from '../utils/chatSounds';

import type { ReactNode } from 'react';

interface ChatLayoutProps {
  onReady?: (actions: {
    openRealConversation: (conversation: Conversation, messages: Message[], realUserId: string) => void;
    refreshConversations: () => Promise<void>;
    selectConversation: (conversationId: string) => void;
    selectConversationAndHighlight: (conversationId: string, messageId: string) => void;
    currentUserId: string | null;
    totalUnreadCount: number;
    unreadChatsCount: number;
  }) => void;
  devRail?: ReactNode;
}

function normalizeCall(row: any): CallSession | null {
  if (!row) return null;

  return {
    ...row,
    id: row.id,
    conversationId: row.conversationId ?? row.conversation_id,
    callerId: row.callerId ?? row.caller_id,
    receiverId: row.receiverId ?? row.receiver_id,
    type: row.type,
    status: row.status,
    startedAt: row.startedAt ?? row.started_at,
    answeredAt: row.answeredAt ?? row.answered_at,
    endedAt: row.endedAt ?? row.ended_at,
    createdAt: row.createdAt ?? row.created_at,
  } as CallSession;
}

export function ChatLayout({ onReady, devRail }: ChatLayoutProps = {}) {
  const {
    activeConversationId,
    messages,
    activeConversation,
    activeMessages,
    sortedConversations,
    isMobileChatOpen,
    isLoading,
    error,
    currentUser,
    totalUnreadCount,
    unreadChatsCount,
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
    onPinMessage,
    onUnpinMessage,
    loadPinnedMessages,
  } = useChat();

  // Presence - track online users
  const { onlineUserIds, isUserOnline, getOnlineCount } = useChatPresence(currentUser?.id || null);

  // Call state
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [activeCallStatus, setActiveCallStatus] = useState<CallSession['status'] | null>(null);
  const [activeCallMode, setActiveCallMode] = useState<'voice' | 'video' | null>(null);
  const callSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const getCallRole = useCallback((call: CallSession, currentUserId: string | null) => {
    const isCaller =
      currentUserId === (call as any).callerId ||
      currentUserId === (call as any).caller_id;
    const isReceiver =
      currentUserId === (call as any).receiverId ||
      currentUserId === (call as any).receiver_id;

    return { isCaller, isReceiver, role: isCaller ? 'caller' : 'receiver' as 'caller' | 'receiver' };
  }, []);

  const selectConversationAndHighlight = useCallback(
    (conversationId: string, messageId: string) => {
      selectConversation(conversationId);
      setHighlightedMessageId(messageId);
      // Auto-clear after 2200ms
      setTimeout(() => setHighlightedMessageId(null), 2200);
    },
    [selectConversation, setHighlightedMessageId]
  );

  // Expose actions to parent
  useEffect(() => {
    if (onReady) {
      onReady({
        openRealConversation,
        refreshConversations,
        selectConversation,
        selectConversationAndHighlight,
        currentUserId: currentUser?.id || null,
        totalUnreadCount,
        unreadChatsCount,
      });
    }
  }, [onReady, openRealConversation, refreshConversations, selectConversation, selectConversationAndHighlight, currentUser?.id, totalUnreadCount, unreadChatsCount]);

  // Sync current user ref for realtime callbacks
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser?.id]);

  // Realtime subscription for call_sessions
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('[Calls] setting up realtime subscription for user', currentUser.id);

    const channel = supabase
      .channel('call_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
        },
        (payload) => {
          const call = normalizeCall(payload.new as CallSession);
          if (!call) return;
          console.log('[Calls] INSERT event received', call);

          // Check if this is an incoming call for current user
          if ((call as any).receiverId === currentUserIdRef.current && call.status === 'ringing') {
            console.log('[Calls] incoming call detected', call);
            setIncomingCall(call);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
        },
        (payload) => {
          const call = normalizeCall(payload.new as CallSession);
          if (!call) return;
          console.log('[Calls] UPDATE event received', call);

          // Check if this call involves current user
          const userId = currentUserIdRef.current;
          if ((call as any).callerId === userId || (call as any).receiverId === userId) {
            console.log('[Calls] call update for current user', call.status);
            const { isCaller, isReceiver } = getCallRole(call, userId);

            // Update active call status if this is the active call
            if (activeCallSession?.id === call.id) {
              setActiveCallStatus(call.status);
            }

            // Handle accepted - keep active call UI open
            if (call.status === 'accepted') {
              console.log('[Calls] accepted update received', {
                callId: call.id,
                currentUserId: userId,
                isCaller,
                isReceiver,
              });
              setIncomingCall(null);
              stopIncomingCallRingtone();
              stopOutgoingCallWaitingSound();
              setActiveCallSession(call);
              setActiveCallStatus('accepted');
              setActiveCallMode(call.type === 'audio' ? 'voice' : 'video');
            }

            // Handle rejected/missed/ended - close modals
            if (['rejected', 'missed', 'ended'].includes(call.status)) {
              setIncomingCall(null);
              if (activeCallSession?.id === call.id) {
                // Keep modal open briefly to show status, then close
                setTimeout(() => {
                  setActiveCallSession(null);
                  setActiveCallStatus(null);
                  setActiveCallMode(null);
                }, 2000);
              }
            }
          }
        }
      )
      .subscribe();

    callSubscriptionRef.current = channel;

    return () => {
      console.log('[Calls] cleaning up realtime subscription');
      channel.unsubscribe();
    };
  }, [currentUser?.id, activeCallSession?.id]);

  // Handle incoming call acceptance
  const handleIncomingAccepted = useCallback(() => {
    console.log('[Calls] accept clicked', {
      incomingCall,
      normalizedIncomingCall: normalizeCall(incomingCall),
    });
    if (incomingCall) {
      const normalizedCall = normalizeCall(incomingCall);
      console.log('[Calls] setting currentCall after accept', normalizedCall);
      setIncomingCall(null);
      stopIncomingCallRingtone();
      setActiveCallSession(normalizedCall);
      setActiveCallStatus('accepted');
      setActiveCallMode(incomingCall.type === 'audio' ? 'voice' : 'video');
    }
  }, [incomingCall]);

  // Handle incoming call rejection
  const handleIncomingRejected = useCallback(() => {
    console.log('[Calls] incoming call rejected');
    setIncomingCall(null);
  }, []);

  // Handle call state from ChatWindow
  const handleCallStateChange = useCallback((state: {
    callSession: CallSession | null;
    callStatus: CallSession['status'] | null;
    isIncoming: boolean;
    mode: 'audio' | 'video' | null;
  }) => {
    console.log('[Calls] state change from ChatWindow', state);
    if (state.callSession) {
      setActiveCallSession(state.callSession);
      setActiveCallStatus(state.callStatus);
      if (state.mode) {
        setActiveCallMode(state.mode === 'audio' ? 'voice' : 'video');
      }
    } else {
      setActiveCallSession(null);
      setActiveCallStatus(null);
      setActiveCallMode(null);
    }
  }, []);

  // Loading state (mock - inactive by default)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Error state (mock - inactive by default)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-100 p-0 md:p-4 lg:p-6">
      {/* App-like container - Full screen on mobile, centered on desktop */}
      <div className={`
        mx-auto overflow-hidden bg-white
        md:max-w-[1400px] md:rounded-2xl md:shadow-2xl md:shadow-gray-200/50
        md:border md:border-gray-200/60
        h-[100dvh] md:h-[calc(100dvh-48px)]
      `}>
        <div className="flex h-full overflow-hidden">
          {/* Dev Rail - Icon only, inside chat shell */}
          {devRail && (
            <div className="hidden md:block shrink-0 h-full">
              {devRail}
            </div>
          )}

          {/* Sidebar - Hidden on mobile when chat is open */}
          <div
            className={`${
              isMobileChatOpen ? 'hidden md:flex' : 'flex'
            } flex-col h-full w-full md:w-auto`}
          >
            <ChatSidebar
              conversations={sortedConversations}
              activeConversationId={activeConversationId}
              onSelectConversation={selectConversation}
              currentUser={currentUser}
              messages={messages}
              totalUnreadCount={totalUnreadCount}
              unreadChatsCount={unreadChatsCount}
              isUserOnline={isUserOnline}
            />
          </div>

          {/* Chat Window - Full screen on mobile when open */}
          <div
            className={`${
              isMobileChatOpen ? 'fixed inset-0 z-50 md:static md:z-auto' : 'hidden md:flex'
            } flex-col flex-1 h-full`}
          >
            {activeConversation ? (
              <ChatWindow
                conversation={activeConversation}
                messages={activeMessages}
                currentUser={currentUser}
                onSendMessage={sendMessage}
                onSendAttachment={sendAttachment}
                onBack={backToList}
                isMobile={isMobileChatOpen}
                onPinToggle={togglePin}
                onMuteToggle={toggleMute}
                onMarkUnread={markUnread}
                onClearChat={clearChat}
                onDeleteChat={deleteChat}
                isSendingMessage={isSendingMessage}
                sendMessageError={sendMessageError}
                isLoadingMessages={isLoadingMessages}
                onToggleMessageStar={onToggleMessageStar}
                onHideMessageForMe={onHideMessageForMe}
                onReportMessage={onReportMessage}
                onDeleteForEveryone={onDeleteForEveryone}
                onPinMessage={onPinMessage}
                onUnpinMessage={onUnpinMessage}
                pinnedMessages={pinnedMessages}
                highlightedMessageId={highlightedMessageId}
                setHighlightedMessageId={setHighlightedMessageId}
                onCallStateChange={handleCallStateChange}
                externalCallSession={activeCallSession}
                externalCallStatus={activeCallStatus}
                isUserOnline={isUserOnline}
                getOnlineCount={getOnlineCount}
              />
            ) : (
              /* Empty state when no conversation is selected */
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-center p-8">
                <div className="w-24 h-24 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <MessageSquare className="w-12 h-12 text-teal-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  Choose a conversation from the sidebar to start chatting, or select a contact to begin a new conversation.
                </p>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                  <span>Click</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>a conversation on the left to get started</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <ChatUploadModal
        state={uploadModal}
        onClose={() => setUploadModal({ open: false, status: 'uploading' })}
      />

      {/* Incoming Call Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          callerName={(() => {
            // Find caller name from conversations
            const conv = sortedConversations.find(c => c.id === incomingCall.conversation_id);
            if (conv?.type === 'direct') {
              const other = conv.participants.find(p => p.id === incomingCall.caller_id);
              return other?.name || 'Unknown';
            }
            return conv?.name || 'Unknown';
          })()}
          callerAvatar={(() => {
            const conv = sortedConversations.find(c => c.id === incomingCall.conversation_id);
            if (conv?.type === 'direct') {
              const other = conv.participants.find(p => p.id === incomingCall.caller_id);
              return other?.avatar;
            }
            return conv?.avatar;
          })()}
          onAccepted={handleIncomingAccepted}
          onRejected={handleIncomingRejected}
        />
      )}
    </div>
  );
}
