import { useState } from "react";
import Header from "../../components/common/Header";
import Sidebar from "../../components/team-leader/Sidebar";
import EvaluationCard from "../../components/team-leader/EvaluationCard";
import { dashboardData } from "../../data/dashboardData";

function Progress() {
  const [activeTab, setActiveTab] = useState("progress");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [evaluations, setEvaluations] = useState(dashboardData.evaluations);

  const currentUser = dashboardData.teamMembers[0];
  const tasks = dashboardData.tasks;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.statusType === "completed" || t.status === "Completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (t) => t.statusType === "progress" || t.status === "In Progress"
  ).length;
  const todoTasks = tasks.filter(
    (t) => t.statusType === "todo" || t.status === "To Do"
  ).length;

  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleRateEvaluation = (evaluationId, value) => {
    setEvaluations((prev) =>
      prev.map((item) =>
        item.id === evaluationId ? { ...item, rating: value } : item
      )
    );
  };

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
          {/* Overall Progress */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Project Progress</h2>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: "14px",
                padding: "24px",
                border: "1px solid #E5E7EB",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "15px", color: "#111827", fontWeight: 600 }}>
                  Overall Progress
                </span>
                <span style={{ fontSize: "15px", color: "#6B7280", fontWeight: 500 }}>
                  {progressPercent}%
                </span>
              </div>

              <div style={{ width: "100%", height: "12px", borderRadius: "9999px", background: "#E5E7EB", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "#0B6F6C",
                    borderRadius: "9999px",
                    transition: "width 0.3s",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "24px" }}>
                <div style={{ background: "#F0FBFA", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: "#0B6F6C" }}>{completedTasks}</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>Completed</p>
                </div>
                <div style={{ background: "#FEF3C7", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: "#D97706" }}>{inProgressTasks}</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>In Progress</p>
                </div>
                <div style={{ background: "#F3F4F6", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: 700, color: "#6B7280" }}>{todoTasks}</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>To Do</p>
                </div>
              </div>
            </div>
          </section>

          {/* Team Evaluations */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Team Evaluations</h2>
            </div>

            {evaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                onRate={handleRateEvaluation}
              />
            ))}

            {evaluations.length === 0 && (
              <p style={{ color: "#9CA3AF", textAlign: "center", padding: "32px 0" }}>
                No evaluations yet.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Progress;
