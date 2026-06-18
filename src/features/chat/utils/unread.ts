import type { Conversation } from '../types';

/**
 * Get count of conversations with unread messages
 */
export function getUnreadConversationsCount(conversations: Conversation[]): number {
  return conversations.filter((c) => c.unreadCount > 0).length;
}

/**
 * Get total unread messages count across all conversations
 */
export function getTotalUnreadMessagesCount(conversations: Conversation[]): number {
  return conversations.reduce((total, c) => total + c.unreadCount, 0);
}

/**
 * Format unread count for badge display
 * - 0: returns null (hide badge)
 * - 1-99: returns the number as string
 * - 100+: returns "99+"
 */
export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  if (count > 99) return '99+';
  return String(count);
}

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permission
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

/**
 * Show a browser notification for unread messages
 */
export function showUnreadNotification(
  unreadMessagesCount: number,
  unreadConversationsCount: number,
  onClick?: () => void
): void {
  if (!isNotificationSupported()) {
    console.log('[Chat] Notifications not supported in this browser');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.log('[Chat] Notification permission not granted');
    return;
  }

  if (unreadMessagesCount === 0) return;

  const title = unreadMessagesCount === 1 ? 'New message' : 'New messages';
  const body =
    unreadConversationsCount === 1
      ? `You have ${unreadMessagesCount} unread message in 1 conversation.`
      : `You have ${unreadMessagesCount} unread messages in ${unreadConversationsCount} conversations.`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Use app favicon if available
      badge: '/favicon.ico',
      tag: 'chat-unread-messages',
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };

    console.log('[Chat] Notification shown:', title, body);
  } catch (err) {
    console.error('[Chat] Failed to show notification:', err);
  }
}
