import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import {
  Bell,
  X,
  Trash2,
  Check,
  Trophy,
  Medal,
  AlertTriangle,
} from "lucide-react";

const RANK_CONFIG = {
  gold: {
    label: "Gold",
    icon: <Trophy size={14} />,
    className: "bg-yellow-100 text-yellow-700",
  },
  silver: {
    label: "Silver",
    icon: <Medal size={14} />,
    className: "bg-gray-100 text-gray-600",
  },
  needsImprovement: {
    label: "Needs Improvement",
    icon: <AlertTriangle size={14} />,
    className: "bg-red-100 text-red-600",
  },
};

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationItem = memo(({ notification, onRead, onDelete }) => {
  const rankInfo = RANK_CONFIG[notification.rank] || RANK_CONFIG.needsImprovement;

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
  };

  return (
    <div
      className={`relative flex cursor-pointer gap-3 border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50 ${
        notification.read ? "bg-white" : "bg-teal-50/60"
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${rankInfo.className}`}
        >
          {rankInfo.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800">
          <strong>{notification.trackTitle}</strong> quiz completed
        </p>

        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>
            Score: <strong>{notification.score}</strong>
          </span>

          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {rankInfo.label}
          </span>
        </p>

        <span className="mt-1 block text-[11px] text-gray-400">
          {formatDateTime(notification.timestamp)}
        </span>
      </div>

      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        aria-label="Delete notification"
      >
        <Trash2 size={14} />
      </button>

      {!notification.read && (
        <span className="absolute right-2 top-3 h-2 w-2 rounded-full bg-teal-600" />
      )}
    </div>
  );
});

NotificationItem.displayName = "NotificationItem";

const NotificationDropdown = ({
  notifications,
  unreadCount,
  hasUnread,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  }, [notifications]);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
        type="button"
        aria-label={`Notifications ${
          unreadCount > 0 ? `(${unreadCount} unread)` : ""
        }`}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        <Bell size={20} />

        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-base font-semibold text-gray-800">
              Notifications
            </h3>

            {hasNotifications && (
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-teal-700"
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <Check size={14} />
                  </button>
                )}

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                  onClick={onClearAll}
                  title="Clear all"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!hasNotifications ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <Bell size={32} className="mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">
                  No notifications yet
                </p>
                <span className="mt-1 text-xs text-gray-400">
                  Complete a quiz to see your results here
                </span>
              </div>
            ) : (
              <div>
                {sortedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={onMarkAsRead}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NotificationDropdown);