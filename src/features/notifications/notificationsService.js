/**
 * Notification Service
 * 
 * Handles all Supabase interactions for the notification system.
 * Provides CRUD operations and realtime subscriptions.
 * 
 * @module features/notifications/notificationsService
 */

import { supabase } from '../../lib/supabase';

/**
 * Fetch notifications for a user with optional limit
 * 
 * @param {string} userId - The user ID to fetch notifications for
 * @param {number} limit - Maximum number of notifications to fetch (default: 50)
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function fetchNotifications(userId, limit = 50) {
  try {
    if (!userId) {
      return { data: null, error: 'User ID is required' };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Notifications] Fetch failed:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return { data: null, error: err?.message || 'Failed to fetch notifications' };
  }
}

/**
 * Mark a single notification as read
 * 
 * @param {string} notificationId - The notification ID to mark as read
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    if (!notificationId) {
      return { success: false, error: 'Notification ID is required' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('[Notifications] Mark as read failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return { success: false, error: err?.message || 'Failed to mark as read' };
  }
}

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - The user ID to mark all notifications as read
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('[Notifications] Mark all as read failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return { success: false, error: err?.message || 'Failed to mark all as read' };
  }
}

/**
 * Create a new notification
 * 
 * TODO: In production, this should be called from backend triggers/functions
 * to ensure notifications are created securely and consistently.
 * Frontend should only create notifications for user-initiated actions.
 * 
 * @param {Object} notification - The notification data
 * @param {string} notification.userId - Target user ID
 * @param {string} notification.type - Notification type (e.g., 'developer_invited')
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body/message
 * @param {Object} [notification.metadata] - Additional data (projectId, teamId, etc.)
 * @param {string} [notification.actorId] - User who triggered the notification (optional)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  metadata = {},
  actorId = null,
}) {
  try {
    console.log('[Notification Trigger] createNotification called:', { userId, type, title, actorId });

    if (!userId || !type || !title) {
      console.error('[Notification Trigger] missing required fields:', { userId, type, title });
      return { data: null, error: 'userId, type, and title are required' };
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: userId,
        type,
        title,
        body,
        data: metadata,
        actor_id: actorId,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Notification Trigger] create failed:', error);
      return { data: null, error: error.message };
    }

    console.log('[Notification Trigger] created successfully:', data?.id);
    return { data, error: null };
  } catch (err) {
    console.error('[Notification Trigger] unexpected error:', err);
    return { data: null, error: err?.message || 'Failed to create notification' };
  }
}

/**
 * Subscribe to realtime notifications for a user
 *
 * Uses Supabase Realtime to listen for new notifications.
 * Returns an unsubscribe function for cleanup.
 *
 * IMPORTANT: Channel name must be unique to avoid conflicts when multiple
 * components subscribe. Use Date.now() to ensure uniqueness.
 *
 * @param {string} userId - The user ID to subscribe to
 * @param {Function} callback - Function to call when new notification arrives
 * @returns {Function} Unsubscribe cleanup function
 */
export function subscribeToNotifications(userId, callback) {
  if (!userId) {
    console.warn('[Notifications] Cannot subscribe: userId is required');
    return () => {};
  }

  // Use unique channel name to prevent conflicts when multiple components subscribe
  const channelName = `notifications:${userId}:${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        callback?.(payload.new);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Delete old read notifications (cleanup utility)
 * 
 * TODO: This should be run as a scheduled backend job
 * to prevent notification table from growing indefinitely.
 * 
 * @param {string} userId - The user ID
 * @param {number} daysToKeep - Number of days to keep (default: 30)
 * @returns {Promise<{success: boolean, count: number, error: string|null}>}
 */
export async function deleteOldNotifications(userId, daysToKeep = 30) {
  try {
    if (!userId) {
      return { success: false, count: 0, error: 'User ID is required' };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error, count } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_id', userId)
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('[Notifications] Cleanup failed:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: count || 0, error: null };
  } catch (err) {
    console.error('[Notifications] Cleanup error:', err);
    return { success: false, count: 0, error: err?.message };
  }
}
