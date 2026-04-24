import React, { memo } from "react";
import { Moon, CircleUser } from "lucide-react";
import { NotificationDropdown } from "../Notifications";
import logo from "../../assets/logo/teamup-logo.png";

/**
 * SkillQuizHeader component with notification dropdown.
 * Accepts notification props to pass to NotificationDropdown.
 */
const SkillQuizHeader = ({
  notifications,
  unreadCount,
  hasUnread,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllNotifications,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="TeamUp logo"
            className="h-8 w-8 object-contain"
          />
          <span className="text-[22px] font-semibold text-teal-700">
            TeamUp
          </span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            hasUnread={hasUnread}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onDelete={onDeleteNotification}
            onClearAll={onClearAllNotifications}
          />

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            type="button"
            aria-label="Theme"
          >
            <Moon size={20} />
          </button>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            type="button"
            aria-label="Profile"
          >
            <CircleUser size={19} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default memo(SkillQuizHeader);