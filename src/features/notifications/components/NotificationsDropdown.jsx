import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../useNotifications";
import { getNotificationConfig } from "../notificationMapper";
import { useAuth } from "../../../hooks/useAuth";
import NotificationItem from "./NotificationItem";

/**
 * NotificationsDropdown
 *
 * Bell icon button with unread badge and dropdown panel.
 * Uses useNotifications hook for realtime state.
 * Integrates into the Navbar without breaking existing elements.
 */
function NotificationsDropdown() {
  const navigate = useNavigate();
  const { supabaseSession, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Use Supabase user ID for notifications, fallback to app session id
  const userId = supabaseSession?.user?.id || session?.id || null;

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId, { limit: 50, enableRealtime: true });

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

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);

    const config = getNotificationConfig(notification.type);
    const redirectPath = config.getRedirectPath(notification.metadata);

    if (redirectPath && redirectPath !== "/notifications") {
      navigate(redirectPath);
    }

    setIsOpen(false);
  };

  // Don't render if no user logged in
  if (!userId) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-teal-50 hover:text-[#0B6B63]"
        type="button"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:border-gray-700 dark:bg-gray-800 sm:w-96">
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

          {/* List */}
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
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}
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

export default NotificationsDropdown;
