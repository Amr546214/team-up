import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/common/Header";
import ClientSidebar from "../../components/common/ClientSidebar";
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

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

function getToken() {
  return (
    localStorage.getItem("teamup_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error_message ||
        `Request failed with status ${response.status}`
    );
  }

  return result?.data || result;
}


function AutoSuggestTeam() {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job || {};

  const [sessionId, setSessionId] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const generateTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const teamSize = Number(job.team_size) || Number(job.teamSize) || 6;
      const budget =
        Number(String(job.salary || job.budget || "0").replace(/[^0-9]/g, "")) ||
        50000;
      const skills = Array.isArray(job.skills) && job.skills.length > 0
        ? job.skills
        : ["React", "Node.js", "AI", "MongoDB", "Express"];

      const res = await apiRequest("/ai/team-builder/recommend", {
        method: "POST",
        body: JSON.stringify({ team_size: teamSize, budget, skills }),
      });

      const newSessionId = res?.session?.sessionId || res?.sessionId || res?.id;

      if (!newSessionId) {
        throw new Error("No sessionId returned from API");
      }

      setSessionId(newSessionId);
      await loadPage(newSessionId);
    } catch (err) {
      console.error("Generate team failed:", err);
      setError(err.message || "Failed to generate team");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPage = async (id, search = "") => {
    try {
      setError("");

      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await apiRequest(`/ai/team-builder/sessions/${id}/page${query}`);

      setPageData(data);
    } catch (err) {
      console.error("Load team page failed:", err);
      setError(err.message || "Failed to load team page");
    }
  };

  useEffect(() => {
    generateTeam();
  }, [generateTeam]);

  const getAvailabilityStyle = (availability = "") => {
    const value = availability.toLowerCase();
    if (value.includes("immediate")) return "bg-[#EAF8EE] text-[#22C55E]";
    if (value.includes("week")) return "bg-[#FEF3C7] text-[#D97706]";
    if (value.includes("busy")) return "bg-[#FEE2E2] text-[#DC2626]";
    return "bg-[#F3F4F6] text-[#6B7280]";
  };

  const getRankStyle = (rank = "") => {
    const value = rank.toLowerCase();
    if (value.includes("senior")) return "bg-[#EAF8EE] text-[#22C55E]";
    if (value.includes("mid")) return "bg-[#EEF2FF] text-[#4F46E5]";
    if (value.includes("junior")) return "bg-[#F3F4F6] text-[#6B7280]";
    return "bg-[#F3F4F6] text-[#6B7280]";
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);
    if (!sessionId) return;
    await loadPage(sessionId, value);
  };

  const handleRegenerate = async () => {
    if (!sessionId) return;
    try {
      setActionLoading(true);
      await apiRequest(`/ai/team-builder/sessions/${sessionId}/regenerate`, {
        method: "POST",
      });
      await loadPage(sessionId, searchQuery);
    } catch (err) {
      console.error("Regenerate failed:", err);
      setError(err.message || "Failed to regenerate team");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!sessionId) return;
    try {
      setActionLoading(true);
      await apiRequest(`/ai/team-builder/sessions/${sessionId}/reject`, {
        method: "PATCH",
      });
      await loadPage(sessionId, searchQuery);
    } catch (err) {
      console.error("Reject failed:", err);
      setError(err.message || "Failed to reject team");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    try {
      setActionLoading(true);
      await apiRequest(`/ai/team-builder/sessions/${sessionId}/finalize`, {
        method: "POST",
      });
      await loadPage(sessionId, searchQuery);
    } catch (err) {
      console.error("Approve failed:", err);
      setError(err.message || "Failed to approve team");
    } finally {
      setActionLoading(false);
    }
  };

  const recommendation = pageData?.recommendation || {};
  const suggestedLineup = pageData?.suggestedLineup || [];
  const recentActivity = pageData?.recentActivity || [];
  const whyThisTeamWorks = pageData?.whyThisTeamWorks || [];
  const projectReadiness = pageData?.projectReadiness || {};

  const isRejected = recommendation.status === "rejected";
  const isApproved = recommendation.status === "approved";

  const getActivityIcon = (group = "") => {
    const value = group.toLowerCase();
    if (value.includes("interview")) return CalendarDays;
    if (value.includes("applicant")) return Users;
    if (value.includes("project")) return Briefcase;
    if (value.includes("message")) return MessageSquare;
    return Briefcase;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F9]">
        <ClientSidebar />
        <main className="min-h-screen bg-[#F5F9F9] lg:ml-[230px]">
          <Header />
          <div className="pt-32 flex justify-center">
            <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center">
              <RefreshCw className="animate-spin text-[#0B6F6C] mx-auto mb-4" size={28} />
              <p className="text-[#111827] font-semibold">Generating AI team...</p>
              <p className="text-[#6B7280] text-sm mt-1">Please wait.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <ClientSidebar />

      <main className="min-h-screen bg-[#F5F9F9] ml-[230px]">
        <Header />

        <div className="pt-20 px-4 md:px-8 pb-10">
          <div className="max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                  {pageData?.pageTitle || "Auto Suggest Team"}
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  {pageData?.pageSubtitle ||
                    "AI-generated complete team recommendation for your project."}
                </p>
              </div>

              <div className="bg-white rounded-2xl px-4 py-2 border border-[#E5E7EB] flex items-center gap-3 w-full lg:w-[320px] min-w-0">
                <Search size={18} className="text-[#9CA3AF] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={pageData?.search?.placeholder || "Search team members..."}
                  className="flex-1 h-10 text-sm outline-none text-[#111827] placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-8 space-y-6">
                {!isRejected && (
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#0B6F6C]/10 shrink-0">
                          <Sparkles size={22} className="text-[#0B6F6C]" />
                        </div>

                        <div>
                          <h2 className="text-[18px] font-bold text-[#111827]">
                            {recommendation.title || "AI Team Recommendation"}
                          </h2>
                          <p className="text-[14px] text-[#6B7280] mt-2 leading-6 max-w-2xl">
                            {recommendation.description ||
                              "This complete team was selected based on your project requirements, role balance, experience levels, availability, and skill coverage across all critical delivery areas."}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#EAF8EE] text-[#22C55E] shrink-0">
                        {recommendation.matchLabel ||
                          `${recommendation.matchScore || 0}% Match Score`}
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
                        disabled={actionLoading}
                        className="mt-6 h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium inline-flex items-center gap-2 hover:bg-[#095c5a] transition disabled:opacity-60"
                      >
                        <RefreshCw size={16} />
                        Regenerate Team
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {suggestedLineup.map((member) => (
                          <div
                            key={member.developerId}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0B6F6C]/20 transition"
                          >
                            <div
                              onClick={() =>
                                navigate(`/developer/profile/${member.developerId}`)
                              }
                              className="flex items-start gap-3 min-w-0 cursor-pointer"
                            >
                              <div className="w-11 h-11 rounded-full bg-[#0B6F6C]/10 text-[#0B6F6C] flex items-center justify-center text-[13px] font-bold shrink-0">
                                {member.initials || "U"}
                              </div>

                              <div className="min-w-0">
                                <h3 className="text-[15px] font-semibold text-[#111827] break-words">
                                  {member.name}
                                </h3>
                                <p className="text-[13px] text-[#6B7280]">
                                  {member.role}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${getRankStyle(
                                      member.level
                                    )}`}
                                  >
                                    {member.level}
                                  </span>
                                  <span className="text-[12px] text-[#9CA3AF]">
                                    {member.experienceLabel}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${getAvailabilityStyle(
                                      member.availability
                                    )}`}
                                  >
                                    {member.availability}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:items-end">
                              <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                {(member.skills || []).map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!isApproved && (
                        <div className="flex flex-col md:flex-row gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                          <button
                            onClick={handleRegenerate}
                            disabled={actionLoading}
                            className="h-11 px-5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F8FAFC] transition disabled:opacity-60"
                          >
                            <RefreshCw size={16} />
                            Regenerate Team
                          </button>

                          <button
                            onClick={handleReject}
                            disabled={actionLoading}
                            className="h-11 px-5 rounded-xl border border-[#FECACA] bg-white text-[#DC2626] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#FEE2E2] transition disabled:opacity-60"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>

                          <button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#095c5a] transition sm:ml-auto disabled:opacity-60"
                          >
                            <CheckCircle2 size={16} />
                            Approve Team
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!isRejected && (
                  <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                    <h2 className="text-[16px] font-bold text-[#111827] mb-4">
                      Why This Team Works
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(whyThisTeamWorks.length
                        ? whyThisTeamWorks
                        : [
                            {
                              title: "Role Coverage",
                              description:
                                "All core roles are covered for this project.",
                              icon: Shield,
                            },
                            {
                              title: "Seniority Balance",
                              description:
                                "The team includes a balanced mix of experience levels.",
                              icon: Layers,
                            },
                            {
                              title: "Availability Match",
                              description:
                                "Recommended members match the project timeline.",
                              icon: Clock,
                            },
                            {
                              title: "Project Readiness",
                              description:
                                "The lineup supports a fast project kickoff.",
                              icon: CheckCircle2,
                            },
                          ]
                      ).map((item, index) => {
                        const Icon = item.icon || [Shield, Layers, Clock, CheckCircle2][index % 4];

                        return (
                          <div
                            key={index}
                            className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon size={16} className="text-[#0B6F6C]" />
                              <p className="text-[13px] font-semibold text-[#111827]">
                                {item.title || item.label}
                              </p>
                            </div>
                            <p className="text-[12px] text-[#6B7280] leading-5">
                              {item.description || item.text}
                            </p>
                          </div>
                        );
                      })}
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
                      {projectReadiness.percentage ?? 0}%
                    </span>
                    <span className="text-[12px] text-[#6B7280]">
                      {projectReadiness.statusLabel || "Pre-approval"}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-[#0B6F6C] transition-all duration-500"
                      style={{ width: `${projectReadiness.percentage || 0}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-[#6B7280] leading-5">
                    {projectReadiness.description ||
                      "Approving this team will bring readiness close to 100% and start onboarding workflows."}
                  </p>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[18px] font-bold text-[#111827] mb-5">
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-[#9CA3AF]">No recent activity.</p>
                    ) : (
                      recentActivity.map((item, index) => {
                        const Icon = getActivityIcon(item.group || item.title);
                        return (
                          <div
                            key={item.id || index}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition"
                          >
                            <div className="p-2 rounded-lg bg-[#0B6F6C]/10 shrink-0">
                              <Icon size={14} className="text-[#0B6F6C]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-[#0B6F6C] uppercase tracking-wide">
                                {item.group || item.title}
                              </p>
                              <p className="text-[13px] text-[#111827] mt-0.5">
                                {item.message || item.description}
                              </p>
                              <p className="text-[11px] text-[#9CA3AF] mt-1">
                                {item.time || item.createdAt}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
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
