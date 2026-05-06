import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video, Users } from 'lucide-react';
import type { Conversation, Message, ChatUser } from '../types';
import { getOtherParticipant } from '../data/mockChatData';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ImagePreviewModal } from './ImagePreviewModal';
import { ChatUserPopover } from './ChatUserPopover';
import { ChatHeaderMenu } from './ChatHeaderMenu';
import { ConfirmActionModal } from './ConfirmActionModal';
import { CallModal } from './CallModal';
import { ReportMessageModal } from './ReportMessageModal';
import { ReportUserModal } from './ReportUserModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { reportUser } from '../services/supabaseChatService';
import {
  createCallSession,
  endCall,
  type CallSession,
} from '../services/supabaseCallService';
import { playOutgoingCallWaitingSound } from '../utils/chatSounds';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: ChatUser;
  onSendMessage: (content: string) => void;
  onSendAttachment: (data: {
    type: 'image' | 'file' | 'voice' | 'audio';
    fileOrBlob: File | Blob;
    fileName: string;
    fileSize: number;
    fileType: string;
    duration?: number;
  }) => void;
  onBack?: () => void;
  isMobile?: boolean;
  // Menu actions
  onPinToggle?: (conversationId: string) => void;
  onMuteToggle?: (conversationId: string) => void;
  onMarkUnread?: (conversationId: string) => void;
  onClearChat?: (conversationId: string) => void;
  onDeleteChat?: (conversationId: string) => void;
  isSendingMessage?: boolean;
  sendMessageError?: string | null;
  isLoadingMessages?: boolean;
  // Message actions
  onToggleMessageStar?: (messageId: string, isStarred: boolean) => void;
  onHideMessageForMe?: (messageId: string) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  onDeleteForEveryone?: (messageId: string) => Promise<void>;
  highlightedMessageId?: string | null;
  // Call props
  onCallStateChange?: (state: {
    callSession: CallSession | null;
    callStatus: CallSession['status'] | null;
    isIncoming: boolean;
    mode: 'audio' | 'video' | null;
  }) => void;
  externalCallSession?: CallSession | null;
  externalCallStatus?: CallSession['status'] | null;
}

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onSendAttachment,
  onBack,
  isMobile = false,
  onPinToggle,
  onMuteToggle,
  onMarkUnread,
  onClearChat,
  onDeleteChat,
  isSendingMessage = false,
  sendMessageError = null,
  isLoadingMessages = false,
  onToggleMessageStar,
  onHideMessageForMe,
  onReportMessage,
  onDeleteForEveryone,
  highlightedMessageId = null,
  onCallStateChange,
  externalCallSession = null,
  externalCallStatus = null,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted message when it changes
  useEffect(() => {
    if (!highlightedMessageId) return;
    const attempt = (retriesLeft: number) => {
      const el = document.getElementById(`message-${highlightedMessageId}`);
      if (el) {
        console.log('[Starred] scrolling to message', highlightedMessageId);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (retriesLeft > 0) {
        // Messages may not be rendered yet — retry
        setTimeout(() => attempt(retriesLeft - 1), 150);
      } else {
        console.warn('[Starred] target message not found', highlightedMessageId);
      }
    };
    setTimeout(() => attempt(5), 200);
  }, [highlightedMessageId]);
  
  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    fileName?: string;
    timestamp?: Date;
  } | null>(null);

  // Message action modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Report user modal state
  const [reportUserModalOpen, setReportUserModalOpen] = useState(false);
  const [isUserReported, setIsUserReported] = useState(false);

  // User popover state
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
  const userInfoRef = useRef<HTMLButtonElement>(null);

  // Header menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'clear' | 'delete' | null;
  }>({ isOpen: false, action: null });

  // Call state
  const [callModalMode, setCallModalMode] = useState<'voice' | 'video' | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [callStatus, setCallStatus] = useState<CallSession['status'] | null>(null);

  // Group call coming soon popup state
  const [showGroupCallPopup, setShowGroupCallPopup] = useState(false);

  // Error toast state for call failures
  const [callError, setCallError] = useState<string | null>(null);

  // Auto-clear call error after 3 seconds
  useEffect(() => {
    if (!callError) return;
    const timer = setTimeout(() => setCallError(null), 3000);
    return () => clearTimeout(timer);
  }, [callError]);

  // Call handlers
  const handleVoiceCall = useCallback(async () => {
    if (conversation?.type === 'group') {
      setShowGroupCallPopup(true);
      return;
    }

    try {
      if (!conversation) {
        setCallError('No conversation selected');
        return;
      }

      // Get receiver (other participant)
      const otherUser = getOtherParticipant(conversation);
      if (!otherUser) {
        console.error('[Calls] cannot start call - no other user');
        setCallError('Cannot start call - no participant found');
        return;
      }

      // Don't allow calling yourself
      if (otherUser.id === currentUser.id) {
        console.error('[Calls] cannot call yourself');
        setCallError('Cannot call yourself');
        return;
      }

      console.log('[Calls] starting voice call', {
        conversationId: conversation.id,
        receiverId: otherUser.id,
      });

      const { call, error } = await createCallSession({
        conversationId: conversation.id,
        receiverId: otherUser.id,
        type: 'audio',
      });

      if (error || !call) {
        console.error('[Calls] failed to start call', error);
        setCallError('Failed to start call');
        return;
      }

      // Play ringing sound in user-gesture context (browser autoplay policy)
      playOutgoingCallWaitingSound();

      setActiveCallSession(call);
      setCallStatus('ringing');
      setCallModalMode('voice');

      // Notify parent
      onCallStateChange?.({
        callSession: call,
        callStatus: 'ringing',
        isIncoming: false,
        mode: 'audio',
      });
    } catch (err) {
      console.error('[Calls] unexpected error starting voice call', err);
      setCallError('Failed to start call');
    }
  }, [conversation, currentUser.id, onCallStateChange]);

  const handleVideoCall = useCallback(async () => {
    if (conversation?.type === 'group') {
      setShowGroupCallPopup(true);
      return;
    }

    try {
      if (!conversation) {
        setCallError('No conversation selected');
        return;
      }

      // Get receiver (other participant)
      const otherUser = getOtherParticipant(conversation);
      if (!otherUser) {
        console.error('[Calls] cannot start call - no other user');
        setCallError('Cannot start call - no participant found');
        return;
      }

      // Don't allow calling yourself
      if (otherUser.id === currentUser.id) {
        console.error('[Calls] cannot call yourself');
        setCallError('Cannot call yourself');
        return;
      }

      console.log('[Calls] starting video call', {
        conversationId: conversation.id,
        receiverId: otherUser.id,
      });

      const { call, error } = await createCallSession({
        conversationId: conversation.id,
        receiverId: otherUser.id,
        type: 'video',
      });

      if (error || !call) {
        console.error('[Calls] failed to start call', error);
        setCallError('Failed to start call');
        return;
      }

      // Play ringing sound in user-gesture context (browser autoplay policy)
      playOutgoingCallWaitingSound();

      setActiveCallSession(call);
      setCallStatus('ringing');
      setCallModalMode('video');

      // Notify parent
      onCallStateChange?.({
        callSession: call,
        callStatus: 'ringing',
        isIncoming: false,
        mode: 'video',
      });
    } catch (err) {
      console.error('[Calls] unexpected error starting video call', err);
      setCallError('Failed to start call');
    }
  }, [conversation, currentUser.id, onCallStateChange]);

  const handleCloseCall = useCallback(async () => {
    console.log('[Calls] closing call modal');

    try {
      // End call in Supabase if active
      if (activeCallSession?.id && callStatus && ['ringing', 'accepted'].includes(callStatus)) {
        await endCall(activeCallSession.id);
      }
    } catch (err) {
      console.error('[Calls] error ending call', err);
    }

    setCallModalMode(null);
    setActiveCallSession(null);
    setCallStatus(null);

    // Notify parent
    onCallStateChange?.({
      callSession: null,
      callStatus: null,
      isIncoming: false,
      mode: null,
    });
  }, [activeCallSession?.id, callStatus, onCallStateChange]);

  const handleCloseGroupCallPopup = useCallback(() => {
    setShowGroupCallPopup(false);
  }, []);

  const handleViewProfile = useCallback(() => {
    console.log('[Chat] View profile clicked for:', conversation?.id);
    // TODO: Implement view profile modal or navigation
    alert('View profile - Coming soon!');
  }, [conversation?.id]);

  const handlePinToggle = useCallback(() => {
    if (conversation && onPinToggle) {
      onPinToggle(conversation.id);
    }
  }, [conversation, onPinToggle]);

  const handleMuteToggle = useCallback(() => {
    if (conversation && onMuteToggle) {
      onMuteToggle(conversation.id);
    }
  }, [conversation, onMuteToggle]);

  const handleMarkUnread = useCallback(() => {
    if (conversation && onMarkUnread) {
      onMarkUnread(conversation.id);
    }
  }, [conversation, onMarkUnread]);

  const handleClearChat = useCallback(() => {
    if (conversation && onClearChat) {
      setConfirmModal({ isOpen: true, action: 'clear' });
      setIsMenuOpen(false);
    }
  }, [conversation, onClearChat]);

  const handleDeleteChat = useCallback(() => {
    if (conversation && onDeleteChat) {
      setConfirmModal({ isOpen: true, action: 'delete' });
      setIsMenuOpen(false);
    }
  }, [conversation, onDeleteChat]);

  const handleReportUser = useCallback(async (reason: string, details?: string) => {
    if (!conversation || conversation.type !== 'direct') return;
    const other = getOtherParticipant(conversation);
    if (!other) return;

    const { success, error, alreadyReported } = await reportUser({
      reportedUserId: other.id,
      conversationId: conversation.id,
      reason,
      details,
    });

    if (!success) {
      throw new Error(error || 'Failed to report user');
    }

    setIsUserReported(true);
    if (alreadyReported) {
      console.log('[Report User] updated existing report');
    }
  }, [conversation]);

  const handleConfirmAction = useCallback(() => {
    if (!conversation || !confirmModal.action) return;

    if (confirmModal.action === 'clear' && onClearChat) {
      onClearChat(conversation.id);
    } else if (confirmModal.action === 'delete' && onDeleteChat) {
      onDeleteChat(conversation.id);
    }

    setConfirmModal({ isOpen: false, action: null });
  }, [confirmModal.action, conversation, onClearChat, onDeleteChat]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmModal({ isOpen: false, action: null });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close user popover when clicking outside
  useEffect(() => {
    if (!isUserPopoverOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userInfoRef.current && !userInfoRef.current.contains(target)) {
        setIsUserPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserPopoverOpen]);

  // Empty state
  if (!conversation) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-linear-to-b from-gray-50/50 to-white text-center p-8">
        <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
          <svg
            className="w-9 h-9 text-teal-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select a conversation
        </h3>
        <p className="text-gray-500 text-sm max-w-[240px]">
          Choose a conversation from the sidebar to start chatting
        </p>
      </div>
    );
  }

  const isGroup = conversation.type === 'group';
  const otherUser = getOtherParticipant(conversation);
  const displayName = isGroup ? conversation.name : otherUser?.name;
  const statusText = isGroup
    ? `${conversation.membersCount || conversation.participants.length} members`
    : otherUser?.status === 'online'
      ? 'Online'
      : otherUser?.status === 'busy'
        ? 'Busy'
        : otherUser?.status === 'away'
          ? 'Away'
          : 'Offline';

  return (
    <div className="flex flex-col h-full bg-white w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Clickable user info area */}
          <button
            ref={userInfoRef}
            onClick={() => setIsUserPopoverOpen(!isUserPopoverOpen)}
            className="flex items-center gap-3 p-1 -ml-1 rounded-lg hover:bg-gray-100/80 transition-colors cursor-pointer"
            aria-expanded={isUserPopoverOpen}
            aria-haspopup="true"
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${
                isGroup
                  ? 'bg-linear-to-br from-indigo-400 to-indigo-500'
                  : 'bg-linear-to-br from-teal-400 to-teal-600'
              }`}>
                {isGroup
                  ? (conversation.avatar
                      ? <img src={conversation.avatar} alt={conversation.name} className="w-full h-full rounded-full object-cover" />
                      : conversation.name?.charAt(0).toUpperCase()
                    )
                  : (otherUser?.avatar
                      ? <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
                      : otherUser?.name.charAt(0).toUpperCase()
                    )
                }
              </div>
              {!isGroup && otherUser && (
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    otherUser.status === 'online'
                      ? 'bg-green-500'
                      : otherUser.status === 'busy'
                        ? 'bg-red-500'
                        : otherUser.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                  }`}
                />
              )}
            </div>

            <div className="text-left">
              <h3 className="font-medium text-gray-900">{displayName}</h3>
              <div className="flex items-center gap-1.5">
                {!isGroup && otherUser && (
                  <span className="text-xs text-gray-500 capitalize">{otherUser.role}</span>
                )}
                {!isGroup && otherUser && <span className="text-xs text-gray-300">•</span>}
                <span className="text-xs text-gray-500">{statusText}</span>
              </div>
            </div>

            {/* User Popover */}
            {isUserPopoverOpen && (
              <ChatUserPopover
                conversation={conversation}
                isOpen={isUserPopoverOpen}
                onClose={() => setIsUserPopoverOpen(false)}
                onVoiceCall={handleVoiceCall}
                onVideoCall={handleVideoCall}
                onViewProfile={handleViewProfile}
              />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleVoiceCall}
            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
            aria-label="Voice call"
          >
            <Phone className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleVideoCall}
            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
            aria-label="Video call"
          >
            <Video className="w-5 h-5 text-gray-500" />
          </button>
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="More options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {conversation && (
              <ChatHeaderMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                isPinned={conversation.isPinned || false}
                isMuted={conversation.isMuted || false}
                isDirectConversation={conversation.type === 'direct'}
                isUserReported={isUserReported}
                onPinToggle={handlePinToggle}
                onMuteToggle={handleMuteToggle}
                onViewProfile={handleViewProfile}
                onMarkUnread={handleMarkUnread}
                onClearChat={handleClearChat}
                onDeleteChat={handleDeleteChat}
                onReportUser={() => setReportUserModalOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Messages - Using flex-col with justify-end to keep messages near bottom */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-teal-50/20 via-white to-white">
        <div className="min-h-full flex flex-col">
          {isLoadingMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <p className="text-gray-400 text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end px-6 py-6">
              <div className="space-y-3">
                {messages.map((message) => {
                  // Get sender for this message (for groups, look up in participants)
                  const getSender = (): ChatUser | undefined => {
                    if (message.senderId === currentUser.id) return currentUser;
                    // For groups, find sender in participants or use senderProfile from message
                    if (isGroup) {
                      const senderParticipant = conversation.participants.find(
                        (p) => p.id === message.senderId
                      );
                      if (senderParticipant) return senderParticipant;
                      // Fallback: build from senderProfile if available
                      if (message.senderProfile) {
                        return {
                          id: message.senderProfile.id,
                          name: message.senderProfile.name || 'Unknown',
                          role: (message.senderProfile.role as ChatUser['role']) || 'client',
                          avatar: message.senderProfile.avatarUrl || undefined,
                          status: 'offline',
                        };
                      }
                    }
                    return otherUser;
                  };

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                      sender={getSender()}
                      isHighlighted={message.id === highlightedMessageId}
                    onImageClick={message.type === 'image' && message.mediaUrl ? () => {
                      setPreviewImage({
                        url: message.mediaUrl!,
                        fileName: message.fileName,
                        timestamp: message.timestamp,
                      });
                    } : undefined}
                    onToggleStar={onToggleMessageStar}
                    onDeleteForEveryone={onDeleteForEveryone}
                    onHideForMe={(msgId) => {
                      setSelectedMessageId(msgId);
                      setDeleteModalOpen(true);
                    }}
                    onReport={(msgId) => {
                      setSelectedMessageId(msgId);
                      setReportModalOpen(true);
                    }}
                  />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send error */}
      {sendMessageError && (
        <div className="shrink-0 px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">Failed to send message. Please try again.</p>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100">
        <MessageInput onSendMessage={onSendMessage} onSendAttachment={onSendAttachment} disabled={isSendingMessage} />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          fileName={previewImage.fileName}
          timestamp={previewImage.timestamp}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Confirm Action Modal for Clear/Delete */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.action === 'delete' ? 'Delete chat?' : 'Clear chat?'}
        description={
          confirmModal.action === 'delete'
            ? 'This conversation will be removed from the chat list. This action cannot be undone in the current mock session.'
            : 'All messages in this conversation will be removed.'
        }
        confirmLabel={confirmModal.action === 'delete' ? 'Delete chat' : 'Clear chat'}
        cancelLabel="Cancel"
        variant={confirmModal.action === 'delete' ? 'danger' : 'warning'}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />

      {/* Report Message Modal */}
      <ReportMessageModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onConfirm={async (reason) => {
          if (selectedMessageId && onReportMessage) {
            setIsProcessingAction(true);
            await onReportMessage(selectedMessageId, reason);
            setIsProcessingAction(false);
          }
          setReportModalOpen(false);
          setSelectedMessageId(null);
        }}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedMessageId && onHideMessageForMe) {
            setIsProcessingAction(true);
            await onHideMessageForMe(selectedMessageId);
            setIsProcessingAction(false);
          }
          setDeleteModalOpen(false);
          setSelectedMessageId(null);
        }}
        isDeleting={isProcessingAction}
      />

      {/* Report User Modal */}
      <ReportUserModal
        isOpen={reportUserModalOpen}
        onClose={() => setReportUserModalOpen(false)}
        onConfirm={handleReportUser}
        userName={conversation?.type === 'direct' ? getOtherParticipant(conversation)?.name : undefined}
      />

      {/* Group Call Coming Soon Popup */}
      {showGroupCallPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Calls Coming Soon</h3>
              <p className="text-gray-500 text-sm mb-6">
                Voice and video calls for group conversations are currently in development. Stay tuned for updates!
              </p>
              <button
                onClick={handleCloseGroupCallPopup}
                className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {callModalMode && conversation && (
        <CallModal
          conversation={conversation}
          mode={callModalMode}
          isOpen={!!callModalMode}
          onClose={handleCloseCall}
          callSession={activeCallSession}
          callStatus={externalCallStatus || callStatus}
          isIncoming={!!externalCallSession}
        />
      )}

      {/* Call Error Toast */}
      {callError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
            {callError}
          </div>
        </div>
      )}
    </div>
  );
}
