import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  PlusIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { key: "team", label: "Team", icon: UserGroupIcon },
  { key: "tasks", label: "Tasks", icon: ClipboardDocumentListIcon },
  { key: "progress", label: "Progress", icon: ChartBarIcon },
  { key: "reports", label: "Reports", icon: DocumentTextIcon },
];

function TeamDashboard() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();

  // Support both /team-leader/dashboard/:projectId and /team-leader/dashboard?projectId=xxx
  const projectId = params.projectId || searchParams.get("projectId");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [actions, setActions] = useState({ canAddTask: false });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddEvaluationOpen, setIsAddEvaluationOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToReplace, setMemberToReplace] = useState(null);
  const [memberProfile, setMemberProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topRef = useRef(null);
  const tasksRef = useRef(null);
  const teamRef = useRef(null);
  const progressRef = useRef(null);
  const reportsRef = useRef(null);

  const currentUser = teamMembers[0] || { name: "", email: "" };

  // Get auth token
  const getToken = () => {
    return (
      localStorage.getItem("teamup_access_token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token")
    );
  };

  // Fetch dashboard data
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = getToken();
        const response = await fetch(`${BASE_URL}/project/${projectId}/leader-dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          if (response.status === 403) {
            throw new Error("You don't have permission to view this project.");
          }
          if (response.status === 404) {
            throw new Error("Project not found.");
          }
          throw new Error(`Failed to load dashboard: ${response.statusText}`);
        }

        const data = await response.json();

        setDashboardData(data);
        setTasks(data.currentTasks || []);
        setTeamMembers(data.teamMembers || []);
        setEvaluations(data.recentEvaluations || []);
        setActivity(data.recentActivity || []);
        setActions(data.actions || { canAddTask: false });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [projectId]);

  const scrollToSection = (tabKey) => {
    setActiveTab(tabKey);

    const sectionMap = {
      dashboard: topRef,
      team: teamRef,
      tasks: tasksRef,
      progress: progressRef,
      reports: reportsRef,
    };

    sectionMap[tabKey]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Add new task
  const handleAddTask = async (newTask) => {
    setIsSubmitting(true);
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/project/${projectId}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      const createdTask = await response.json();
      setTasks((prev) => [createdTask, ...prev]);
      setIsAddTaskOpen(false);
    } catch (err) {
      console.error("Add task error:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.message);
    }
  };

  // Reassign task
  const handleReassignTask = async (taskId, assignedTo, assignedToName) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/tasks/${taskId}/reassign`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assignedTo, assignedToName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reassign task");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, assignedTo, assignedToName } : task
        )
      );
    } catch (err) {
      console.error("Reassign error:", err);
      alert(err.message);
    }
  };

  // View member profile
  const handleViewProfile = async (member) => {
    setSelectedMember(member);
    setIsProfileLoading(true);
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/team-members/${member.id}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const profile = await response.json();
      setMemberProfile(profile);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setMemberProfile({ error: err.message });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Load evaluations
  const loadEvaluations = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/evaluations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load evaluations");
      }

      const data = await response.json();
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error("Evaluations fetch error:", err);
    }
  };

  // Add evaluation
  const handleAddEvaluation = async (evaluation) => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/evaluations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(evaluation),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add evaluation");
      }

      const created = await response.json();
      setEvaluations((prev) => [created, ...prev]);
    } catch (err) {
      console.error("Add evaluation error:", err);
      alert(err.message);
    }
  };

  // Load activities
  const loadActivities = async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/project/${projectId}/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load activities");
      }

      const data = await response.json();
      setActivity(data.activities || []);
    } catch (err) {
      console.error("Activities fetch error:", err);
    }
  };

  const handleRateEvaluation = (evaluationId, value) => {
    setEvaluations((prev) =>
      prev.map((item) =>
        item.id === evaluationId ? { ...item, rating: value } : item
      )
    );
  };

  const handleConfirmReplace = (oldMemberId, newMember) => {
    setTeamMembers((prev) =>
      prev.map((member) => (member.id === oldMemberId ? newMember : member))
    );
  };

  const availableReplaceOptions = useMemo(() => {
    // TODO: Filter from API-provided replacement candidates when available
    return [];
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#eef8f7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#6b7280]">
          <div className="h-6 w-6 border-2 border-[#0e6b67] border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#eef8f7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[14px] p-6 text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1f2937] mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-[#6b7280] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="ml-2 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-[10px] hover:bg-[#f9fafb] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no projectId
  if (!projectId) {
    return (
      <div className="min-h-screen bg-[#eef8f7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[14px] p-6 text-center">
          <Squares2X2Icon className="h-12 w-12 text-[#9ca3af] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1f2937] mb-2">
            No Project Selected
          </h2>
          <p className="text-[#6b7280] mb-4">
            Please select a project from your dashboard to view team leader tools.
          </p>
          <button
            onClick={() => navigate("/developer/dashboard")}
            className="px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef8f7] font-sans text-[#1f2937]">
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between border-r border-[#dde7e7] bg-white px-[14px] py-[18px] transition-all duration-300 ${
          isSidebarOpen ? "w-[220px]" : "w-[84px]"
        }`}
      >
        <div>
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Toggle Sidebar"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[7px] bg-transparent text-[#4b5563] transition hover:bg-[#eaf7f4]"
            >
              {isSidebarOpen ? (
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex flex-col gap-[10px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  onClick={() => scrollToSection(item.key)}
                  className={`flex w-full items-center rounded-[7px] px-3 py-3 text-left text-[14px] transition ${
                    isSidebarOpen ? "gap-3" : "justify-center"
                  } ${
                    isActive
                      ? "bg-[#cfeee9] text-[#0e6b67]"
                      : "bg-transparent text-[#5b6573] hover:bg-[#eaf7f4]"
                  }`}
                >
                  <Icon className="h-[21px] w-[21px] shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div
          className={`mt-auto flex items-center gap-[10px] ${
            isSidebarOpen ? "justify-between" : "justify-center"
          }`}
        >
          <div className="flex items-center gap-[10px]">
            <div className="h-[34px] w-[34px] shrink-0 rounded-full bg-[#dedede]" />

            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="m-0 truncate text-[12px] text-[#4b5563]">
                  {currentUser.name}
                </p>
                <p className="m-0 mt-[2px] truncate text-[11px] text-[#9ca3af]">
                  {currentUser.email}
                </p>
              </div>
            )}
          </div>

          {isSidebarOpen && (
            <span className="text-[16px] text-[#6b7280]">→</span>
          )}
        </div>
      </aside>

      <main
        ref={topRef}
        className={`min-h-screen px-5 pb-[22px] pt-[88px] transition-all duration-300 ${
          isSidebarOpen ? "ml-[220px]" : "ml-[84px]"
        }`}
      >
        <div className="mb-4">
          <div className="mb-[10px] flex items-center gap-[10px]">
            <button
              type="button"
              aria-label="Back"
              onClick={() => navigate("/developer/dashboard")}
              className="h-6 w-6 border-0 bg-transparent p-0 cursor-pointer hover:text-[#0B6B63]"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[#4b5563]" />
            </button>

            <h1 className="m-0 text-[17px] font-bold text-[#1f2937]">
              {dashboardData?.header?.projectName || "Project Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-7 pl-9">
            <span className="flex items-center gap-[6px] text-[14px] text-[#27a247]">
              <span className="h-[10px] w-[10px] rounded-full bg-[#27c04c]" />
              {dashboardData?.header?.projectStatus || "Active"}
            </span>

            <span className="text-[14px] text-[#6b7280]">
              {dashboardData?.summary?.companyName || ""}
            </span>
          </div>
        </div>

        <section
          ref={tasksRef}
          className="mb-4 w-full rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
              Current Tasks ({tasks.length})
            </h2>

            {actions.canAddTask && (
              <button
                type="button"
                aria-label="Add Task"
                onClick={() => setIsAddTaskOpen(true)}
                className="border-0 bg-transparent p-0 cursor-pointer"
              >
                <PlusIcon className="h-[18px] w-[18px] text-[#0e6b67]" />
              </button>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280]">
              No tasks yet. Click the + button to add your first task.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleUpdateTaskStatus}
                  onReassign={(newAssigneeId, newAssigneeName) =>
                    handleReassignTask(task.id, newAssigneeId, newAssigneeName)
                  }
                  teamMembers={teamMembers}
                />
              ))}
            </div>
          )}
        </section>

        <section
          ref={teamRef}
          className="mb-4 w-full rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
        >
          <div className="mb-3">
            <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
              Team Member
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
            {teamMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onViewProfile={() => handleViewProfile(member)}
                onReplaceMember={() => setMemberToReplace(member)}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div
            ref={progressRef}
            className="min-h-[160px] rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
                Recent Evaluations ({evaluations.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddEvaluationOpen(true)}
                  className="text-[12px] text-[#0e6b67] hover:underline"
                >
                  + Add
                </button>
                <button
                  onClick={loadEvaluations}
                  className="text-[12px] text-[#0e6b67] hover:underline"
                >
                  Refresh
                </button>
              </div>
            </div>

            {evaluations.length === 0 ? (
              <div className="text-center py-4 text-[#6b7280] text-sm">
                No evaluations yet. Click + Add to create one.
              </div>
            ) : (
              evaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onRate={handleRateEvaluation}
                />
              ))
            )}
          </div>
                    <div
            ref={reportsRef}
            className="min-h-[160px] rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
                Recent Activity ({activity.length})
              </h2>
              <button
                onClick={loadActivities}
                className="text-[12px] text-[#0e6b67] hover:underline"
              >
                Refresh
              </button>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-4 text-[#6b7280] text-sm">
                No recent activity.
              </div>
            ) : (
              activity.map((item) => (
                <ActivityCard key={item.id} activity={item} />
              ))
            )}
          </div>
        </section>
      </main>

      {isAddTaskOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskOpen(false)}
          onAddTask={handleAddTask}
          teamMembers={teamMembers}
          isSubmitting={isSubmitting}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          profile={memberProfile}
          isLoading={isProfileLoading}
          onClose={() => {
            setSelectedMember(null);
            setMemberProfile(null);
          }}
        />
      )}

      {memberToReplace && (
        <ReplaceMemberModal
          memberToReplace={memberToReplace}
          replaceOptions={availableReplaceOptions}
          onConfirmReplace={handleConfirmReplace}
          onClose={() => setMemberToReplace(null)}
        />
      )}

      {isAddEvaluationOpen && (
        <AddEvaluationModal
          onClose={() => setIsAddEvaluationOpen(false)}
          onAdd={handleAddEvaluation}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onReassign, teamMembers }) {
  const [showReassign, setShowReassign] = useState(false);

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-[#fde8e8] text-[#ef4444]";
      case "medium":
        return "bg-[#fff2de] text-[#f59e0b]";
      default:
        return "bg-[#e0f2fe] text-[#0284c7]";
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "done":
        return "bg-[#d1fae5] text-[#059669]";
      case "in-progress":
        return "bg-[#dbeafe] text-[#2563eb]";
      default:
        return "bg-[#f3f4f6] text-[#6b7280]";
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-[158px] rounded-[7px] border border-[#e2e8ea] bg-white px-[14px] py-[18px]">
      <div className="mb-[18px] flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex min-h-7 items-center justify-center rounded-[7px] px-[10px] text-[13px] font-medium ${getPriorityStyle(task.priority)}`}
        >
          {task.priority || "Normal"}
        </span>

        <select
          value={task.status || "todo"}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          className={`inline-flex min-h-7 items-center justify-center rounded-[7px] px-[10px] text-[13px] font-medium border-0 cursor-pointer outline-none ${getStatusStyle(task.status)}`}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <h3 className="mb-3 text-[15px] font-bold">{task.title}</h3>

      <p className="mb-5 text-[13px] text-[#6b7280]">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 relative">
          <div className="h-7 w-7 rounded-full bg-[#d9d9d9]" />
          <span className="text-[13px]">{task.assignedToName || "Unassigned"}</span>

          {showReassign && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-[#e2e8ea] rounded-[7px] shadow-lg z-10 min-w-[150px]">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onReassign(member.id, member.name);
                    setShowReassign(false);
                  }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f3f4f6] first:rounded-t-[7px] last:rounded-b-[7px]"
                >
                  {member.name}
                </button>
              ))}
              <button
                onClick={() => setShowReassign(false)}
                className="w-full text-center px-3 py-1 text-[12px] text-[#6b7280] hover:bg-[#f3f4f6] border-t border-[#e2e8ea]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <button
            onClick={() => setShowReassign(!showReassign)}
            className="p-1 hover:bg-[#f3f4f6] rounded"
            title="Reassign task"
          >
            <ArrowsRightLeftIcon className="h-4 w-4 text-[#6b7280]" />
          </button>
          <CalendarDaysIcon className="h-4 w-4 text-[#6b7280]" />
          <span>{formatDeadline(task.deadline)}</span>
        </div>
      </div>
    </div>
  );
}

function TeamMemberCard({ member, onViewProfile, onReplaceMember }) {
  return (
    <div className="flex items-center justify-between rounded-[7px] border border-[#e2e8ea] bg-white p-[14px]">
      <div
        onClick={onViewProfile}
        className="flex cursor-pointer items-center gap-3"
      >
        <div className="h-10 w-10 rounded-full bg-[#d9d9d9] flex items-center justify-center text-[#6b7280] font-medium">
          {member.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div>
          <h4 className="text-[15px] font-medium">{member.name}</h4>

          <div className="flex gap-2 text-[12px] text-[#9ca3af]">
            <span>{member.role || "Developer"}</span>
            <span>{member.level || "Mid"}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onViewProfile} className="p-1 hover:bg-[#f3f4f6] rounded">
          <EyeIcon className="h-5 w-5 text-[#6b7280]" />
        </button>

        <button onClick={onReplaceMember} className="p-1 hover:bg-[#f3f4f6] rounded">
          <ArrowsRightLeftIcon className="h-5 w-5 text-[#6b7280]" />
        </button>
      </div>
    </div>
  );
}

function EvaluationCard({ evaluation, onRate }) {
  return (
    <div className="rounded-[7px] border border-[#e2e8ea] bg-white p-[14px]">
      <div className="mb-3 flex items-center justify-between">
        <h4>{evaluation.name}</h4>

        <div>
          {Array.from({ length: 5 }).map((_, index) => {
            const value = index + 1;

            return (
              <button
                key={value}
                onClick={() => onRate(evaluation.id, value)}
              >
                <span
                  className={
                    value <= evaluation.rating
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  ★
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[13px] text-[#6b7280]">
        {evaluation.comment}
      </p>
    </div>
  );
}

function ActivityCard({ activity }) {
  return (
    <div className="rounded-[7px] border border-[#e2e8ea] bg-white p-[14px]">
      <div className="flex gap-3">
        <CheckCircleIcon className="h-5 w-5 text-[#0e9488]" />

        <div>
          <div className="mb-1 flex gap-3">
            <h4>{activity.title}</h4>
            <span className="text-[12px] text-[#9ca3af]">
              {activity.time}
            </span>
          </div>

          <p className="text-[13px] text-[#6b7280]">
            {activity.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ onClose, onAddTask, teamMembers, isSubmitting }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
    assignedToName: "",
    deadline: "",
    status: "todo",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTask(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[14px] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f2937]">Add New Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded">
            <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
              rows={3}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Assign To</label>
            <select
              required
              value={formData.assignedTo}
              onChange={(e) => {
                const member = teamMembers.find((m) => m.id === e.target.value);
                setFormData({
                  ...formData,
                  assignedTo: e.target.value,
                  assignedToName: member?.name || "",
                });
              }}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-[10px] hover:bg-[#f9fafb] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberProfileModal({ member, profile, isLoading, onClose }) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-[14px] bg-white p-6 text-center">
          <div className="h-8 w-8 border-2 border-[#0e6b67] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6b7280]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profile?.error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-[14px] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1f2937]">Error</h2>
            <button onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded">
              <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
            </button>
          </div>
          <p className="text-red-500">{profile.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-[14px] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Team Member Profile</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded">
            <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="h-20 w-20 rounded-full bg-[#d9d9d9] mx-auto mb-3 flex items-center justify-center text-[#6b7280] text-2xl font-bold">
            {member.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h3 className="text-lg font-semibold">{member.name}</h3>
          <p className="text-[#6b7280]">{profile?.role || member.role || "Developer"}</p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280]">Level</span>
            <span className="font-medium">{profile?.level || member.level || "Mid"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280]">Email</span>
            <span className="font-medium">{profile?.email || member.email || "N/A"}</span>
          </div>
          {profile?.skills && (
            <div className="py-2">
              <span className="text-[#6b7280]">Skills</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-2 py-1 bg-[#eef8f7] text-[#0e6b67] rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ReplaceMemberModal({ memberToReplace, replaceOptions, onConfirmReplace, onClose }) {
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  const handleConfirm = () => {
    if (selectedReplacement) {
      onConfirmReplace(memberToReplace.id, selectedReplacement);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[14px] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f2937]">Replace Team Member</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded">
            <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
          </button>
        </div>

        <p className="text-[#6b7280] mb-4">
          Replace <strong>{memberToReplace.name}</strong> with:
        </p>

        {replaceOptions.length === 0 ? (
          <div className="text-center py-4 text-[#6b7280]">
            No replacement options available. Please contact admin.
          </div>
        ) : (
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {replaceOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedReplacement(option)}
                className={`w-full flex items-center gap-3 p-3 rounded-[7px] border transition ${
                  selectedReplacement?.id === option.id
                    ? "border-[#0e6b67] bg-[#eef8f7]"
                    : "border-[#e2e8ea] hover:bg-[#f9fafb]"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-[#d9d9d9] flex items-center justify-center text-[#6b7280] font-medium">
                  {option.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-medium">{option.name}</p>
                  <p className="text-sm text-[#6b7280]">{option.role || "Developer"}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-[10px] hover:bg-[#f9fafb] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReplacement}
            className="flex-1 px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition disabled:opacity-50"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEvaluationModal({ onClose, onAdd, teamMembers }) {
  const [formData, setFormData] = useState({
    memberUser: "",
    memberName: "",
    rating: 5,
    comment: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[14px] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1f2937]">Add Evaluation</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f3f4f6] rounded">
            <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Team Member</label>
            <select
              required
              value={formData.memberUser}
              onChange={(e) => {
                const member = teamMembers.find((m) => m.id === e.target.value);
                setFormData({
                  ...formData,
                  memberUser: e.target.value,
                  memberName: member?.name || "",
                });
              }}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
            >
              <option value="">Select team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Rating</label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Comment</label>
            <textarea
              required
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-sm focus:border-[#0e6b67] focus:outline-none"
              rows={3}
              placeholder="Enter your feedback..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#e5e7eb] text-[#6b7280] rounded-[10px] hover:bg-[#f9fafb] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0e6b67] text-white rounded-[10px] hover:bg-[#0d9488] transition"
            >
              Add Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamDashboard;