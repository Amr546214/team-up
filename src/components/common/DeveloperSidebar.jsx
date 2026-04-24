import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Send,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import teamupLogo from "../../assets/logo/teamup-logo.png";

function DeveloperSidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const userData = {
    name: "Hanan Muhammed",
    email: "hanan@example.com",
    image: "",
    role: "developer",
  };

  const activeProjectData = {
    name: "TeamUp Platform",
    status: "active",
  };

  const menuItemsData = [
    {
      id: 1,
      key: "dashboard",
      name: "Dashboard",
      path: "/developer/dashboard",
    },
    {
      id: 2,
      key: "projects",
      name: "My Projects",
      path: "/developer/projects",
    },
    {
      id: 3,
      key: "applications",
      name: "Applications",
      path: "/developer/applications",
    },
    {
      id: 4,
      key: "profile",
      name: "Profile",
      path: "/developer/profile",
    },
  ];

  /* =========================
     UI / Design Logic only
  ========================== */
  const getMenuItemIcon = (key) => {
    switch (key) {
      case "dashboard":
        return LayoutDashboard;
      case "projects":
        return FolderOpen;
      case "applications":
        return Send;
      case "profile":
        return User;
      default:
        return LayoutDashboard;
    }
  };

  const getActiveProjectStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-[#22C55E]";
      case "pending":
        return "bg-[#EAB308]";
      case "completed":
        return "bg-[#3B82F6]";
      default:
        return "bg-[#9CA3AF]";
    }
  };

  return (
    <aside
    className={`fixed top-0 left-0 h-screen bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-all duration-300 z-[60] ${
      isCollapsed ? "w-[90px]" : "w-[230px]"
    }`}
  >
      <div className="relative h-full flex flex-col">
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm hover:bg-[#F8FAFC] transition z-10"
        >
          {isCollapsed ? (
            <ChevronRight size={14} className="text-[#6B7280]" />
          ) : (
            <ChevronLeft size={14} className="text-[#6B7280]" />
          )}
        </button>

        <div>
          {/* Logo + Name */}
          <div className="px-4 pt-4 pb-6">
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "gap-2"
              }`}
            >
              <img
                src={teamupLogo}
                alt="TeamUp Logo"
                className="w-[24px] h-[24px] object-contain shrink-0"
              />

              {!isCollapsed && (
                <h1 className="text-[14px] font-semibold text-[#0B6F6C]">
                  TeamUp
                </h1>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="px-3 space-y-3">
            {menuItemsData.map((item) => {
              const Icon = getMenuItemIcon(item.key);
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full h-[36px] rounded-[8px] flex items-center ${
                    isCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } text-left transition ${
                    isActive
                      ? "bg-[#C9E6E4] text-[#1B6E6A]"
                      : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} className="shrink-0" />

                  {!isCollapsed && (
                    <span className="text-[12px] font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Active Project */}
          {!isCollapsed && (
            <div className="px-6 mt-10">
              <h3 className="text-[12px] font-semibold text-[#B0B7C3] mb-3">
                Active Projects
              </h3>

              <div className="flex items-center gap-2">
                <span
                  className={`w-[10px] h-[10px] rounded-full ${getActiveProjectStatusStyle(
                    activeProjectData.status
                  )}`}
                ></span>
                <p className="text-[12px] font-medium text-[#6B7280]">
                  {activeProjectData.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="px-2 pb-3 mt-auto">
          <Link
            to="/developer/profile"
            className={`flex items-center rounded-[8px] px-2 py-2 transition hover:bg-[#F8FAFC] ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {userData.image ? (
                <img
                  src={userData.image}
                  alt={userData.name}
                  className="w-[28px] h-[28px] rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-[28px] h-[28px] rounded-full bg-[#D9D9D9] shrink-0"></div>
              )}

              {!isCollapsed && (
                <div className="min-w-0">
                  <h4 className="text-[11px] font-semibold text-[#4B5563] leading-none truncate">
                    {userData.name}
                  </h4>
                  <p className="text-[10px] text-[#9CA3AF] mt-1 truncate">
                    {userData.email}
                  </p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ArrowRight size={14} className="text-[#9CA3AF] shrink-0" />
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default DeveloperSidebar;