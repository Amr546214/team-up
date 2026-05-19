/**
 * Notifications Feature Module
 * 
 * Centralized notification system for TeamUP.
 * Provides services, hooks, and mapping for notification management.
 * 
 * @module features/notifications
 */

// Services
export {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  subscribeToNotifications,
  deleteOldNotifications,
} from './notificationsService';

// Hooks
export { useNotifications, default } from './useNotifications';

// Mapper utilities
export {
  getNotificationConfig,
  getNotificationIcon,
  getNotificationColor,
  getNotificationLabel,
  getNotificationRedirectPath,
  getNotificationPriority,
  mapNotification,
  getSupportedNotificationTypes,
  isValidNotificationType,
  groupNotificationsByPriority,
  getColorClasses,
} from './notificationMapper';
