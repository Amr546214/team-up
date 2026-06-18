import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  UserCircle,
  PlusCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { getUserProfile } from "../../utils/authStorage";

function ClientSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState(() => getUserProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getUserProfile());
    };

    window.addEventListener("teamup-auth-changed", handleProfileUpdate);

    return () => {
      window.removeEventListener("teamup-auth-changed", handleProfileUpdate);
    };
  }, []);

  const clientName = profile?.name || "Client Account";
  const clientAvatar = profile?.avatarUrl || "";
  const clientType = "Business Owner";

  const initials =
    clientName
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CA";

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      path: "/client/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: 2,
      name: "Client Profile",
      path: "/client/profile",
      icon: UserCircle,
    },
    {
      id: 3,
      name: "Post New Job",
      path: "/client/job-post",
      icon: PlusCircle,
    },
    {
      id: 4,
      name: "My Jobs",
      path: "/client/my-jobs",
      icon: Briefcase,
    },
    {
      id: 5,
      name: "Build Team",
      path: "/client/build-team",
      icon: Users,
    },
  ];

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-all duration-300 z-[40] ${
        isCollapsed ? "w-[80px]" : "w-[240px]"
      }`}
    >
      <div className="relative h-full flex flex-col">
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

        <div className="pt-6">
          <div className="px-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full h-[44px] rounded-[10px] flex items-center ${
                      isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                    } text-left transition ${
                      isActive
                        ? "bg-[#E6FFFA] text-[#0B6F6C] font-semibold"
                        : "text-[#6B7280] hover:bg-[#F9FAFB]"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="shrink-0"
                      />

                      {!isCollapsed && (
                        <span className="text-[14px]">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        <div className="px-3 pb-6 mt-auto">
          <Link
            to="/client/profile"
            className={`flex items-center rounded-[12px] p-2 transition hover:bg-[#F9FAFB] border border-transparent hover:border-[#F3F4F6] ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="w-[36px] h-[36px] rounded-full bg-[#0B6F6C] shrink-0 overflow-hidden flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
              {clientAvatar ? (
                <img
                  src={clientAvatar}
                  alt={clientName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h4 className="text-[13px] font-semibold text-[#374151] leading-none truncate">
                  {clientName}
                </h4>
                <p className="text-[11px] text-[#9CA3AF] mt-1 truncate">
                  {clientType}
                </p>
              </div>
            )}

            {!isCollapsed && (
              <ArrowRight size={14} className="text-[#D1D5DB]" />
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default ClientSidebar;