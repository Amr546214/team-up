import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  PlusCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import teamupLogo from "../../assets/logo/teamup-logo.png";

function CompanySidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const companyData = {
    name: "TeamUp Company",
    type: "Software House",
    initials: "TC",
  };

  const hiringSummary = [
    { id: 1, label: "Active Job Posts", value: 12, color: "bg-[#22C55E]" },
    { id: 2, label: "Total Applicants", value: 200, color: "bg-[#4F7CFF]" },
    { id: 3, label: "Pending Interviews", value: 8, color: "bg-[#EAB308]" },
    { id: 4, label: "Hired Developers", value: 24, color: "bg-[#9333EA]" },
  ];

  // ✅ REMOVED: developers / notifications / settings
  const menuItemsData = [
    {
      id: 1,
      key: "dashboard",
      name: "Dashboard",
      path: "/company/dashboard",
    },
    {
      id: 2,
      key: "jobPosts",
      name: "Job Posts",
      path: "/company/jobs",
    },
    {
      id: 3,
      key: "applicants",
      name: "Applicants",
      path: "/company/applicants",
    },
    {
      id: 4,
      key: "interviews",
      name: "Interviews",
      path: "/company/interviews",
    },
    {
      id: 5,
      key: "autoSuggestTeam",
      name: "Auto Suggest Team",
      path: "/company/auto-suggest-team",
    },
    {
      id: 6,
      key: "postJob",
      name: "Post New Job",
      path: "/company/post-job",
    },
  ];

  const getMenuItemIcon = (key) => {
    switch (key) {
      case "dashboard":
        return LayoutDashboard;
      case "jobPosts":
        return Briefcase;
      case "applicants":
        return Users;
      case "interviews":
        return CalendarDays;
      case "autoSuggestTeam":
        return Sparkles;
      case "postJob":
        return PlusCircle;
      default:
        return LayoutDashboard;
    }
  };

  const isActiveRoute = (path) => {
    if (path.includes("#")) {
      return location.pathname + location.hash === path;
    }
    return location.pathname === path;
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
          {/* Logo */}
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
              const isActive = isActiveRoute(item.path);

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
                    <span className="text-[12px] font-medium">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hiring Summary */}
          {!isCollapsed && (
            <div className="px-6 mt-8">
              <h3 className="text-[12px] font-semibold text-[#B0B7C3] mb-3">
                Hiring Summary
              </h3>

              <div className="space-y-3">
                {hiringSummary.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span
                      className={`w-[10px] h-[10px] rounded-full ${item.color}`}
                    ></span>
                    <p className="text-[12px] font-medium text-[#6B7280]">
                      {item.value} {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="px-2 pb-3 mt-auto">
          <Link
            to="/company/profile"
            className={`flex items-center rounded-[8px] px-2 py-2 transition hover:bg-[#F8FAFC] ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-[28px] h-[28px] rounded-full bg-[#D9D9D9] shrink-0 flex items-center justify-center text-[10px] font-semibold text-[#6B7280]">
                {companyData.initials}
              </div>

              {!isCollapsed && (
                <div className="min-w-0">
                  <h4 className="text-[11px] font-semibold text-[#4B5563] leading-none truncate">
                    {companyData.name}
                  </h4>
                  <p className="text-[10px] text-[#9CA3AF] mt-1 truncate">
                    {companyData.type}
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

export default CompanySidebar;