import {
  BellIcon,
  MoonIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import teamupLogo from "../../assets/logo/teamup-logo.png";

function Header({ profileImage, showProfileMenu }) {
  const navigate = useNavigate();

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
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
            type="button"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Theme */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
            type="button"
          >
            <MoonIcon className="h-5 w-5" />
          </button>

          {/* Profile + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => showProfileMenu && setOpen(!open)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
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

            {/* Dropdown (يظهر بس لو DevProfile مفعلها) */}
            {showProfileMenu && open && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md">
                <button
                  onClick={() => {
                    navigate("/developer/dashboard");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Dashboard
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;