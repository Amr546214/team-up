import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface PresenceUser {
  userId: string;
  name: string;
  avatar?: string;
  role?: string;
  onlineAt: string;
}

interface UseChatPresenceReturn {
  onlineUserIds: Set<string>;
  onlineUsersById: Record<string, PresenceUser>;
  isUserOnline: (userId: string) => boolean;
  getOnlineCount: (userIds: string[]) => number;
}

export function useChatPresence(currentUserId: string | null): UseChatPresenceReturn {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [onlineUsersById, setOnlineUsersById] = useState<Record<string, PresenceUser>>({});

  // Refs to track state without triggering re-renders
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceStateRef = useRef<Record<string, PresenceUser>>({});
  const currentUserIdRef = useRef<string | null>(currentUserId);

  // Keep ref in sync
  currentUserIdRef.current = currentUserId;

  // Helper to check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return onlineUserIds.has(userId);
  }, [onlineUserIds]);

  // Helper to get count of online users from a list
  const getOnlineCount = useCallback((userIds: string[]): number => {
    if (!userIds?.length) return 0;
    return userIds.filter(id => onlineUserIds.has(id)).length;
  }, [onlineUserIds]);

  useEffect(() => {
    if (!currentUserId) {
      console.log('[Presence] hook skipped - no current user');
      return;
    }

    console.log('[Presence] hook mounted', { currentUserId });
    console.log('[Presence] joining channel chat-presence');

    // Create presence channel with userId as key
    const channel = supabase.channel('chat-presence', {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    // Handle presence sync - this fires when anyone joins/leaves
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('[Presence] raw state', state);

      // Convert presence state to our format
      const newOnlineUsers: Record<string, PresenceUser> = {};
      const newOnlineIds = new Set<string>();

      // Iterate through all presence keys (which are userIds from presence.key)
      Object.values(state).forEach((presences) => {
        // presences is an array of presence data for each key
        (presences as any[]).forEach((presence) => {
          if (presence && presence.userId) {
            newOnlineUsers[presence.userId] = {
              userId: presence.userId,
              name: presence.name || 'Unknown',
              avatar: presence.avatar,
              role: presence.role,
              onlineAt: presence.onlineAt,
            };
            newOnlineIds.add(presence.userId);
          }
        });
      });

      presenceStateRef.current = newOnlineUsers;
      setOnlineUsersById(newOnlineUsers);
      setOnlineUserIds(newOnlineIds);

      console.log('[Presence] online user ids', Array.from(newOnlineIds));
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      console.log('[Presence] status', status);

      if (status === 'SUBSCRIBED') {
        console.log('[Presence] subscribed');

        // Track current user's presence with profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('id', currentUserId)
          .single();

        const presenceData = {
          userId: currentUserId,
          name: profile?.full_name || 'Unknown',
          avatar: profile?.avatar_url || undefined,
          role: profile?.role || undefined,
          onlineAt: new Date().toISOString(),
        };

        await channel.track(presenceData);
        console.log('[Presence] tracked current user', currentUserId);
      }
    });

    // Cleanup on unmount or user change
    return () => {
      console.log('[Presence] cleanup', currentUserId);
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId]);

  return {
    onlineUserIds,
    onlineUsersById,
    isUserOnline,
    getOnlineCount,
  };
}
