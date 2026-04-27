import { useState, useRef, useEffect, useCallback } from "react";
import { BellIcon, XMarkIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  getCurrentUser,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../services/fakeApi";

function Notification() {
  const currentUser = getCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Load notifications
  const loadNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    const userNotifications = getNotifications(currentUser.id);
    setNotifications(userNotifications);
    setUnreadCount(getUnreadNotificationCount(currentUser.id));
  }, [currentUser?.id]);

  // Initial load and event listener
  useEffect(() => {
    // Defer to next tick to avoid ESLint warning about sync setState in effect
    const timeoutId = setTimeout(loadNotifications, 0);

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener("teamup_notifications_updated", handleNotificationUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("teamup_notifications_updated", handleNotificationUpdate);
    };
  }, [loadNotifications]);

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

  // Handle notification click - mark as read
  const handleNotificationClick = (notificationId) => {
    if (!currentUser?.id) return;
    markNotificationAsRead(currentUser.id, notificationId);
    loadNotifications();
  };

  // Mark all as read
  const handleMarkAllRead = () => {
    if (!currentUser?.id) return;
    markAllNotificationsAsRead(currentUser.id);
    loadNotifications();
  };

  // Delete notification
  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    deleteNotification(currentUser.id, notificationId);
    loadNotifications();
  };

  // Format relative time
  const formatTime = (dateString) => {
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

  // Get icon color based on notification type
  const getTypeStyles = (type) => {
    switch (type) {
      case "quiz":
        return "bg-blue-100 text-blue-600";
      case "profile":
        return "bg-green-100 text-green-600";
      case "password":
        return "bg-yellow-100 text-yellow-600";
      case "portfolio":
        return "bg-purple-100 text-purple-600";
      case "auth":
        return "bg-teal-100 text-teal-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // If no user is logged in, don't render anything
  if (!currentUser?.id) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
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
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#0f766e] hover:bg-gray-100"
                  title="Mark all as read"
                >
                  <CheckIcon className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <BellIcon className="h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400">
                  We will notify you when something important happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`group relative cursor-pointer px-4 py-3 transition hover:bg-gray-50 ${
                      !notification.isRead ? "bg-[#f0fdfa]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getTypeStyles(
                          notification.type
                        )}`}
                      >
                        <BellIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Unread Indicator & Delete */}
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[#0f766e]"></span>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="rounded p-1 text-gray-300 opacity-0 transition hover:bg-gray-200 hover:text-gray-500 group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-center text-xs text-gray-400">
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
