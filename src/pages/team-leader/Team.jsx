import { useState } from "react";
import Header from "../../components/common/Header";
import Sidebar from "../../components/team-leader/Sidebar";
import TeamMemberCard from "../../components/team-leader/TeamMemberCard";
import MemberModal from "../../components/team-leader/MemberModal";
import ReplaceMemberModal from "../../components/team-leader/ReplaceMemberModal";
import { dashboardData } from "../../data/dashboardData";

function Team() {
  const [activeTab, setActiveTab] = useState("team");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [teamMembers, setTeamMembers] = useState(dashboardData.teamMembers);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToReplace, setMemberToReplace] = useState(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);

  const currentUser = teamMembers[0];

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
  };

  const availableReplaceOptions = dashboardData.replaceOptions.filter(
    (m) => !teamMembers.some((tm) => tm.id === m.id)
  );

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
              <h2>Team Members</h2>
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
        </main>
      </div>

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

export default Team;
