import { useState, useEffect, useCallback, useMemo } from "react";

const STORAGE_KEY = "quizNotifications";

/**
 * Custom hook for managing notifications with localStorage persistence.
 * Returns notifications array and helper functions.
 */
const useNotifications = () => {
  // Initialize from localStorage or empty array
  const [notifications, setNotifications] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("[useNotifications] Failed to save:", error);
    }
  }, [notifications]);

  /**
   * Add a new notification for completed quiz
   * @param {Object} params - Notification data
   * @param {number} params.score - Quiz score
   * @param {string} params.rank - Rank (gold, silver, needsImprovement)
   * @param {string} params.trackTitle - Track name
   */
  const addNotification = useCallback(({ score, rank, trackTitle }) => {
    const newNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      score,
      rank,
      trackTitle: trackTitle || "Quiz",
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   */
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Delete a single notification
   * @param {string} id - Notification ID
   */
  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Computed values
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
  };
};

export default useNotifications;
