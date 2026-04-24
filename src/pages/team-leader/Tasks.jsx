import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Header from "../../components/common/Header";
import Sidebar from "../../components/team-leader/Sidebar";
import TaskCard from "../../components/team-leader/TaskCard";
import AddTaskModal from "../../components/team-leader/AddTaskModal";
import { dashboardData } from "../../data/dashboardData";

function Tasks() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState(dashboardData.tasks);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  const currentUser = dashboardData.teamMembers[0];

  const handleAddTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const statusFilters = ["All", "In Progress", "To Do", "Completed"];

  const filteredTasks =
    filterStatus === "All"
      ? tasks
      : tasks.filter((t) => t.status === filterStatus);

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
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Tasks</h2>
              <button
                type="button"
                className="section-plus-btn"
                aria-label="Add Task"
                onClick={() => setIsAddTaskOpen(true)}
              >
                <PlusIcon className="section-plus-icon" />
              </button>
            </div>

            {/* Filter */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {statusFilters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    background: filterStatus === status ? "#0B6F6C" : "#fff",
                    color: filterStatus === status ? "#fff" : "#6B7280",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="tasks-grid">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}

              {filteredTasks.length === 0 && (
                <p style={{ color: "#9CA3AF", textAlign: "center", padding: "32px 0" }}>
                  No tasks matching this filter.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        teamMembers={dashboardData.teamMembers}
      />
    </div>
  );
}

export default Tasks;
