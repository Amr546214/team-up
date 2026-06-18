import type { ChatUser, Conversation, ChatFilter } from '../types';

/**
 * Get the other participant in a direct conversation
 */
export const getOtherParticipant = (conversation: Conversation, currentUserId?: string): ChatUser | undefined => {
  if (!currentUserId) {
    return conversation.participants[0];
  }
  // Find the participant who is NOT the current user
  const other = conversation.participants.find(p => p.id !== currentUserId);
  return other || conversation.participants[0];
};

/**
 * Chat filter labels
 */
export const chatFilterLabels: Record<ChatFilter, string> = {
  all: 'All',
  direct: 'Chats',
  group: 'Groups',
  unread: 'Unread',
};

/**
 * Format message time for display
 */
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
