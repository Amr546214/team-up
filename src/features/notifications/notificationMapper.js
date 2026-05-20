/**
 * Notification Mapper
 * 
 * Centralized notification metadata system.
 * Maps notification types to UI properties (icon, color, path, label).
 * 
 * This is the single source of truth for notification presentation logic.
 * Future notification types should be added here.
 * 
 * @module features/notifications/notificationMapper
 */

// Import icons from lucide-react (adjust based on your icon library)
// If using different icon library, update these imports
const ICONS = {
  UserPlus: 'UserPlus',
  MessageCircle: 'MessageCircle',
  AtSign: 'AtSign',
  Users: 'Users',
  Folder: 'Folder',
  Shield: 'Shield',
  Bell: 'Bell',
  CheckCircle: 'CheckCircle',
  AlertCircle: 'AlertCircle',
  Info: 'Info',
};

/**
 * Default fallback configuration for unknown notification types
 */
const DEFAULT_CONFIG = {
  icon: ICONS.Bell,
  color: 'gray',
  label: 'Notification',
  getRedirectPath: () => '/notifications',
  priority: 'low',
};

/**
 * Notification type configurations
 * 
 * Each type defines:
 * - icon: Lucide icon name
 * - color: Theme color (blue, green, red, yellow, purple, teal, gray)
 * - label: Human-readable label
 * - getRedirectPath: Function that returns navigation path based on notification metadata
 * - priority: 'high' | 'medium' | 'low' - affects visual prominence
 * 
 * TODO: Add more notification types as features grow:
 * - project_deadline_approaching
 * - task_assigned
 * - review_requested
 * - payment_received
 * - subscription_expiring
 * - security_alert
 */
const NOTIFICATION_TYPES = {
  /**
   * Developer invited to a team/project
   */
  developer_invited: {
    icon: ICONS.UserPlus,
    color: 'blue',
    label: 'Team Invitation',
    getRedirectPath: (metadata) => {
      if (metadata?.teamId) return `/team/${metadata.teamId}`;
      if (metadata?.projectId) return `/project/${metadata.projectId}`;
      return '/teams';
    },
    priority: 'high',
  },

  /**
   * New message received in chat
   */
  message_received: {
    icon: ICONS.MessageCircle,
    color: 'teal',
    label: 'New Message',
    getRedirectPath: (metadata) => {
      if (metadata?.redirectTo) return metadata.redirectTo;
      if (metadata?.conversationId) return `/dev/chat-test?conversation=${metadata.conversationId}`;
      return '/dev/chat-test';
    },
    priority: 'medium',
  },

  /**
   * User mentioned in a message/comment
   */
  mention_received: {
    icon: ICONS.AtSign,
    color: 'purple',
    label: 'You were mentioned',
    getRedirectPath: (metadata) => {
      if (metadata?.redirectTo) return metadata.redirectTo;
      if (metadata?.messageId && metadata?.conversationId) {
        return `/dev/chat-test?conversation=${metadata.conversationId}&message=${metadata.messageId}`;
      }
      if (metadata?.commentId && metadata?.projectId) {
        return `/project/${metadata.projectId}?comment=${metadata.commentId}`;
      }
      return '/notifications';
    },
    priority: 'high',
  },

  /**
   * Team invitation accepted
   */
  team_accepted: {
    icon: ICONS.Users,
    color: 'green',
    label: 'Team Update',
    getRedirectPath: (metadata) => {
      if (metadata?.teamId) return `/team/${metadata.teamId}`;
      return '/teams';
    },
    priority: 'medium',
  },

  /**
   * Project status changed (started, completed, on-hold, etc.)
   */
  project_status_changed: {
    icon: ICONS.Folder,
    color: 'yellow',
    label: 'Project Update',
    getRedirectPath: (metadata) => {
      if (metadata?.projectId) return `/project/${metadata.projectId}`;
      return '/projects';
    },
    priority: 'medium',
  },

  /**
   * Admin notification: new user signup
   */
  admin_new_signup: {
    icon: ICONS.Shield,
    color: 'red',
    label: 'New Signup',
    getRedirectPath: (metadata) => {
      if (metadata?.userId) return `/admin/users/${metadata.userId}`;
      return '/admin/users';
    },
    priority: 'low',
  },

  /**
   * General system notification
   */
  system: {
    icon: ICONS.Info,
    color: 'gray',
    label: 'System',
    getRedirectPath: () => '/notifications',
    priority: 'low',
  },

  /**
   * Welcome notification for new users
   */
  welcome: {
    icon: ICONS.CheckCircle,
    color: 'green',
    label: 'Welcome',
    getRedirectPath: () => '/getting-started',
    priority: 'low',
  },
};

/**
 * Get notification configuration by type
 * 
 * @param {string} type - The notification type
 * @returns {Object} Configuration object with icon, color, label, getRedirectPath, priority
 */
export function getNotificationConfig(type) {
  const config = NOTIFICATION_TYPES[type];
  
  if (!config) {
    console.warn(`[notificationMapper] Unknown notification type: "${type}". Using default.`);
    return DEFAULT_CONFIG;
  }
  
  return config;
}

/**
 * Get notification icon by type
 * 
 * @param {string} type - The notification type
 * @returns {string} Icon name
 */
export function getNotificationIcon(type) {
  return getNotificationConfig(type).icon;
}

/**
 * Get notification color by type
 * 
 * @param {string} type - The notification type
 * @returns {string} Color name
 */
export function getNotificationColor(type) {
  return getNotificationConfig(type).color;
}

/**
 * Get notification label by type
 * 
 * @param {string} type - The notification type
 * @returns {string} Human-readable label
 */
export function getNotificationLabel(type) {
  return getNotificationConfig(type).label;
}

/**
 * Get redirect path for a notification
 * 
 * @param {string} type - The notification type
 * @param {Object} metadata - Notification metadata
 * @returns {string} Navigation path
 */
export function getNotificationRedirectPath(type, metadata = {}) {
  const config = getNotificationConfig(type);
  return config.getRedirectPath(metadata);
}

/**
 * Get notification priority by type
 * 
 * @param {string} type - The notification type
 * @returns {string} Priority level (high, medium, low)
 */
export function getNotificationPriority(type) {
  return getNotificationConfig(type).priority;
}

/**
 * Get full notification display data
 * 
 * @param {Object} notification - The notification object
 * @returns {Object} Complete display configuration
 */
export function mapNotification(notification) {
  if (!notification) return null;

  const config = getNotificationConfig(notification.type);
  
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    isRead: notification.is_read,
    createdAt: notification.created_at,
    actorId: notification.actor_id,
    metadata: notification.data || {},
    
    // UI properties
    icon: config.icon,
    color: config.color,
    label: config.label,
    priority: config.priority,
    redirectPath: config.getRedirectPath(notification.data || {}),
  };
}

/**
 * Get all supported notification types
 * Useful for admin panels and documentation
 * 
 * @returns {Array} List of notification type keys
 */
export function getSupportedNotificationTypes() {
  return Object.keys(NOTIFICATION_TYPES);
}

/**
 * Check if a notification type is valid/supported
 * 
 * @param {string} type - The notification type to check
 * @returns {boolean} True if type is supported
 */
export function isValidNotificationType(type) {
  return type in NOTIFICATION_TYPES;
}

/**
 * Group notifications by priority
 * 
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Grouped by priority: { high: [], medium: [], low: [] }
 */
export function groupNotificationsByPriority(notifications) {
  return notifications.reduce(
    (groups, notification) => {
      const priority = getNotificationPriority(notification.type);
      groups[priority].push(notification);
      return groups;
    },
    { high: [], medium: [], low: [] }
  );
}

/**
 * Color mapping for Tailwind CSS classes
 * Maps color names to actual Tailwind classes
 * 
 * @param {string} color - Color name (blue, green, red, etc.)
 * @returns {Object} Tailwind class mappings
 */
export function getColorClasses(color) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      text: 'text-green-700',
      dot: 'bg-green-500',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      text: 'text-red-700',
      dot: 'bg-red-500',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-500',
      text: 'text-purple-700',
      dot: 'bg-purple-500',
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      icon: 'text-teal-500',
      text: 'text-teal-700',
      dot: 'bg-teal-500',
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: 'text-gray-500',
      text: 'text-gray-700',
      dot: 'bg-gray-500',
    },
  };

  return colorMap[color] || colorMap.gray;
}
