import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CodeXml,
  Plus,
  CircleCheckBig,
  ChevronDown,
  Github,
  FileText,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function JobDetails() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [projectData] = useState({
    id: 1,
    title: "E-commerce API Integration",
    status: "active",
    deadline: "Oct 24, 2026",
    description:
      "Develop and integrate a robust, scalable backend API for the new e-commerce platform. Focus on secure authentication, optimized database queries, and comprehensive documentation for frontend consumption.",
    role: "Senior Backend Engineer",
    timeline: {
      startDate: "Sep 01, 2026",
      endDate: "Oct 24, 2026",
    },
    skills: ["Node.js", "GraphQL", "AWS"],
  });

  const [tasksData, setTasksData] = useState([
    {
      id: 1,
      title: "Implement OAuth2.0",
      status: "inProgress",
      assignedTo: "Sara",
    },
    {
      id: 2,
      title: "Database Schema Design",
      status: "done",
      assignedTo: "hanan",
    },
    {
      id: 3,
      title: "API Documentation",
      status: "todo",
      assignedTo: "eman",
    },
  ]);

  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    assignedTo: "",
    status: "todo",
  });
  const [teamData] = useState([
    {
      id: 1,
      name: "Hanan Muhammed",
      role: "Lead Backend",
      avatar: "",
      profileLink: "/developer/profile",
    },
    {
      id: 2,
      name: "Sara Muhammed",
      role: "Database Eng",
      avatar: "",
      profileLink: "/developer/profile",
    },
  ]);

  const [resourcesData] = useState({
    github: "https://github.com",
    drive: "https://drive.google.com",
    docs: "https://docs.google.com",
  });

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  /* =========================
     UI / Design Logic only
  ========================== */
  const getProjectStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          badgeClass: "bg-[#EAF8EE] text-[#22C55E]",
          dotClass: "bg-[#22C55E]",
          label: "Active",
        };
      case "planned":
        return {
          badgeClass: "bg-[#FEF3C7] text-[#D97706]",
          dotClass: "bg-[#D97706]",
          label: "Planned",
        };
      case "completed":
        return {
          badgeClass: "bg-[#EEF2FF] text-[#4F46E5]",
          dotClass: "bg-[#4F46E5]",
          label: "Completed",
        };
      default:
        return {
          badgeClass: "bg-[#F3F4F6] text-[#6B7280]",
          dotClass: "bg-[#9CA3AF]",
          label: status,
        };
    }
  };

  const getTaskStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "inprogress":
        return {
          label: "In Progress",
          textClass: "text-[#9CA3AF]",
          dotClass: "bg-[#22C55E]",
          checked: false,
          rowClass: "bg-white",
          icon: null,
        };

      case "done":
        return {
          label: "Done",
          textClass: "text-[#9CA3AF]",
          dotClass: "bg-[#14B8A6]",
          checked: true,
          rowClass: "bg-[#F3F4F6]",
          icon: CircleCheckBig,
          iconClass: "text-[#14B8A6]",
        };

      case "todo":
        return {
          label: "To do",
          textClass: "text-[#9CA3AF]",
          dotClass: "bg-[#9CA3AF]",
          checked: false,
          rowClass: "bg-white",
          icon: null,
        };

      default:
        return {
          label: status,
          textClass: "text-[#9CA3AF]",
          dotClass: "bg-[#9CA3AF]",
          checked: false,
          rowClass: "bg-white",
          icon: null,
        };
    }
  };

  const statusStyles = getProjectStatusStyles(projectData.status);

  /* =========================
     Interactions
  ========================== */
  const handleBack = () => {
    navigate(-1);
  };

  const handleCheckboxToggle = (taskId) => {
    setTasksData((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "done" ? "todo" : "done",
            }
          : task
      )
    );
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasksData((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    setOpenStatusMenuId(null);
  };

  const handleAddTask = (e) => {
    e.preventDefault();

    if (!newTask.title.trim() || !newTask.assignedTo.trim()) return;

    const taskToAdd = {
      id: Date.now(),
      title: newTask.title,
      assignedTo: newTask.assignedTo,
      status: newTask.status,
    };

    setTasksData((prev) => [...prev, taskToAdd]);
    setNewTask({
      title: "",
      assignedTo: "",
      status: "todo",
    });
    setShowAddTaskForm(false);
  };

  const handleDeleteTask = (taskId) => {
    setTasksData((prev) => prev.filter((task) => task.id !== taskId));
  };
  const totalTasks = tasksData.length;
  const doneTasks = tasksData.filter((task) => task.status === "done").length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const getCurrentStage = () => {
    if (doneTasks === totalTasks && totalTasks > 0) return "Completed";
    if (doneTasks > 0) return "Testing phase";
    return "Planning phase";
  };

  const handleOpenProfile = (profileLink) => {
    navigate(profileLink);
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: aiInput,
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setAiLoading(true);

    setTimeout(() => {
      const aiReply = {
        id: Date.now() + 1,
        sender: "ai",
        text: `AI response to: "${aiInput}"`,
      };

      setAiMessages((prev) => [...prev, aiReply]);
      setAiLoading(false);
    }, 800);

    setAiInput("");
  };
  return (
    <div className="min-h-screen bg-[#F5F9F9] px-4 py-8 md:px-8 md:py-10">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <section>
          <div className="flex items-start gap-4">
            <button
              onClick={handleBack}
              className="w-[56px] h-[56px] rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
            >
              <ArrowLeft size={28} className="text-[#111827]" />
            </button>

            <div className="flex-1">
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                {projectData.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-6">
                <div
                  className={`h-[44px] px-5 rounded-full inline-flex items-center gap-3 ${statusStyles.badgeClass}`}
                >
                  <span
                    className={`w-[12px] h-[12px] rounded-full ${statusStyles.dotClass}`}
                  ></span>
                  <span className="text-[16px] font-medium">
                    {statusStyles.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[#6B7280]">
                  <CalendarDays size={24} />
                  <span className="text-[16px] md:text-[18px] font-medium">
                    Deadline: {projectData.deadline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.25fr_0.95fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Project Overview */}
            <section className="bg-white rounded-[18px] p-6 md:p-8">
              <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
                Project Overview
              </h2>

              <p className="mt-6 text-[16px] md:text-[18px] leading-9 text-[#6B7280]">
                {projectData.description}
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[16px] text-[#9CA3AF] mb-4">Role</p>
                  <div className="flex items-center gap-3">
                    <CodeXml size={28} className="text-[#14B8A6]" />
                    <span className="text-[18px] font-medium text-[#111827]">
                      {projectData.role}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[16px] text-[#9CA3AF] mb-4">Timeline</p>
                  <p className="text-[18px] font-medium text-[#111827]">
                    {projectData.timeline.startDate} ---To ---
                    {projectData.timeline.endDate}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[16px] text-[#9CA3AF] mb-5">
                  Required Skills
                </p>

                <div className="flex flex-wrap gap-4">
                  {projectData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-6 py-3 rounded-[12px] bg-[#F3F4F6] text-[#4B5563] text-[16px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Tasks */}
            <section className="bg-white rounded-[18px] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
                  Tasks
                </h2>

                <button
                  onClick={() => setShowAddTaskForm((prev) => !prev)}
                  className="text-[#0B8B84] hover:text-[#08756f] transition"
                >
                  <Plus size={30} />
                </button>
              </div>

              {/* Add Task Form */}
              {showAddTaskForm && (
                <form
                  onSubmit={handleAddTask}
                  className="mb-6 rounded-[14px] border border-[#E5E7EB] p-4 bg-[#F8FAFC] space-y-4"
                >
                  <div>
                    <label className="block text-[14px] text-[#6B7280] mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#6B7280] mb-2">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={newTask.assignedTo}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          assignedTo: e.target.value,
                        }))
                      }
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                      placeholder="Enter assignee name"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#6B7280] mb-2">
                      Status
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option value="todo">To do</option>
                      <option value="inProgress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="h-[42px] px-5 rounded-[10px] bg-[#0B8B84] text-white font-medium hover:bg-[#08756f] transition"
                    >
                      Add Task
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddTaskForm(false)}
                      className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-5">
                {tasksData.map((task) => {
                  const taskStyles = getTaskStatusStyles(task.status);
                  const StatusIcon = taskStyles.icon;

                  return (
                    <div
                      key={task.id}
                      className={`rounded-[16px] p-5 border border-[#E5E7EB] ${taskStyles.rowClass}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleCheckboxToggle(task.id)}
                            className="pt-1"
                          >
                            <div className="w-[22px] h-[22px] rounded-[2px] border border-[#BFC5D2] flex items-center justify-center bg-white">
                              {taskStyles.checked && (
                                <span className="text-[#14B8A6] text-[14px]">
                                  ✓
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-[18px] font-medium text-[#111827] break-words">
                              {task.title}
                            </h3>

                            <div className="mt-4 flex flex-wrap items-center gap-8">
                              <div className="flex items-center gap-3">
                                {StatusIcon ? (
                                  <StatusIcon
                                    size={18}
                                    className={taskStyles.iconClass}
                                  />
                                ) : (
                                  <span
                                    className={`w-[12px] h-[12px] rounded-full ${taskStyles.dotClass}`}
                                  ></span>
                                )}

                                <span
                                  className={`text-[16px] ${taskStyles.textClass}`}
                                >
                                  {taskStyles.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="w-[12px] h-[12px] rounded-full bg-[#9CA3AF]"></span>
                                <span className="text-[16px] text-[#9CA3AF]">
                                  Assigned to {task.assignedTo}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Delete Task */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-[42px] h-[42px] rounded-[10px] border border-[#E5E7EB] text-[#EF4444] flex items-center justify-center hover:bg-[#FEE2E2] transition"
                          >
                            ✕
                          </button>

                          {/* Update Status */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenStatusMenuId((prev) =>
                                  prev === task.id ? null : task.id
                                )
                              }
                              className={`h-[50px] px-5 rounded-[12px] text-[16px] font-medium border transition inline-flex items-center gap-2 ${
                                taskStyles.checked
                                  ? "border-[#D1D5DB] text-[#B0B7C3] bg-transparent"
                                  : "border-[#64C7C2] text-[#0B8B84] hover:bg-[#F0FBFA]"
                              }`}
                            >
                              Update Status
                              <ChevronDown size={16} />
                            </button>

                            {openStatusMenuId === task.id && (
                              <div className="absolute right-0 mt-2 w-[170px] bg-white border border-[#E5E7EB] rounded-[12px] shadow-md z-20 overflow-hidden">
                                <button
                                  onClick={() =>
                                    handleStatusChange(task.id, "todo")
                                  }
                                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] text-[14px] text-[#374151]"
                                >
                                  To do
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(task.id, "inProgress")
                                  }
                                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] text-[14px] text-[#374151]"
                                >
                                  In Progress
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusChange(task.id, "done")
                                  }
                                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] text-[14px] text-[#374151]"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
  {/* Project Progress */}
  <section className="bg-white rounded-[18px] p-6 md:p-8">
    <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
      Project Progress
    </h2>

    <div className="mt-8">
      <p className="text-[16px] text-[#9CA3AF] mb-5">Current Stage</p>

      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-[18px] font-medium text-[#111827]">
          {getCurrentStage()}
        </h3>
        <span className="text-[16px] text-[#6B7280] font-medium">
          {doneTasks}/{totalTasks} tasks
        </span>
      </div>

      <div className="w-full h-[12px] rounded-full bg-[#E5E7EB] overflow-hidden">
        <div
          className="h-full bg-[#14B8A6] rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  </section>

  {/* Team */}
  <section className="bg-white rounded-[18px] p-6 md:p-8">
    <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
      Team
    </h2>

    <div className="mt-8 space-y-6">
      {teamData.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 min-w-0">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={member.name}
                className="w-[54px] h-[54px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[54px] h-[54px] rounded-full bg-[#D9D9D9] shrink-0"></div>
            )}

            <div className="min-w-0">
              <h3 className="text-[18px] font-medium text-[#111827] truncate">
                {member.name}
              </h3>
              <p className="text-[15px] text-[#9CA3AF] mt-1">{member.role}</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenProfile(member.profileLink)}
            className="h-[44px] px-5 rounded-[12px] border border-[#D1D5DB] text-[#6B7280] text-[15px] font-medium hover:bg-[#F8FAFC] transition shrink-0"
          >
            View Profile
          </button>
        </div>
      ))}
    </div>
  </section>

  {/* Resources */}
  <section className="bg-white rounded-[18px] p-6 md:p-8">
    <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
      Resources
    </h2>

    <div className="mt-8 space-y-5">
      <a
        href={resourcesData.github}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 text-[#111827] hover:text-[#0B8B84] transition"
      >
        <Github size={22} className="text-[#6B7280]" />
        <span className="text-[18px] font-medium">GitHub Repository</span>
      </a>

      <a
        href={resourcesData.drive}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 text-[#111827] hover:text-[#0B8B84] transition"
      >
        <span className="text-[#6B7280] text-[22px]">△</span>
        <span className="text-[18px] font-medium">Project Drive</span>
      </a>

      <a
        href={resourcesData.docs}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-4 text-[#111827] hover:text-[#0B8B84] transition"
      >
        <FileText size={22} className="text-[#6B7280]" />
        <span className="text-[18px] font-medium">API Documentation</span>
      </a>
    </div>
  </section>

  {/* AI Assistant */}
  <section className="bg-white rounded-[18px] p-6 md:p-8">
    <div className="flex items-center gap-3">
      <Sparkles size={22} className="text-[#0B8B84]" />
      <h2 className="text-[20px] md:text-[22px] font-bold text-[#111827]">
        AI Assistant
      </h2>
    </div>

    <p className="mt-6 text-[16px] md:text-[18px] leading-8 text-[#6B7280]">
      Need help with code or project context? Ask the AI
    </p>

    {aiMessages.length > 0 && (
      <div className="mt-6 space-y-3 max-h-[240px] overflow-y-auto pr-1">
        {aiMessages.map((message) => (
          <div
            key={message.id}
            className={`rounded-[12px] px-4 py-3 text-[14px] ${
              message.sender === "user"
                ? "bg-[#F0FBFA] text-[#111827]"
                : "bg-[#F3F4F6] text-[#374151]"
            }`}
          >
            {message.text}
          </div>
        ))}

        {aiLoading && (
          <div className="rounded-[12px] px-4 py-3 text-[14px] bg-[#F3F4F6] text-[#6B7280]">
            AI is typing...
          </div>
        )}
      </div>
    )}

    <div className="mt-6 flex items-center gap-3">
      <input
        type="text"
        value={aiInput}
        onChange={(e) => setAiInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAiSend();
        }}
        placeholder="Ask AI"
        className="flex-1 h-[52px] rounded-[14px] border border-[#D1D5DB] px-4 text-[16px] outline-none"
      />

      <button
        onClick={handleAiSend}
        className="w-[52px] h-[52px] rounded-[14px] border border-[#64C7C2] text-[#0B8B84] flex items-center justify-center hover:bg-[#F0FBFA] transition"
      >
        <SendHorizontal size={22} />
      </button>
    </div>
  </section>
</div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;