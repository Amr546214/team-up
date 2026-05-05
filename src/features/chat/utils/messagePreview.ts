import type { Message, Conversation, ChatUser } from '../types';
import { formatShortDate } from './dateFormat';

/**
 * Get the latest message for a conversation from the messages record
 */
export function getLastMessageForConversation(
  conversationId: string,
  messages: Record<string, Message[]>
): Message | undefined {
  const conversationMessages = messages[conversationId] || [];
  if (conversationMessages.length === 0) return undefined;
  
  // Get the last message (most recent)
  return conversationMessages[conversationMessages.length - 1];
}

/**
 * Get the sender label for a message preview
 * Returns "You:" for current user, or the sender's name for others
 */
export function getMessageSenderLabel(
  message: Message,
  conversation: Conversation,
  currentUser: ChatUser
): string {
  const isCurrentUser = message.senderId === currentUser.id;
  
  if (isCurrentUser) {
    return 'You:';
  }
  
  // Find sender name from conversation participants
  const sender = conversation.participants.find(p => p.id === message.senderId);
  if (sender) {
    return `${sender.name}:`;
  }
  
  // Fallback for group chats where sender might not be in participants list
  if (conversation.type === 'group') {
    return 'Member:';
  }
  
  // Fallback for direct chats
  return '';
}

/**
 * Get a friendly preview text for a message based on its type
 */
export function getMessagePreviewText(message: Message): string {
  if (message.deletedAt && message.deleteScope === 'everyone') {
    return 'This message was deleted';
  }
  switch (message.type) {
    case 'image':
      return '📷 Photo';
    case 'file':
      return `📎 ${message.fileName || 'File'}`;
    case 'voice':
      return '🎤 Voice message';
    case 'audio':
      return `🎵 ${message.fileName || 'Audio'}`;
    case 'text':
    default:
      return message.content || '';
  }
}

/**
 * Format the sidebar message time display
 * - Today: "11:02 PM"
 * - Yesterday: "Yesterday"
 * - Older: "May 2" or short date
 */
export function formatSidebarMessageTime(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  // Reset hours to compare dates only
  const dateWithoutTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowWithoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowWithoutTime.getTime() - dateWithoutTime.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else {
    // Older - use formatShortDate
    return formatShortDate(date);
  }
}

/**
 * Build the full preview text for a conversation item
 * Combines sender label and message preview
 */
export function buildMessagePreview(
  message: Message,
  conversation: Conversation,
  currentUser: ChatUser
): string {
  const senderLabel = getMessageSenderLabel(message, conversation, currentUser);
  const previewText = getMessagePreviewText(message);
  
  if (senderLabel) {
    return `${senderLabel} ${previewText}`;
  }
  
  return previewText;
}
