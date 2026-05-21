import {
  MoonIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import teamupLogo from "../../assets/logo/teamup-logo.png";
import Notification from "./Notification";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "../../hooks/useAuth";
import { useChatUnreadCount } from "../../features/chat";
import { getDashboardPath } from "../../utils/authStorage";

function Header({ profileImage }) {
  const navigate = useNavigate();
  const { session, isAuthenticated, logout, userRole, userProfile } = useAuth();
  const { t } = useTranslation();
  const { totalUnreadCount } = useChatUnreadCount();

  // Auth state comes from AuthContext (single source of truth)
  // AuthContext listens for "teamup-auth-changed" events and updates automatically
  const effectiveRole = userRole || "client";

  // Get avatar display info from userProfile
  const displayName = userProfile?.name || session?.name || userProfile?.email || "User";
  const avatarUrl = profileImage || userProfile?.avatarUrl || session?.avatar || "";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // close لما تدوسي برا
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6">
        
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 pl-8 cursor-pointer"
        >
          <img
            src={teamupLogo}
            alt="TeamUp Logo"
            className="h-8 w-8 object-contain"
          />
          <h2 className="text-[28px] font-semibold text-[#0f766e]">
            TeamUp
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Notifications */}
          <Notification />

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme */}
          <button
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-teal-50 hover:text-[#0B6B63]"
            type="button"
          >
            <MoonIcon className="h-5 w-5" />
          </button>

          {/* Chat Button */}
          <button
            onClick={() => navigate("/dev/chat-test")}
            className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-teal-50 hover:text-[#0B6B63]"
            type="button"
            title="Chat"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            {/* Unread messages badge */}
            {totalUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-sm">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </button>

          {/* Auth Buttons */}
          {isAuthenticated ? (
            /* Logged in - Profile + Dropdown */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-teal-50 hover:text-[#0B6B63]"
                type="button"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#0B6B63] text-white flex items-center justify-center font-semibold text-lg">
                    {avatarInitial}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{effectiveRole}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate(getDashboardPath(effectiveRole));
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {t("navigation.dashboard")}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in - Login/Register buttons */
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="h-10 cursor-pointer px-4 text-sm font-medium text-gray-700 transition hover:text-[#0B6B63]"
              >
                {t("common.login")}
              </button>
              <button
                onClick={() => navigate("/register")}
                className="h-10 cursor-pointer px-4 text-sm font-medium bg-[#0f766e] text-white rounded-lg transition hover:bg-[#0d9488]"
              >
                {t("common.register")}
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}

export default Header;