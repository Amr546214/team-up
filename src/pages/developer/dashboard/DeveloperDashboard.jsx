import { Link, useNavigate } from "react-router-dom";
import DeveloperLayout from "../../../layouts/DeveloperLayout";
import Header from "../../../components/common/Header";
import {
  BriefcaseBusiness,
  Send,
  CircleDollarSign,
  Star,
  FolderOpen,
  Building2,
  Clock3,
  FileText,
  Layers3,
  CheckCircle2,
} from "lucide-react";

function DeveloperDashboard() {
  const navigate = useNavigate();
  /* =========================
     Fake API Data (Data only)
  ========================== */
  const user = {
    firstName: "Hanan",
  };

  const statsCards = [
    {
      id: 1,
      type: "activeJobs",
      title: "Active jobs",
      value: 3,
      note: "+2 this week",
    },
    {
      id: 2,
      type: "appliedProjects",
      title: "Applied Projects",
      value: 12,
      note: "3 pending",
    },
    {
      id: 3,
      type: "totalEarning",
      title: "Total Earning",
      value: "$20.3",
      note: "+14%",
    },
    {
      id: 4,
      type: "currentRank",
      title: "Current Rank",
      value: "Gold",
      note: "Top 5%",
    },
  ];

  const activeProjects = [
    {
      id: 1,
      name: "E-commerce Admin Audit",
      description: "Audit usability issues and propose UX improvements",
      company: "Edtech Startup",
      duration: "Revamp 3 week",
      status: "active",
      progress: 54,
    },
    {
      id: 2,
      name: "AI Learning Platform",
      description: "Redesign learning experience to support AI features",
      company: "RetailX",
      duration: "Audit 1 week",
      status: "planned",
      progress: 20,
    },
  ];

  const applications = [
    {
      id: 1,
      type: "proposal",
      name: "Healthcare Booking App",
      budget: "$4,500",
      status: "pending",
    },
    {
      id: 2,
      type: "proposal",
      name: "SaaS Dashboard Redesign",
      budget: "$2,800",
      status: "accepted",
    },
  ];

  const recommendedJobs = [
    {
      id: 1,
      title: "Frontend Developer for FinTech",
      skills: ["React", "Tailwind", "Web3"],
      budget: "$3K - $5K",
      hasApplied: false,
    },
    {
      id: 2,
      title: "Fullstack MVP Build",
      skills: ["Next.js", "Node"],
      budget: "$5K - $8K",
      hasApplied: true,
    },
  ];
  const performanceData = {
    averageRating: 4.9,
    ratingScale: 5.0,
    completedProjects: 42,
    isLoading: false,
  };

  /* =========================
     UI / Design Logic only
  ========================== */
  const getStatsCardStyles = (type) => {
    switch (type) {
      case "activeJobs":
        return {
          icon: BriefcaseBusiness,
          iconColor: "text-[#22C55E]",
          noteColor: "text-[#22C55E]",
        };

      case "appliedProjects":
        return {
          icon: Send,
          iconColor: "text-[#4F7CFF]",
          noteColor: "text-[#9CA3AF]",
        };

      case "totalEarning":
        return {
          icon: CircleDollarSign,
          iconColor: "text-[#F97316]",
          noteColor: "text-[#22C55E]",
        };

      case "currentRank":
        return {
          icon: Star,
          iconColor: "text-[#EAB308]",
          noteColor: "text-[#9CA3AF]",
        };

      default:
        return {
          icon: BriefcaseBusiness,
          iconColor: "text-[#6B7280]",
          noteColor: "text-[#6B7280]",
        };
    }
  };

  const getProjectStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          textColor: "text-[#22C55E]",
          dotColor: "bg-[#22C55E]",
          label: "Active",
        };

      case "planned":
        return {
          textColor: "text-[#EAB308]",
          dotColor: "bg-[#EAB308]",
          label: "Planned",
        };

      default:
        return {
          textColor: "text-[#6B7280]",
          dotColor: "bg-[#6B7280]",
          label: status,
        };
    }
  };

  const getApplicationStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-[#E8F8EE] text-[#15803D]";
      case "pending":
        return "bg-[#F3F4F6] text-[#6B7280]";
      case "rejected":
        return "bg-[#FDECEC] text-[#DC2626]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const getApplicationIcon = (type) => {
    switch (type) {
      case "proposal":
        return {
          icon: FileText,
          iconColor: "text-[#22C55E]",
        };

      default:
        return {
          icon: Layers3,
          iconColor: "text-[#22C55E]",
        };
    }
  };

  const getRecommendedButtonText = (hasApplied) => {
    return hasApplied ? "View" : "Apply";
  };

  const getRecommendedButtonStyle = (hasApplied) => {
    return hasApplied
      ? "bg-white text-[#0B6F6C] border border-[#E5E7EB] hover:bg-[#F8FAFC]"
      : "bg-[#0B6F6C] text-white border border-[#0B6F6C] hover:bg-[#095c5a]";
  };

  const getRecommendedButtonLink = (job) => {
    return `/developer/jobs/${job.id}`;
  };
  const getAverageRatingText = (averageRating, ratingScale) => {
    if (averageRating === null || averageRating === undefined) {
      return "No rating yet";
    }

    return `${averageRating}/${ratingScale}`;
  };

  const getCompletedProjectsText = (completedProjects) => {
    if (!completedProjects) {
      return "0 Projects";
    }

    return `${completedProjects} Projects`;
  };

  return (
    <DeveloperLayout>
      <>
      <Header />
      <div className="min-h-screen bg-[#F5F9F9] mt-15 p-4 md:p-6 ml-[240px] lg:ml-[240px]">
      <div className="max-w-[1100px] mx-auto">
        {/* Welcome + Stats */}
        <section>
          <div className="mb-6">
            <h1 className="text-[18px] md:text-[20px] font-bold text-[#111827]">
              Hello {user.firstName}, manage your work.
            </h1>
            <p className="mt-1 text-[13px] md:text-[14px] text-[#6B7280]">
              Track your projects, applications, and performance metrics.
            </p>
          </div>

          <div className="bg-white rounded-[14px] p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {statsCards.map((card) => {
                const styles = getStatsCardStyles(card.type);
                const Icon = styles.icon;

                return (
                  <div
                    key={card.id}
                    className="bg-[#ECFDFC] rounded-[10px] p-4 min-h-[112px] flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className={styles.iconColor} size={18} />
                      <span
                        className={`text-[12px] font-medium ${styles.noteColor}`}
                      >
                        {card.note}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-[28px] leading-none font-semibold text-[#111827]">
                        {card.value}
                      </h3>
                      <p className="mt-2 text-[14px] text-[#374151]">
                        {card.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active Projects */}
        <section className="mt-5 bg-white rounded-[14px] p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#111827]">
              Active Projects
            </h2>

            <Link
              to="/developer/project/1"
              className="h-[40px] px-4 rounded-[10px] border border-[#E5E7EB] text-[#0B6F6C] text-[14px] font-medium hover:bg-[#F8FAFC] transition inline-flex items-center justify-center"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeProjects.map((project) => {
              const statusStyles = getProjectStatusStyles(project.status);

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/developer/project/${project.id}`)}
                  className="border border-[#E5E7EB] rounded-[12px] p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <FolderOpen size={18} className="text-[#6B7280]" />

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-[10px] h-[10px] rounded-full ${statusStyles.dotColor}`}
                      ></span>
                      <span
                        className={`text-[14px] font-medium ${statusStyles.textColor}`}
                      >
                        {statusStyles.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-[16px] font-semibold text-[#1F2937]">
                    {project.name}
                  </h3>

                  <p className="mt-3 text-[14px] leading-normal text-[#9CA3AF] max-w-[360px]">
                    {project.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-6 text-[14px] text-[#9CA3AF]">
                    <div className="flex items-center gap-2">
                      <Building2 size={15} />
                      <span>{project.company}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock3 size={15} />
                      <span>{project.duration}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-end mb-1">
                      <span className="text-[11px] text-[#6B7280]">
                        {project.progress}%
                      </span>
                    </div>

                    <div className="w-full h-[8px] rounded-full bg-[#E5E7EB] overflow-hidden">
                      <div
                        className="h-full bg-[#14B8A6] rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* My Applications */}
        <section className="mt-5 bg-white rounded-[14px] p-3 md:p-4">
          <h2 className="text-[18px] font-bold text-[#111827] mb-4">
            My Applications
          </h2>

          <div className="space-y-5">
            {applications.map((application) => {
              const appIcon = getApplicationIcon(application.type);
              const Icon = appIcon.icon;

              return (
                <div
                  key={application.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon size={18} className={`${appIcon.iconColor} mt-1`} />

                    <div>
                      <h3 className="text-[16px] font-medium text-[#1F2937]">
                        {application.name}
                      </h3>
                      <p className="mt-1 text-[14px] text-[#9CA3AF]">
                        Proposed Budget: {application.budget}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1 rounded-full text-[14px] font-medium ${getApplicationStatusClass(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>

                    <Link
                      to={`/developer/jobs/${application.id}`}
                      className="h-[40px] px-4 rounded-[10px] border border-[#E5E7EB] text-[#0B6F6C] text-[14px] font-medium hover:bg-[#F8FAFC] transition inline-flex items-center justify-center"
                    >
                      View Proposal
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommended */}
        <section className="mt-5 bg-white rounded-[14px] p-3 md:p-4">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#111827] mb-4">
            Recommended
          </h2>

          {recommendedJobs.length === 0 ? (
            <div className="border border-[#E5E7EB] rounded-[12px] p-6 text-[14px] text-[#9CA3AF]">
              No recommended jobs right now
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/developer/jobs/${job.id}`)}
                  className="border border-[#E5E7EB] rounded-[12px] p-4 md:p-5"
                >
                  <h3 className="text-[16px] md:text-[18px] font-semibold text-[#111827] break-words">
                    {job.title}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {job.skills?.length > 0 ? (
                      job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 rounded-[12px] bg-[#F3F4F6] text-[#4B5563] text-[14px] font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[14px] text-[#9CA3AF]">
                        No skills specified
                      </span>
                    )}
                  </div>

                  <div className="mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <p className="text-[16px] md:text-[18px] font-semibold text-[#111827]">
                      {job.budget || "Budget not specified"}
                    </p>

                    <Link
                      to={getRecommendedButtonLink(job)}
                      className={`h-[48px] min-w-[120px] px-6 rounded-[12px] text-[16px] font-medium inline-flex items-center justify-center transition ${getRecommendedButtonStyle(
                        job.hasApplied
                      )}`}
                    >
                      {getRecommendedButtonText(job.hasApplied)}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
                {/* Performance */}
                <section className="mt-5 bg-white rounded-[14px] p-3 md:p-4">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#111827] mb-4">
            Performance
          </h2>

          {performanceData.isLoading ? (
            <div className="space-y-4">
              <div className="h-[110px] rounded-[12px] bg-[#F3F4F6] animate-pulse"></div>
              <div className="h-[110px] rounded-[12px] bg-[#F3F4F6] animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[12px] bg-[#F8FAFC] px-6 py-6 flex items-center gap-5">
                <div className="w-[42px] h-[42px] rounded-[12px] bg-[#FEF3C7] flex items-center justify-center">
                  <Star size={24} className="text-[#D97706] fill-[#D97706]" />
                </div>

                <div>
                  <p className="text-[18px] md:text-[20px] text-[#9CA3AF] font-medium">
                    Average Rating
                  </p>
                  <h3 className="text-[20px] md:text-[24px] font-semibold text-[#111827] mt-1">
                    {getAverageRatingText(
                      performanceData.averageRating,
                      performanceData.ratingScale
                    )}
                  </h3>
                </div>
              </div>

              <div className="rounded-[12px] bg-[#F8FAFC] px-6 py-6 flex items-center gap-5">
                <div className="w-[42px] h-[42px] rounded-[12px] bg-[#ECFDF5] flex items-center justify-center">
                <CheckCircle2 size={24} className="text-[#14B8A6]" />
                </div>

                <div>
                  <p className="text-[18px] md:text-[20px] text-[#9CA3AF] font-medium">
                    Completed
                  </p>
                  <h3 className="text-[20px] md:text-[24px] font-semibold text-[#111827] mt-1">
                    {getCompletedProjectsText(
                      performanceData.completedProjects
                    )}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </section>
        </div>
</div>
</>
    </DeveloperLayout>
    
  );
}

export default DeveloperDashboard;