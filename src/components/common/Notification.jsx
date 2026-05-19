import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  AtSymbolIcon,
  UsersIcon,
  FolderIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../../features/notifications";
import {
  getNotificationConfig,
  getColorClasses,
} from "../../features/notifications";
import { useAuth } from "../../hooks/useAuth";

// Icon mapping from string names to actual components
const ICON_MAP = {
  UserPlus: UserPlusIcon,
  MessageCircle: ChatBubbleLeftRightIcon,
  AtSign: AtSymbolIcon,
  Users: UsersIcon,
  Folder: FolderIcon,
  Shield: ShieldCheckIcon,
  Bell: BellIcon,
  CheckCircle: CheckIcon,
  AlertCircle: BellIcon,
  Info: BellIcon,
};

/**
 * Notification Dropdown Component
 *
 * Displays notifications with realtime updates, unread badges,
 * and interactive actions. Integrates with the notification system.
 */
function Notification() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use the notifications hook with realtime subscription
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(session?.user?.id, { limit: 50, enableRealtime: true });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = async (notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Navigate to redirect path if available
    const config = getNotificationConfig(notification.type);
    const redirectPath = config.getRedirectPath(notification.metadata);

    if (redirectPath && redirectPath !== "/notifications") {
      navigate(redirectPath);
    }

    // Close dropdown
    setIsOpen(false);
  };

  // Format relative time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon component based on notification type
  const getNotificationIcon = (type) => {
    const config = getNotificationConfig(type);
    return ICON_MAP[config.icon] || BellIcon;
  };

  // Get Tailwind classes based on notification type
  const getNotificationStyles = (type) => {
    const config = getNotificationConfig(type);
    const colors = getColorClasses(config.color);
    return `${colors.bg} ${colors.icon}`;
  };

  // If no user is logged in, don't render anything
  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-teal-50 hover:text-[#0B6B63]"
        type="button"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-gray-700 dark:bg-gray-800 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-gray-100 dark:text-teal-400 dark:hover:bg-gray-700"
                  title="Mark all as read"
                >
                  <CheckIcon className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-teal-500"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <BellIcon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  We will notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const iconStyles = getNotificationStyles(notification.type);

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative cursor-pointer px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        !notification.is_read
                          ? "bg-[#f0fdfa] dark:bg-teal-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconStyles}`}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              !notification.is_read
                                ? "font-semibold text-gray-900 dark:text-gray-100"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                            {notification.body}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.is_read && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#0f766e] dark:bg-teal-400"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && !loading && (
            <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notification;
