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

// Project notifications
export {
  notifyProjectStatusChange,
  notifyProjectStatusChangeWithFetch,
  fetchProjectTeamMembers,
} from './projectNotifications';

// Automatic notification triggers (primary API for creating notifications)
export {
  notifyDevelopersInvited,
  triggerMessageNotifications,
  triggerMissedCallNotification,
  triggerProjectStatusNotifications,
  // Re-exports from chat notifications
  notifyMessageRecipients,
  notifyMentions,
  notifyMissedCall,
  setActiveConversationForNotifications,
  getActiveConversationForNotifications,
} from './notificationTriggers';

// Hooks
export { useNotifications, default } from './useNotifications';

// Components
export { default as NotificationsDropdown } from './components/NotificationsDropdown';
export { default as NotificationItem } from './components/NotificationItem';
export { default as NotificationToast } from './components/NotificationToast';

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
