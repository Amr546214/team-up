import {
  MoonIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import teamupLogo from "../../assets/logo/teamup-logo.png";
import Notification from "./Notification";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "../../hooks/useAuth";

function getDashboardPathByRole(role) {
  switch (role) {
    case "client":
      return "/client/profile";
    case "developer":
      return "/developer/dashboard";
    case "company":
      return "/company/profile";
    case "admin":
      return "/";
    default:
      return "/";
  }
}

function Header({ profileImage }) {
  const navigate = useNavigate();
  const { session, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

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
    navigate("/login");
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

          {/* Notifications - Only shows when logged in */}
          {isAuthenticated && <Notification />}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme */}
          <button
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 transition hover:bg-teal-50 hover:text-[#0B6B63]"
            type="button"
          >
            <MoonIcon className="h-5 w-5" />
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
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8" />
                )}
              </button>

              {/* Dropdown Menu */}
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{session?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{session?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate(getDashboardPathByRole(session?.role));
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