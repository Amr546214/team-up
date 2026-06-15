import { useMemo, useRef, useState } from "react";
import {
  PlusIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  EyeIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  // XMarkIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";

const dashboardData = {
  project: {
    title: "Website Redesign",
    status: "Active",
    company: "Acme Corp",
  },

  tasks: [
    {
      id: 1,
      priority: "High Priority",
      priorityType: "high",
      status: "In Progress",
      statusType: "progress",
      title: "Visual Identity Update",
      description:
        "Complete the new brand guidelines and update all logo assets across platforms.",
      assigneeId: 2,
      assignee: "Sara Ahmed",
      deadline: "Oct 24, 2026",
    },
    {
      id: 2,
      priority: "Medium",
      priorityType: "medium",
      status: "To Do",
      statusType: "todo",
      title: "Dashboard Wireframes",
      description: "Create initial wireframes for the analytics dashboard.",
      assigneeId: 1,
      assignee: "Hanan Muhammed",
      deadline: "Oct 28, 2026",
    },
  ],

  teamMembers: [
    {
      id: 1,
      name: "Hanan Muhammed",
      role: "Lead Designer",
      level: "Senior",
      email: "hanan@example.com",
    },
    {
      id: 2,
      name: "Sara Ahmed",
      role: "Frontend Dev",
      level: "Mid",
      email: "sara@example.com",
    },
  ],

  replaceOptions: [
    {
      id: 3,
      name: "Youssef Khaled",
      role: "UI Designer",
      level: "Senior",
      email: "youssef@example.com",
    },
    {
      id: 4,
      name: "Eman Ali",
      role: "Frontend Dev",
      level: "Mid",
      email: "eman@example.com",
    },
    {
      id: 5,
      name: "Omar Essam",
      role: "Product Designer",
      level: "Senior",
      email: "omar@example.com",
    },
  ],

  evaluations: [
    {
      id: 1,
      name: "Hanan Muhammed",
      rating: 4,
      comment: "Completed DB migration ahead of schedule. Minor bug in staging.",
    },
  ],

  recentActivity: [
    {
      id: 1,
      title: "Task Completed",
      time: "2h ago",
      description: 'Hanan finished "Visual Identity Update"',
    },
  ],
};

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { key: "team", label: "Team", icon: UserGroupIcon },
  { key: "tasks", label: "Tasks", icon: ClipboardDocumentListIcon },
  { key: "progress", label: "Progress", icon: ChartBarIcon },
  { key: "reports", label: "Reports", icon: DocumentTextIcon },
];

function TeamDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [tasks, setTasks] = useState(dashboardData.tasks);
  const [teamMembers, setTeamMembers] = useState(dashboardData.teamMembers);
  const [evaluations, setEvaluations] = useState(dashboardData.evaluations);
  const [activity, setActivity] = useState(dashboardData.recentActivity);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToReplace, setMemberToReplace] = useState(null);

  const topRef = useRef(null);
  const tasksRef = useRef(null);
  const teamRef = useRef(null);
  const progressRef = useRef(null);
  const reportsRef = useRef(null);

  const currentUser = teamMembers[0];

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

  const handleAddTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);

    setActivity((prev) => [
      {
        id: Date.now(),
        title: "Task Added",
        time: "Just now",
        description: `New task "${newTask.title}" was added.`,
      },
      ...prev,
    ]);
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

    setActivity((prev) => [
      {
        id: Date.now(),
        title: "Member Replaced",
        time: "Just now",
        description: `${newMember.name} replaced a team member.`,
      },
      ...prev,
    ]);
  };

  const availableReplaceOptions = useMemo(() => {
    const usedIds = teamMembers.map((member) => member.id);
    return dashboardData.replaceOptions.filter(
      (member) => !usedIds.includes(member.id)
    );
  }, [teamMembers]);

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
              className="h-6 w-6 border-0 bg-transparent p-0"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[#4b5563]" />
            </button>

            <h1 className="m-0 text-[17px] font-bold text-[#1f2937]">
              {dashboardData.project.title}
            </h1>
          </div>

          <div className="flex items-center gap-7 pl-9">
            <span className="flex items-center gap-[6px] text-[14px] text-[#27a247]">
              <span className="h-[10px] w-[10px] rounded-full bg-[#27c04c]" />
              {dashboardData.project.status}
            </span>

            <span className="text-[14px] text-[#6b7280]">
              {dashboardData.project.company}
            </span>
          </div>
        </div>

        <section
          ref={tasksRef}
          className="mb-4 w-full rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
              Current Tasks
            </h2>

            <button
              type="button"
              aria-label="Add Task"
              onClick={() => setIsAddTaskOpen(true)}
              className="border-0 bg-transparent p-0"
            >
              <PlusIcon className="h-[18px] w-[18px] text-[#0e6b67]" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
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
                onViewProfile={() => setSelectedMember(member)}
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
            <div className="mb-3">
              <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
                Recent Evaluations
              </h2>
            </div>

            {evaluations.map((evaluation) => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                onRate={handleRateEvaluation}
              />
            ))}
          </div>
                    <div
            ref={reportsRef}
            className="min-h-[160px] rounded-[7px] border border-[#e2eceb] bg-white p-[14px]"
          >
            <div className="mb-3">
              <h2 className="m-0 text-[15px] font-bold text-[#1f2937]">
                Recent Activity
              </h2>
            </div>

            {activity.map((item) => (
              <ActivityCard key={item.id} activity={item} />
            ))}
          </div>
        </section>
      </main>

      {isAddTaskOpen && (
        <AddTaskModal
          onClose={() => setIsAddTaskOpen(false)}
          onAddTask={handleAddTask}
          teamMembers={teamMembers}
        />
      )}

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
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
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <div className="min-h-[158px] rounded-[7px] border border-[#e2e8ea] bg-white px-[14px] py-[18px]">
      <div className="mb-[18px] flex items-center gap-2">
        <span
          className={`inline-flex min-h-7 items-center justify-center rounded-[7px] px-[10px] text-[13px] font-medium ${
            task.priorityType === "high"
              ? "bg-[#fde8e8] text-[#ef4444]"
              : "bg-[#fff2de] text-[#f59e0b]"
          }`}
        >
          {task.priority}
        </span>

        <span
          className={`inline-flex min-h-7 items-center justify-center rounded-[7px] px-[10px] text-[13px] font-medium ${
            task.statusType === "progress"
              ? "bg-[#dbeafe] text-[#2563eb]"
              : "bg-[#f3f4f6] text-[#6b7280]"
          }`}
        >
          {task.status}
        </span>
      </div>

      <h3 className="mb-3 text-[15px] font-bold">{task.title}</h3>

      <p className="mb-5 text-[13px] text-[#6b7280]">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[#d9d9d9]" />
          <span className="text-[13px]">{task.assignee}</span>
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>{task.deadline}</span>
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
        <div className="h-10 w-10 rounded-full bg-[#d9d9d9]" />

        <div>
          <h4 className="text-[15px] font-medium">{member.name}</h4>

          <div className="flex gap-2 text-[12px] text-[#9ca3af]">
            <span>{member.role}</span>
            <span>{member.level}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onViewProfile}>
          <EyeIcon className="h-5 w-5" />
        </button>

        <button onClick={onReplaceMember}>
          <ArrowsRightLeftIcon className="h-5 w-5" />
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

function AddTaskModal() {
  return null;
}

function MemberModal() {
  return null;
}

function ReplaceMemberModal() {
  return null;
}

export default TeamDashboard;