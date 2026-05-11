// Chat feature exports
export { ChatLayout } from './components/ChatLayout';
export { ChatSidebar } from './components/ChatSidebar';
export { ChatDevRail } from './components/ChatDevRail';
export { ReportMessageModal } from './components/ReportMessageModal';
export { DeleteConfirmModal } from './components/DeleteConfirmModal';

// Hooks
export { useChat } from './hooks/useChat';
export { useChatUnreadCount } from './hooks/useChatUnreadCount';
export { useChatPresence } from './hooks/useChatPresence';
export { ChatWindow } from './components/ChatWindow';
export { ChatFilters } from './components/ChatFilters';
export { ConversationItem } from './components/ConversationItem';
export { MessageBubble } from './components/MessageBubble';
export { MessageInput } from './components/MessageInput';
export { VoiceMessageBubble } from './components/VoiceMessageBubble';
export { ImagePreviewModal } from './components/ImagePreviewModal';
export { ChatUserPopover } from './components/ChatUserPopover';
export { ChatHeaderMenu } from './components/ChatHeaderMenu';
export { ConfirmActionModal } from './components/ConfirmActionModal';
export { CallModal } from './components/CallModal';
export { IncomingCallModal } from './components/IncomingCallModal';

// Types
export type { ChatUser, Conversation, Message, ChatState, ChatFilter, MessageType, ChatProfile } from './types';

// Mock data for development
export {
  mockCurrentUser,
  mockUsers,
  mockConversations,
  mockMessages,
  chatFilterLabels,
  groupAvatars,
  getConversationMessages,
  getOtherParticipant,
} from './data/mockChatData';

// Date formatting utilities
export {
  formatChatDate,
  formatMessageTime,
  formatShortDate,
} from './utils/dateFormat';

// Message preview utilities
export {
  getLastMessageForConversation,
  getMessageSenderLabel,
  getMessagePreviewText,
  formatSidebarMessageTime,
  buildMessagePreview,
} from './utils/messagePreview';

// File formatting utilities
export {
  formatFileSize,
  formatDuration,
  getFileIcon,
  isMediaRecorderSupported,
} from './utils/fileFormat';

// Sound utilities
export {
  playNotificationSound,
  playOutgoingCallWaitingSound,
  stopOutgoingCallWaitingSound,
  playIncomingCallRingtone,
  stopIncomingCallRingtone,
  stopAllChatSounds,
} from './utils/chatSounds';

// Unread message utilities
export {
  getUnreadConversationsCount,
  getTotalUnreadMessagesCount,
  formatUnreadBadge,
  isNotificationSupported,
  requestNotificationPermission,
  showUnreadNotification,
  hasMockNotificationBeenShown,
  markMockNotificationShown,
} from './utils/unread';

// Chat storage utilities
export {
  getReadConversationIds,
  addReadConversationId,
  removeReadConversationId,
  cleanReadConversationIds,
  isConversationRead,
} from './utils/chatStorage';

// Call services
export {
  createCallSession,
  acceptCall,
  rejectCall,
  endCall,
  markCallMissed,
  getActiveCallForConversation,
  type CallSession,
  type CreateCallSessionParams,
} from './services/supabaseCallService';

// Call signals service (WebRTC signaling)
export {
  insertCallSignal,
  getCallSignals,
  subscribeToCallSignals,
  unsubscribeFromCallSignals,
  type CallSignal,
  type InsertCallSignalParams,
} from './services/supabaseCallSignals';

// WebRTC hook
export {
  useWebRTCAudioCall,
  useWebRTCCall,
  type WebRTCStatus,
} from './hooks/useWebRTCAudioCall';
