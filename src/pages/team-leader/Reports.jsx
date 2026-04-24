import { useState } from "react";
import Header from "../../components/common/Header";
import Sidebar from "../../components/team-leader/Sidebar";
import ActivityCard from "../../components/team-leader/ActivityCard";
import { dashboardData } from "../../data/dashboardData";

function Reports() {
  const [activeTab, setActiveTab] = useState("reports");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const currentUser = dashboardData.teamMembers[0];

  const tasks = dashboardData.tasks;
  const teamMembers = dashboardData.teamMembers;
  const recentActivity = dashboardData.recentActivity;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.statusType === "completed" || t.status === "Completed"
  ).length;

  return (
    <div className="team-dashboard-page">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={currentUser}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="team-dashboard-main">
        <Header />

        <main className="dashboard-content">
          {/* Summary */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Reports Summary</h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Total Tasks</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginTop: "4px" }}>
                  {totalTasks}
                </p>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Completed Tasks</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#22C55E", marginTop: "4px" }}>
                  {completedTasks}
                </p>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Team Members</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#4F7CFF", marginTop: "4px" }}>
                  {teamMembers.length}
                </p>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Completion Rate</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#0B6F6C", marginTop: "4px" }}>
                  {totalTasks === 0 ? "0%" : `${Math.round((completedTasks / totalTasks) * 100)}%`}
                </p>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>

            {recentActivity.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}

            {recentActivity.length === 0 && (
              <p style={{ color: "#9CA3AF", textAlign: "center", padding: "32px 0" }}>
                No recent activity.
              </p>
            )}
          </section>

          {/* Member Task Distribution */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Task Distribution by Member</h2>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #E5E7EB",
              }}
            >
              {teamMembers.map((member) => {
                const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
                const memberCompleted = memberTasks.filter(
                  (t) => t.statusType === "completed" || t.status === "Completed"
                ).length;
                const memberPercent =
                  memberTasks.length === 0
                    ? 0
                    : Math.round((memberCompleted / memberTasks.length) * 100);

                return (
                  <div key={member.id} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                        {member.name}
                      </span>
                      <span style={{ fontSize: "13px", color: "#6B7280" }}>
                        {memberCompleted}/{memberTasks.length} tasks · {memberPercent}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", borderRadius: "9999px", background: "#E5E7EB", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${memberPercent}%`,
                          height: "100%",
                          background: "#0B6F6C",
                          borderRadius: "9999px",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Reports;
