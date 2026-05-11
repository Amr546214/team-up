import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface TypingUser {
  userId: string;
  name: string;
  timestamp: number;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  sendTypingStart: () => void;
  sendTypingStop: () => void;
}

const AUTO_CLEAR_TIMEOUT = 3000; // Auto-clear typing after 3s if no stop received

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null,
  currentUserName: string
): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Refs for managing state without re-renders
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);
  const typingHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Clear timeout helper
  const clearUserTimeout = useCallback((userId: string) => {
    if (timeoutsRef.current[userId]) {
      clearTimeout(timeoutsRef.current[userId]);
      delete timeoutsRef.current[userId];
    }
  }, []);

  // Remove typing user helper
  const removeTypingUser = useCallback(
    (userId: string) => {
      clearUserTimeout(userId);
      setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
    },
    [clearUserTimeout]
  );

  // Helper to send typing broadcast
  const sendTypingBroadcast = useCallback(
    (isTyping: boolean) => {
      if (!conversationId || !currentUserId || !currentUserName) return;
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversationId,
          userId: currentUserId,
          name: currentUserName,
          isTyping,
          timestamp: Date.now(),
        },
      });
    },
    [conversationId, currentUserId, currentUserName]
  );

  // Send typing start with heartbeat
  const sendTypingStart = useCallback(() => {
    if (!conversationId || !currentUserId || !currentUserName) return;
    if (!channelRef.current) return;

    // First time typing - set flag and send initial broadcast
    if (!isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = true;
      console.log('[Typing] start', {
        conversationId,
        currentUserId,
        currentUserName,
      });
      sendTypingBroadcast(true);
    }

    // Start heartbeat interval to keep typing indicator alive (every 1000ms)
    if (!typingHeartbeatRef.current) {
      typingHeartbeatRef.current = setInterval(() => {
        if (!isCurrentlyTypingRef.current) return;
        console.log('[Typing] heartbeat', {
          conversationId,
          currentUserId,
        });
        sendTypingBroadcast(true);
      }, 1000);
    }
  }, [conversationId, currentUserId, currentUserName, sendTypingBroadcast]);

  // Send typing stop
  const sendTypingStop = useCallback(() => {
    if (!conversationId || !currentUserId || !currentUserName) return;
    if (!channelRef.current) return;

    // Only stop if we were typing
    if (!isCurrentlyTypingRef.current) return;

    isCurrentlyTypingRef.current = false;

    // Clear heartbeat interval
    if (typingHeartbeatRef.current) {
      clearInterval(typingHeartbeatRef.current);
      typingHeartbeatRef.current = null;
    }

    console.log('[Typing] stop', {
      conversationId,
      currentUserId,
      currentUserName,
    });

    sendTypingBroadcast(false);
  }, [conversationId, currentUserId, currentUserName, sendTypingBroadcast]);

  // Setup channel when conversationId changes
  useEffect(() => {
    console.log('[Typing] hook mounted', {
      conversationId,
      currentUserId,
      currentUserName,
    });

    if (!conversationId || !currentUserId || !currentUserName) {
      console.log('[Typing] skipped - missing required params');
      return;
    }

    console.log('[Typing] joining channel', `typing:${conversationId}`);

    // Create channel for this conversation
    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    // Listen for typing broadcasts
    channel.on(
      'broadcast',
      { event: 'typing' },
      ({ payload }: { payload: any }) => {
        console.log('[Typing] received', payload);

        if (!payload) return;

        // Ignore own typing events
        if (payload.userId === currentUserId) return;

        // Ignore if wrong conversation
        if (payload.conversationId !== conversationId) return;

        if (payload.isTyping) {
          // Add or update typing user
          setTypingUsers((prev) => {
            const exists = prev.some((user) => user.userId === payload.userId);

            if (exists) {
              return prev.map((user) =>
                user.userId === payload.userId
                  ? {
                      userId: payload.userId,
                      name: payload.name || 'Someone',
                      timestamp: payload.timestamp,
                    }
                  : user
              );
            }

            return [
              ...prev,
              {
                userId: payload.userId,
                name: payload.name || 'Someone',
                timestamp: payload.timestamp,
              },
            ];
          });

          // Set auto-clear timeout for this user
          clearUserTimeout(payload.userId);
          timeoutsRef.current[payload.userId] = setTimeout(() => {
            console.log('[Typing] auto-clear', payload.userId);
            removeTypingUser(payload.userId);
          }, AUTO_CLEAR_TIMEOUT);
        } else {
          // Remove typing user
          removeTypingUser(payload.userId);
        }

        console.log('[Typing] users', typingUsers);
      }
    );

    // Subscribe to channel
    channel.subscribe((status) => {
      console.log('[Typing] channel status', status);
    });

    // Cleanup on conversation change or unmount
    return () => {
      console.log('[Typing] cleanup', {
        conversationId,
        currentUserId,
        wasTyping: isCurrentlyTypingRef.current,
      });

      // Send stop if we were typing
      if (isCurrentlyTypingRef.current && channelRef.current) {
        sendTypingBroadcast(false);
      }

      // Reset typing flag
      isCurrentlyTypingRef.current = false;

      // Clear heartbeat interval
      if (typingHeartbeatRef.current) {
        clearInterval(typingHeartbeatRef.current);
        typingHeartbeatRef.current = null;
      }

      // Clear all received-user timeouts
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};

      // Clear typing users
      setTypingUsers([]);

      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, currentUserId, currentUserName, sendTypingBroadcast, clearUserTimeout, removeTypingUser]);

  return {
    typingUsers,
    sendTypingStart,
    sendTypingStop,
  };
}
