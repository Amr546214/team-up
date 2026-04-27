import {
  Squares2X2Icon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

function Sidebar({ activeTab, onTabChange, user, isOpen, onToggle }) {
  const { t } = useTranslation();

  const navItems = [
    { key: "dashboard", label: t("navigation.dashboard"), icon: Squares2X2Icon },
    { key: "team", label: t("navigation.team"), icon: UserGroupIcon },
    { key: "tasks", label: t("navigation.tasks"), icon: ClipboardDocumentListIcon },
    { key: "progress", label: t("navigation.progress"), icon: ChartBarIcon },
    { key: "reports", label: t("navigation.reports"), icon: DocumentTextIcon },
  ];

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-top">
        <div className="sidebar-top-row">
          <div className="sidebar-brand"></div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggle}
            aria-label="Toggle Sidebar"
          >
            {isOpen ? (
              <ChevronDoubleLeftIcon className="sidebar-toggle-icon" />
            ) : (
              <Bars3Icon className="sidebar-toggle-icon" />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                className={`sidebar-nav-item ${
                  activeTab === item.key ? "active" : ""
                }`}
                onClick={() => onTabChange(item.key)}
                title={item.label}
              >
                <Icon className="sidebar-nav-icon" />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-left">
          <div
            className="sidebar-user-avatar"
            title={user?.name || "Hanan Muhammed"}
            aria-label={user?.name || "Hanan Muhammed"}
          ></div>

          {isOpen && (
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">
                {user?.name || "Hanan Muhammed"}
              </p>
              <p className="sidebar-user-email">
                {user?.email || "hanan@example.com"}
              </p>
            </div>
          )}
        </div>

        {isOpen && <span className="sidebar-user-arrow">→</span>}
      </div>
    </aside>
  );
}

export default Sidebar;