import {
  BellIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  AtSymbolIcon,
  UsersIcon,
  FolderIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { getNotificationConfig, getColorClasses } from "../notificationMapper";

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

function formatTimeAgo(dateString) {
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
}

/**
 * NotificationItem
 *
 * Renders a single notification row with icon, title, body, time ago,
 * and unread highlight. On click: marks as read, navigates, closes dropdown.
 */
function NotificationItem({ notification, onClick }) {
  const config = getNotificationConfig(notification.type);
  const colors = getColorClasses(config.color);
  const IconComponent = ICON_MAP[config.icon] || BellIcon;

  return (
    <div
      onClick={() => onClick(notification)}
      className={`group relative cursor-pointer px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-gray-700 ${
        !notification.is_read ? "bg-[#f0fdfa] dark:bg-teal-900/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.icon}`}
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
          {notification.body && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
              {notification.body}
            </p>
          )}
          <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.is_read && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#0f766e] dark:bg-teal-400"></span>
        )}
      </div>
    </div>
  );
}

export default NotificationItem;
