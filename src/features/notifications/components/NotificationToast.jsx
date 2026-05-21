import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellIcon,
  XMarkIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  AtSymbolIcon,
  UsersIcon,
  FolderIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../useNotifications";
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

const TOAST_DURATION = 5000;

/**
 * NotificationToast
 *
 * Global toast that appears when a new realtime notification arrives.
 * Mounted once at the App level. Auto-hides after 5 seconds.
 * Clicking navigates to the notification's redirect path.
 */
function NotificationToast() {
  const navigate = useNavigate();
  const { supabaseSession, session } = useAuth();
  const userId = supabaseSession?.user?.id || session?.id || null;

  const { latestRealtimeNotification, markAsRead } = useNotifications(userId, {
    limit: 0,
    enableRealtime: true,
  });

  const [toast, setToast] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);
  const shownIdsRef = useRef(new Set());

  const dismissToast = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, 300);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Show toast when a new realtime notification arrives
  useEffect(() => {
    if (!latestRealtimeNotification) return;

    const id = latestRealtimeNotification.id;

    // Deduplicate — don't show the same notification twice
    if (shownIdsRef.current.has(id)) return;
    shownIdsRef.current.add(id);

    // Cap the set size to prevent unbounded growth
    if (shownIdsRef.current.size > 200) {
      const entries = [...shownIdsRef.current];
      shownIdsRef.current = new Set(entries.slice(-100));
    }

    setIsExiting(false);
    setToast(latestRealtimeNotification);

    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Auto-hide after TOAST_DURATION
    timerRef.current = setTimeout(() => {
      dismissToast();
    }, TOAST_DURATION);
  }, [latestRealtimeNotification, dismissToast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (!toast) return;

    // Mark as read
    await markAsRead(toast.id);

    // Navigate to redirect path
    const config = getNotificationConfig(toast.type);
    const redirectPath = config.getRedirectPath(toast.data || {});
    if (redirectPath && redirectPath !== "/notifications") {
      navigate(redirectPath);
    }

    dismissToast();
  };

  if (!toast) return null;

  // Pass toast data for dynamic color support (e.g., project_status_changed)
  const config = getNotificationConfig(toast.type, toast.data);
  const colors = getColorClasses(config.color);
  const IconComponent = ICON_MAP[config.icon] || BellIcon;

  return (
    <div
      className={`fixed bottom-6 right-6 z-9999 w-80 sm:w-96 transition-all duration-300 ${
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      }`}
    >
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full bg-[#0f766e] dark:bg-teal-400"
            style={{
              animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
            }}
          />
        </div>

        <div
          onClick={handleClick}
          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
        >
          {/* Icon */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colors.bg} ${colors.icon}`}
          >
            <IconComponent className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {toast.title}
            </p>
            {toast.body && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {toast.body}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300 transition"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Inline keyframes for progress bar animation */}
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default NotificationToast;
