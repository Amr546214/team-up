import { useEffect, useCallback } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { ChatUploadModal } from './ChatUploadModal';
import { useChat } from '../hooks/useChat';
import { MessageSquare, ArrowRight } from 'lucide-react';
import type { Conversation, Message } from '../types';

import type { ReactNode } from 'react';

interface ChatLayoutProps {
  onReady?: (actions: {
    openRealConversation: (conversation: Conversation, messages: Message[], realUserId: string) => void;
    refreshConversations: () => Promise<void>;
    selectConversation: (conversationId: string) => void;
    selectConversationAndHighlight: (conversationId: string, messageId: string) => void;
    currentUserId: string | null;
  }) => void;
  devRail?: ReactNode;
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
  } = useChat();

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
      });
    }
  }, [onReady, openRealConversation, refreshConversations, selectConversation, selectConversationAndHighlight, currentUser?.id]);

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
                highlightedMessageId={highlightedMessageId}
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
    </div>
  );
}
