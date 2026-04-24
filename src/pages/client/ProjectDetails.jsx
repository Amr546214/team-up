import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

function ProjectDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [project] = useState({
    id: id || "1",
    title: "E-commerce Platform Redesign",
    status: "active",
    description:
      "Complete redesign and development of the e-commerce platform with modern UI, improved UX, and scalable backend architecture.",
    budget: "$15,000",
    startDate: "Sep 01, 2026",
    endDate: "Dec 15, 2026",
    progress: 45,
    teamSize: 4,
    completedTasks: 8,
    totalTasks: 18,
  });

  const [teamMembers] = useState([
    { id: 1, name: "Hanan Muhammed", role: "Lead Frontend", avatar: "" },
    { id: 2, name: "Sara Ahmed", role: "Backend Developer", avatar: "" },
    { id: 3, name: "Omar Essam", role: "UI/UX Designer", avatar: "" },
    { id: 4, name: "Eman Ali", role: "DevOps Engineer", avatar: "" },
  ]);

  const [milestones] = useState([
    { id: 1, title: "Project Setup & Planning", status: "completed", dueDate: "Sep 15, 2026" },
    { id: 2, title: "UI/UX Design Phase", status: "completed", dueDate: "Oct 01, 2026" },
    { id: 3, title: "Frontend Development", status: "in_progress", dueDate: "Nov 01, 2026" },
    { id: 4, title: "Backend Integration", status: "pending", dueDate: "Nov 20, 2026" },
    { id: 5, title: "Testing & QA", status: "pending", dueDate: "Dec 05, 2026" },
    { id: 6, title: "Launch", status: "pending", dueDate: "Dec 15, 2026" },
  ]);

  const [recentActivity] = useState([
    { id: 1, text: "Hanan completed the homepage layout", time: "2h ago" },
    { id: 2, text: "Sara pushed API authentication module", time: "5h ago" },
    { id: 3, text: "Omar uploaded new design mockups", time: "1d ago" },
    { id: 4, text: "Milestone 'UI/UX Design Phase' marked complete", time: "2d ago" },
  ]);

  /* =========================
     UI Logic
  ========================== */
  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", dot: "bg-[#22C55E]", label: "Active" };
      case "completed":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Completed" };
      case "paused":
        return { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", dot: "bg-[#D97706]", label: "Paused" };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", dot: "bg-[#9CA3AF]", label: status };
    }
  };

  const getMilestoneIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={18} className="text-[#22C55E]" />;
      case "in_progress":
        return <Clock size={18} className="text-[#0B6F6C]" />;
      default:
        return <AlertCircle size={18} className="text-[#9CA3AF]" />;
    }
  };

  const statusStyle = getStatusStyle(project.status);

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div className="flex-1">
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                {project.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className={`h-8 px-4 rounded-full inline-flex items-center gap-2 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
                <span className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <CalendarDays size={16} />
                  {project.startDate} - {project.endDate}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, label: "Budget", value: project.budget, color: "text-[#22C55E]" },
                  { icon: Users, label: "Team Size", value: project.teamSize, color: "text-[#4F7CFF]" },
                  { icon: CheckCircle2, label: "Tasks Done", value: `${project.completedTasks}/${project.totalTasks}`, color: "text-[#0B6F6C]" },
                  { icon: Clock, label: "Progress", value: `${project.progress}%`, color: "text-[#F97316]" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-[#E5E7EB]">
                      <Icon size={20} className={stat.color} />
                      <p className="text-[22px] font-bold text-[#111827] mt-2">{stat.value}</p>
                      <p className="text-[13px] text-[#6B7280] mt-1">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                <h2 className="text-[18px] font-bold text-[#111827]">Project Overview</h2>
                <p className="mt-4 text-[15px] leading-7 text-[#6B7280]">{project.description}</p>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B7280]">Overall Progress</span>
                    <span className="text-sm font-medium text-[#111827]">{project.progress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div
                      className="h-full bg-[#0B6F6C] rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                <h2 className="text-[18px] font-bold text-[#111827] mb-5">Milestones</h2>
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        milestone.status === "completed"
                          ? "bg-[#F8FAF8] border-[#E5E7EB]"
                          : milestone.status === "in_progress"
                          ? "bg-[#F0FBFA] border-[#0B6F6C]/20"
                          : "bg-white border-[#E5E7EB]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getMilestoneIcon(milestone.status)}
                        <span
                          className={`text-[15px] font-medium ${
                            milestone.status === "completed"
                              ? "text-[#9CA3AF] line-through"
                              : "text-[#111827]"
                          }`}
                        >
                          {milestone.title}
                        </span>
                      </div>
                      <span className="text-[13px] text-[#6B7280]">{milestone.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Team */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-bold text-[#111827]">Team</h2>
                  <button
                    onClick={() => navigate("/client/build-team")}
                    className="text-sm text-[#0B6F6C] font-medium hover:underline"
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC]">
                      <div className="w-9 h-9 rounded-full bg-[#D9D9D9] shrink-0" />
                      <div>
                        <p className="text-[14px] font-medium text-[#111827]">{member.name}</p>
                        <p className="text-[12px] text-[#6B7280]">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
                <h2 className="text-[18px] font-bold text-[#111827] mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <MessageSquare size={16} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[14px] text-[#111827]">{activity.text}</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
