/**
 * useNotifications Hook
 * 
 * React hook for managing notification state and realtime subscriptions.
 * Handles fetching, realtime updates, and read status management.
 * 
 * @module features/notifications/useNotifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from './notificationsService';

/**
 * useNotifications Hook
 * 
 * @param {string} userId - The current user's ID
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Max notifications to fetch (default: 50)
 * @param {boolean} options.enableRealtime - Enable realtime subscription (default: true)
 * @returns {Object} Notification state and handlers
 */
export function useNotifications(userId, options = {}) {
  const { limit = 50, enableRealtime = true } = options;

  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestRealtimeNotification, setLatestRealtimeNotification] = useState(null);
  
  // Use ref to track subscription cleanup
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  /**
   * Calculate unread count from current notifications
   */
  const unreadCount = notifications.filter(n => !n.is_read).length;

  /**
   * Load notifications from Supabase
   */
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await fetchNotifications(userId, limit);

    if (!isMountedRef.current) return;

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
    initialLoadDoneRef.current = true;
  }, [userId, limit]);

  /**
   * Handle new realtime notification
   * Prepends to list and updates unread count automatically
   */
  const handleRealtimeNotification = useCallback((newNotification) => {
    if (!isMountedRef.current) return;

    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === newNotification.id)) {
        return prev;
      }

      // Prepend new notification (newest first)
      return [newNotification, ...prev];
    });

    // Only surface to toast after initial load is done (skip page-load data)
    if (initialLoadDoneRef.current) {
      setLatestRealtimeNotification(newNotification);
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );

    const { success, error: markError } = await markNotificationAsRead(notificationId);

    if (!success) {
      console.error('[useNotifications] Mark as read failed:', markError);
      // Revert on failure by reloading
      loadNotifications();
    }
  }, [loadNotifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        is_read: true,
        read_at: n.read_at || new Date().toISOString(),
      }))
    );

    const { success, error: markError } = await markAllNotificationsAsRead(userId);

    if (!success) {
      console.error('[useNotifications] Mark all as read failed:', markError);
      // Revert on failure
      loadNotifications();
    }
  }, [userId, loadNotifications]);

  /**
   * Initial fetch on mount or userId change
   */
  useEffect(() => {
    isMountedRef.current = true;
    loadNotifications();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadNotifications]);

  /**
   * Setup realtime subscription
   */
  useEffect(() => {
    if (!userId || !enableRealtime) return;

    // Cleanup any existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Subscribe to new notifications
    unsubscribeRef.current = subscribeToNotifications(userId, handleRealtimeNotification);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userId, enableRealtime, handleRealtimeNotification]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    latestRealtimeNotification,
    
    // Actions
    markAsRead,
    markAllAsRead,
    setNotifications,
    refresh: loadNotifications,
  };
}

export default useNotifications;
