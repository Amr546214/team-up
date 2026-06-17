import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import CompanySidebar from "../../components/common/ClientSidebar";
import {
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  Briefcase,
  MessageSquare,
  Shield,
  Layers,
  Clock,
} from "lucide-react";

const TEAM_RECOMMENDATIONS = [
  {
    id: 1,
    matchScore: 98,
    members: [
      {
        id: 1,
        name: "Marcus Johnson",
        role: "Team Leader",
        rank: "Senior",
        experience: "8 yrs exp",
        availability: "Immediate",
        skills: ["Leadership", "Agile", "Strategy"],
        initials: "MJ",
      },
      {
        id: 2,
        name: "Sarah Chen",
        role: "Frontend Developer",
        rank: "Mid-Level",
        experience: "4 yrs exp",
        availability: "Immediate",
        skills: ["React", "TypeScript", "Tailwind"],
        initials: "SC",
      },
      {
        id: 3,
        name: "David Miller",
        role: "Backend Developer",
        rank: "Senior",
        experience: "6 yrs exp",
        availability: "In 2 weeks",
        skills: ["Node.js", "PostgreSQL", "AWS"],
        initials: "DM",
      },
      {
        id: 4,
        name: "Elena Rostova",
        role: "UI/UX Designer",
        rank: "Mid-Level",
        experience: "5 yrs exp",
        availability: "Immediate",
        skills: ["Figma", "Prototyping", "Design Systems"],
        initials: "ER",
      },
      {
        id: 5,
        name: "James Wilson",
        role: "AI Engineer",
        rank: "Senior",
        experience: "7 yrs exp",
        availability: "Immediate",
        skills: ["Python", "ML", "LLMs"],
        initials: "JW",
      },
    ],
  },
  {
    id: 2,
    matchScore: 94,
    members: [
      {
        id: 6,
        name: "Priya Sharma",
        role: "Team Leader",
        rank: "Senior",
        experience: "10 yrs exp",
        availability: "Immediate",
        skills: ["Product Delivery", "Scrum", "Stakeholder Mgmt"],
        initials: "PS",
      },
      {
        id: 7,
        name: "Alex Rivera",
        role: "Frontend Developer",
        rank: "Senior",
        experience: "6 yrs exp",
        availability: "In 2 weeks",
        skills: ["Vue", "React", "Next.js"],
        initials: "AR",
      },
      {
        id: 8,
        name: "Nina Patel",
        role: "Backend Developer",
        rank: "Mid-Level",
        experience: "5 yrs exp",
        availability: "Immediate",
        skills: ["Go", "Docker", "Redis"],
        initials: "NP",
      },
      {
        id: 9,
        name: "Tom Becker",
        role: "UI/UX Designer",
        rank: "Senior",
        experience: "7 yrs exp",
        availability: "Immediate",
        skills: ["UX Research", "Figma", "Accessibility"],
        initials: "TB",
      },
      {
        id: 10,
        name: "Lina Cho",
        role: "AI Engineer",
        rank: "Mid-Level",
        experience: "4 yrs exp",
        availability: "Busy",
        skills: ["TensorFlow", "NLP", "Data Pipelines"],
        initials: "LC",
      },
    ],
  },
  {
    id: 3,
    matchScore: 91,
    members: [
      {
        id: 11,
        name: "Robert Hayes",
        role: "Team Leader",
        rank: "Senior",
        experience: "9 yrs exp",
        availability: "In 2 weeks",
        skills: ["Engineering Mgmt", "Roadmapping", "Hiring"],
        initials: "RH",
      },
      {
        id: 12,
        name: "Mia Foster",
        role: "Frontend Developer",
        rank: "Mid-Level",
        experience: "3 yrs exp",
        availability: "Immediate",
        skills: ["React", "CSS", "Testing"],
        initials: "MF",
      },
      {
        id: 13,
        name: "Chris Okafor",
        role: "Backend Developer",
        rank: "Senior",
        experience: "8 yrs exp",
        availability: "Immediate",
        skills: ["Java", "Spring", "Microservices"],
        initials: "CO",
      },
      {
        id: 14,
        name: "Sofia Mendez",
        role: "UI/UX Designer",
        rank: "Junior",
        experience: "2 yrs exp",
        availability: "Immediate",
        skills: ["Wireframing", "Adobe XD", "UI Kits"],
        initials: "SM",
      },
      {
        id: 15,
        name: "Ethan Park",
        role: "AI Engineer",
        rank: "Senior",
        experience: "6 yrs exp",
        availability: "Immediate",
        skills: ["PyTorch", "Computer Vision", "MLOps"],
        initials: "EP",
      },
    ],
  },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    group: "Interviews",
    message: "Tech screening scheduled with Anna Lee",
    time: "2 hours ago",
    icon: CalendarDays,
  },
  {
    id: 2,
    group: "Applicants",
    message: "3 new highly matched applicants",
    time: "4 hours ago",
    icon: Users,
  },
  {
    id: 3,
    group: "Projects",
    message: "Project Phoenix Redesign updated",
    time: "Yesterday",
    icon: Briefcase,
  },
  {
    id: 4,
    group: "Messages",
    message: "Message from Hiring Manager",
    time: "Yesterday",
    icon: MessageSquare,
  },
];

function AutoSuggestTeam() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [approvedTeam, setApprovedTeam] = useState(null);

  const currentRecommendation = TEAM_RECOMMENDATIONS[recommendationIndex];
  const activeTeam = isApproved && approvedTeam ? approvedTeam : currentRecommendation;

  const getAvailabilityStyle = (availability) => {
    switch (availability) {
      case "Immediate":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "In 2 weeks":
        return "bg-[#FEF3C7] text-[#D97706]";
      case "Busy":
        return "bg-[#FEE2E2] text-[#DC2626]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case "Senior":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "Mid-Level":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      case "Junior":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const handleRegenerate = () => {
    setIsApproved(false);
    setIsRejected(false);
    setApprovedTeam(null);
    setRecommendationIndex((prev) => (prev + 1) % TEAM_RECOMMENDATIONS.length);
  };

  const handleReject = () => {
    setIsApproved(false);
    setIsRejected(true);
    setApprovedTeam(null);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setIsRejected(false);
    setApprovedTeam(currentRecommendation);
  };

  const filteredMembers = activeTeam.members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      member.skills.some((skill) => skill.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <CompanySidebar />

      <main className="min-h-screen bg-[#F5F9F9] ml-[230px]">
        <Header />

        <div className="pt-20 px-4 md:px-8 pb-10">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                  Auto Suggest Team
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  AI-generated complete team recommendation for your project.
                </p>
              </div>

              <div className="bg-white rounded-2xl px-4 py-2 border border-[#E5E7EB] flex items-center gap-3 w-full lg:w-[320px]">
                <Search size={18} className="text-[#9CA3AF] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members..."
                  className="flex-1 h-10 text-sm outline-none text-[#111827] placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-8 space-y-6">
                {/* AI Team Recommendation */}
                {!isRejected && (
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#0B6F6C]/10 shrink-0">
                          <Sparkles size={22} className="text-[#0B6F6C]" />
                        </div>
                        <div>
                          <h2 className="text-[18px] font-bold text-[#111827]">
                            AI Team Recommendation
                          </h2>
                          <p className="text-[14px] text-[#6B7280] mt-2 leading-6 max-w-2xl">
                            This complete team was selected based on your project
                            requirements, role balance, experience levels,
                            availability, and skill coverage across all critical
                            delivery areas.
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#EAF8EE] text-[#22C55E] shrink-0">
                        {activeTeam.matchScore}% Match Score
                      </span>
                    </div>

                    {isApproved && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EAF8EE] text-[#22C55E] text-[12px] font-semibold">
                        <CheckCircle2 size={14} />
                        Team Approved
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Lineup */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[18px] font-bold text-[#111827] mb-6">
                    Suggested Lineup
                  </h2>

                  {isRejected ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                        <Users size={24} className="text-[#9CA3AF]" />
                      </div>
                      <p className="text-[15px] font-medium text-[#6B7280]">
                        No team recommendation selected.
                      </p>
                      <p className="text-[13px] text-[#9CA3AF] mt-1">
                        Regenerate a new team to review another recommendation.
                      </p>
                      <button
                        onClick={handleRegenerate}
                        className="mt-6 h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-[#095c5a] transition"
                      >
                        <RefreshCw size={16} />
                        Regenerate Team
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            onClick={() => navigate("/developer/profile")}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0B6F6C]/20 transition cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-full bg-[#0B6F6C]/10 text-[#0B6F6C] flex items-center justify-center text-[13px] font-bold shrink-0">
                                {member.initials}
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-[15px] font-semibold text-[#111827]">
                                  {member.name}
                                </h3>
                                <p className="text-[13px] text-[#6B7280]">
                                  {member.role}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getRankStyle(member.rank)}`}
                                  >
                                    {member.rank}
                                  </span>
                                  <span className="text-[12px] text-[#9CA3AF]">
                                    {member.experience}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getAvailabilityStyle(member.availability)}`}
                                  >
                                    {member.availability}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 sm:justify-end">
                              {member.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {!isApproved && (
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                          <button
                            onClick={handleRegenerate}
                            className="h-11 px-5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition"
                          >
                            <RefreshCw size={16} />
                            Regenerate Team
                          </button>
                          <button
                            onClick={handleReject}
                            className="h-11 px-5 rounded-xl border border-[#FECACA] bg-white text-[#DC2626] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FEE2E2] transition"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          <button
                            onClick={handleApprove}
                            className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#095c5a] transition sm:ml-auto"
                          >
                            <CheckCircle2 size={16} />
                            Approve Team
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* AI Explanation */}
                {!isRejected && (
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                    <h2 className="text-[16px] font-bold text-[#111827] mb-4">
                      Why This Team Works
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={16} className="text-[#0B6F6C]" />
                          <p className="text-[13px] font-semibold text-[#111827]">
                            Role Coverage
                          </p>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-5">
                          All core roles are covered: leadership, frontend,
                          backend, design, and AI engineering.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers size={16} className="text-[#0B6F6C]" />
                          <p className="text-[13px] font-semibold text-[#111827]">
                            Seniority Balance
                          </p>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-5">
                          Mix of senior and mid-level talent ensures mentorship
                          and sustainable delivery pace.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={16} className="text-[#0B6F6C]" />
                          <p className="text-[13px] font-semibold text-[#111827]">
                            Availability Match
                          </p>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-5">
                          Majority of members are available immediately, with
                          minimal onboarding delay.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 size={16} className="text-[#0B6F6C]" />
                          <p className="text-[13px] font-semibold text-[#111827]">
                            Project Readiness
                          </p>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-5">
                          Skill overlap and complementary expertise support a
                          fast project kickoff.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                {/* Project Readiness */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[18px] font-bold text-[#111827] mb-4">
                    Project Readiness
                  </h2>
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-[32px] font-bold text-[#111827]">
                      {isApproved ? 95 : 85}%
                    </span>
                    <span className="text-[12px] text-[#6B7280]">
                      {isApproved ? "Ready to onboard" : "Pre-approval"}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-[#0B6F6C] transition-all duration-500"
                      style={{ width: isApproved ? "95%" : "85%" }}
                    />
                  </div>
                  <p className="text-[13px] text-[#6B7280] leading-5">
                    Approving this team will bring readiness close to 100% and
                    start onboarding workflows.
                  </p>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[18px] font-bold text-[#111827] mb-5">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {RECENT_ACTIVITY.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition"
                        >
                          <div className="p-2 rounded-lg bg-[#0B6F6C]/10 shrink-0">
                            <Icon size={14} className="text-[#0B6F6C]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#0B6F6C] uppercase tracking-wide">
                              {item.group}
                            </p>
                            <p className="text-[13px] text-[#111827] mt-0.5">
                              {item.message}
                            </p>
                            <p className="text-[11px] text-[#9CA3AF] mt-1">
                              {item.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AutoSuggestTeam;
