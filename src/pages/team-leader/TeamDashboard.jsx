import { useMemo, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import Header from "../../components/common/Header";
import Sidebar from "../../components/team-leader/Sidebar";
import ProjectHeader from "../../components/team-leader/ProjectHeader";
import TaskCard from "../../components/team-leader/TaskCard";
import TeamMemberCard from "../../components/team-leader/TeamMemberCard";
import EvaluationCard from "../../components/team-leader/EvaluationCard";
import ActivityCard from "../../components/team-leader/ActivityCard";
import AddTaskModal from "../../components/team-leader/AddTaskModal";
import MemberModal from "../../components/team-leader/MemberModal";
import ReplaceMemberModal from "../../components/team-leader/ReplaceMemberModal";
import { dashboardData } from "../../data/dashboardData";

function TeamDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState(dashboardData.tasks);
  const [teamMembers, setTeamMembers] = useState(dashboardData.teamMembers);
  const [evaluations, setEvaluations] = useState(dashboardData.evaluations);
  const [activity, setActivity] = useState(dashboardData.recentActivity);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToReplace, setMemberToReplace] = useState(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);

  const contentRef = useRef(null);
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
      tasks: tasksRef,
      team: teamRef,
      progress: progressRef,
      reports: reportsRef,
    };

    const targetRef = sectionMap[tabKey];

    if (targetRef?.current && contentRef.current) {
      const container = contentRef.current;
      const top = targetRef.current.offsetTop - 14;

      container.scrollTo({
        top,
        behavior: "smooth",
      });
    }
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

  const handleViewProfile = (member) => {
    setSelectedMember(member);
    setIsMemberModalOpen(true);
  };

  const handleReplaceMember = (member) => {
    setMemberToReplace(member);
    setIsReplaceModalOpen(true);
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

  const handleRateEvaluation = (evaluationId, value) => {
    setEvaluations((prev) =>
      prev.map((item) =>
        item.id === evaluationId ? { ...item, rating: value } : item
      )
    );
  };

  const availableReplaceOptions = useMemo(() => {
    const usedIds = teamMembers.map((member) => member.id);
    return dashboardData.replaceOptions.filter(
      (member) => !usedIds.includes(member.id)
    );
  }, [teamMembers]);

  return (
    <div className="team-dashboard-page">
      <Sidebar
        activeTab={activeTab}
        onTabChange={scrollToSection}
        user={currentUser}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="team-dashboard-main">
        <Header />

        <main className="dashboard-content" ref={contentRef}>
          <div ref={topRef}>
            <ProjectHeader project={dashboardData.project} />
          </div>

          <section className="dashboard-section" ref={tasksRef}>
            <div className="section-header">
              <h2>Current Tasks</h2>

              <button
                type="button"
                className="section-plus-btn"
                aria-label="Add Task"
                onClick={() => setIsAddTaskOpen(true)}
              >
                <PlusIcon className="section-plus-icon" />
              </button>
            </div>

            <div className="tasks-grid">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </section>

          <section className="dashboard-section" ref={teamRef}>
            <div className="section-header">
              <h2>Team Member</h2>
            </div>

            <div className="team-grid">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onViewProfile={handleViewProfile}
                  onReplaceMember={handleReplaceMember}
                />
              ))}
            </div>
          </section>

          <section className="bottom-grid">
            <div className="dashboard-section small-card" ref={progressRef}>
              <div className="section-header">
                <h2>Recent Evaluations</h2>
              </div>

              {evaluations.map((evaluation) => (
                <EvaluationCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  onRate={handleRateEvaluation}
                />
              ))}
            </div>

            <div className="dashboard-section small-card" ref={reportsRef}>
              <div className="section-header">
                <h2>Recent Activity</h2>
              </div>

              {activity.map((item) => (
                <ActivityCard key={item.id} activity={item} />
              ))}
            </div>
          </section>
        </main>
      </div>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        teamMembers={teamMembers}
      />

      <MemberModal
        member={selectedMember}
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />

      <ReplaceMemberModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        memberToReplace={memberToReplace}
        replaceOptions={availableReplaceOptions}
        onConfirmReplace={handleConfirmReplace}
      />
    </div>
  );
}

export default TeamDashboard;