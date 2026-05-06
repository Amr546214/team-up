import { useState, useEffect, useCallback } from 'react';
import { getMyConversations } from '../services/supabaseChatService';

interface UseChatUnreadCountResult {
  totalUnreadCount: number;
  unreadChatsCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useChatUnreadCount(): UseChatUnreadCountResult {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { conversations, error: loadError } = await getMyConversations();

      if (loadError) {
        setError(loadError);
        setTotalUnreadCount(0);
        setUnreadChatsCount(0);
      } else {
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const chats = conversations.filter((c) => (c.unreadCount || 0) > 0).length;

        setTotalUnreadCount(total);
        setUnreadChatsCount(chats);

        console.log('[Navbar Unread]', {
          totalUnreadCount: total,
          unreadChatsCount: chats,
        });
      }
    } catch (err: any) {
      console.error('[Navbar Unread] failed to load', err);
      setError(err?.message || 'Failed to load unread count');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refresh();

    // Listen for chat unread updates from chat page
    const handleChatUnreadUpdated = () => {
      console.log('[Navbar Unread] received chat-unread-updated event');
      refresh();
    };

    window.addEventListener('chat-unread-updated', handleChatUnreadUpdated);

    return () => {
      window.removeEventListener('chat-unread-updated', handleChatUnreadUpdated);
    };
  }, [refresh]);

  return {
    totalUnreadCount,
    unreadChatsCount,
    isLoading,
    error,
    refresh,
  };
}
