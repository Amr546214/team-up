import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Star,
  CalendarDays,
} from "lucide-react";

const API_BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const getToken = () =>
  localStorage.getItem("teamup_access_token") ||
  localStorage.getItem("company_access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token");

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.log("APPLICANTS API ERROR:", data);
    throw new Error(
      data?.message || data?.error_message || data?.error || "Request failed"
    );
  }

  return data;
};

function Applicants() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    skills: "All",
    rank: "All",
    experience: "All",
    status: "All",
  });

  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    interviewType: "technical",
    mode: "remote",
    scheduledAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const skillsOptions = ["All", "React", "Node.js", "UI/UX", "Python", "AWS"];
  const rankOptions = ["All", "Gold", "Silver", "Bronze"];
  const experienceOptions = ["All", "Junior", "Mid", "Senior"];
  const statusOptions = ["All", "New", "Interviewing", "Pending", "Accepted", "Rejected"];

  const normalizeApplicant = (item, index) => {
    const developer = item.developer || item.user || item.applicant || item;
    const profile = developer.profile || {};

    return {
      id:
        item.applicationId ||
        item.id ||
        item._id ||
        `${developer.userId || "app"}-${index}`,
      applicationId: item.applicationId || item.id || item._id,
      developerId: developer.userId || developer.id || developer._id || item.developerId,
      name: developer.name || developer.fullName || item.name || "Unknown Applicant",
      email: developer.email || item.email || "No email",
      role: profile.title || developer.title || item.role || "Developer",
      job: item.jobTitle || item.job?.title || item.job || "Job",
      skills: developer.skills || item.skills || [],
      rating: developer.rankScore || developer.rating || item.rating || 0,
      rank: developer.rank || item.rank || "Bronze",
      status: item.status || "new",
      experience:
        developer.experienceLevel ||
        developer.experience ||
        item.experience ||
        "Not specified",
      appliedDate: item.submittedAt
        ? new Date(item.submittedAt).toLocaleDateString()
        : item.appliedDate || "Recently",
      coverLetter: item.coverLetter || item.proposal || "No cover letter provided.",
      cvLink: developer.cv || developer.cvLink || profile.cv || item.cvLink || "",
      portfolioLink:
        developer.portfolio ||
        developer.portfolioLink ||
        profile.portfolio ||
        item.portfolioLink ||
        "",
    };
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", "10");
      params.append("search", searchQuery.trim());
      params.append("skills", selectedFilters.skills === "All" ? "" : selectedFilters.skills);
      params.append("rank", selectedFilters.rank === "All" ? "" : selectedFilters.rank);
      params.append(
        "experience",
        selectedFilters.experience === "All"
          ? "all"
          : selectedFilters.experience.toLowerCase()
      );
      params.append(
        "status",
        selectedFilters.status === "All"
          ? "all"
          : selectedFilters.status.toLowerCase()
      );

      const res = await apiRequest(`/company/applicants?${params.toString()}`);
      const payload = res?.data || res;

      const list =
        payload?.applicants ||
        payload?.applications ||
        payload?.items ||
        payload?.results ||
        [];

      const normalized = Array.isArray(list)
        ? list.map((item, index) => normalizeApplicant(item, index))
        : [];

      setApplicants(normalized);
      setSelectedApplicant((prev) => prev || normalized[0] || null);
      setTotalPages(payload?.pagination?.totalPages || payload?.totalPages || 1);
    } catch (err) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchApplicants();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleReject = async (applicant) => {
    if (!applicant.applicationId) {
      alert("Missing application id");
      return;
    }

    try {
      await apiRequest(`/company/applications/${applicant.applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });

      setApplicants((prev) =>
        prev.map((a) =>
          a.applicationId === applicant.applicationId
            ? { ...a, status: "rejected" }
            : a
        )
      );

      setSelectedApplicant((prev) =>
        prev?.applicationId === applicant.applicationId
          ? { ...prev, status: "rejected" }
          : prev
      );
    } catch (err) {
      alert(err.message || "Failed to reject applicant");
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplicant) return;
    if (!interviewForm.scheduledAt) {
      alert("Please select date and time");
      return;
    }

    try {
      await apiRequest("/company/interviews", {
        method: "POST",
        body: JSON.stringify({
          candidateName: selectedApplicant.name,
          jobTitle: selectedApplicant.job,
          interviewType: interviewForm.interviewType,
          mode: interviewForm.mode,
          scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        }),
      });

      setShowModal(false);
      alert("Interview scheduled successfully");
    } catch (err) {
      alert(err.message || "Failed to schedule interview");
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "shortlisted":
      case "accepted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2, label: "Accepted" };
      case "new":
      case "pending":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", icon: Clock, label: status === "pending" ? "Pending" : "New" };
      case "interviewed":
      case "interviewing":
        return { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: CalendarDays, label: "Interviewing" };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle, label: "Rejected" };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock, label: status || "Unknown" };
    }
  };

  const getRankBadge = (rank) =>
    rank === "Gold"
      ? "bg-[#FEF3C7] text-[#D97706]"
      : "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                Applicants List
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Review and manage job applicants.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-5 flex flex-wrap gap-3">
            <select
              value={selectedFilters.skills}
              onChange={(e) =>
                setSelectedFilters((prev) => ({ ...prev, skills: e.target.value }))
              }
              className="h-10 px-3 rounded-xl border border-[#D1D5DB] text-sm outline-none focus:border-[#0B6F6C]"
            >
              {skillsOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={selectedFilters.rank}
              onChange={(e) =>
                setSelectedFilters((prev) => ({ ...prev, rank: e.target.value }))
              }
              className="h-10 px-3 rounded-xl border border-[#D1D5DB] text-sm outline-none focus:border-[#0B6F6C]"
            >
              {rankOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={selectedFilters.experience}
              onChange={(e) =>
                setSelectedFilters((prev) => ({ ...prev, experience: e.target.value }))
              }
              className="h-10 px-3 rounded-xl border border-[#D1D5DB] text-sm outline-none focus:border-[#0B6F6C]"
            >
              {experienceOptions.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>

            <select
              value={selectedFilters.status}
              onChange={(e) =>
                setSelectedFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="h-10 px-3 rounded-xl border border-[#D1D5DB] text-sm outline-none focus:border-[#0B6F6C]"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <div>
              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-5 flex items-center gap-3">
                <Search size={18} className="text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or job..."
                  className="flex-1 h-11 px-3 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                />
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center text-[#6B7280]">
                    Loading applicants...
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center text-[#6B7280]">
                    No applicants found.
                  </div>
                ) : (
                  applicants.map((applicant) => {
                    const statusStyle = getStatusStyle(applicant.status);
                    const StatusIcon = statusStyle.icon;
                    const cvUrl = applicant.cvLink || applicant.portfolioLink;

                    return (
                      <div
                        key={applicant.id}
                        onClick={() => setSelectedApplicant(applicant)}
                        className={`bg-white rounded-2xl p-5 border transition cursor-pointer ${
                          selectedApplicant?.id === applicant.id
                            ? "border-[#0B6F6C] bg-[#F0FBFA]"
                            : "border-[#E5E7EB] hover:border-[#0B6F6C]/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                            <div>
                              <h3 className="text-[15px] font-semibold text-[#111827]">
                                {applicant.name}
                              </h3>
                              <p className="text-[13px] text-[#6B7280]">{applicant.role}</p>
                              <p className="text-[12px] text-[#9CA3AF] mt-1">
                                Applied for: {applicant.job}
                              </p>
                              <p className="text-[12px] text-[#6B7280]">
                                Experience: {applicant.experience}
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon size={12} />
                            {statusStyle.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {applicant.skills.map((skill, index) => (
                            <span key={`${skill}-${index}`} className="px-2.5 py-0.5 rounded-lg bg-[#F3F4F6] text-[11px] text-[#4B5563] font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-[12px] text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-[#EAB308]" />
                            {applicant.rating}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getRankBadge(applicant.rank)}`}>
                            {applicant.rank}
                          </span>
                          <span>{applicant.appliedDate}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {cvUrl ? (
                            <a
                              href={cvUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 rounded-lg bg-[#F3F4F6] text-sm text-[#4B5563] font-medium hover:bg-[#E5E7EB] transition"
                            >
                              CV / Portfolio
                            </a>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-lg bg-[#F3F4F6] text-sm text-[#9CA3AF] font-medium cursor-not-allowed"
                            >
                              CV / Portfolio
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplicant(applicant);
                              setShowModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                          >
                            Schedule Interview
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(applicant);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#DC2626] text-sm font-medium hover:bg-[#FEE2E2] transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-[#6B7280]">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] h-fit sticky top-24">
              {selectedApplicant ? (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-[#D9D9D9]" />
                    <div>
                      <h2 className="text-[18px] font-bold text-[#111827]">
                        {selectedApplicant.name}
                      </h2>
                      <p className="text-[14px] text-[#6B7280]">
                        {selectedApplicant.role}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-[14px]">
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Mail size={16} />
                      {selectedApplicant.email}
                    </div>

                    <div>
                      <p className="font-medium text-[#111827] mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplicant.skills.map((skill, index) => (
                          <span key={`${skill}-${index}`} className="px-3 py-1 rounded-lg bg-[#F3F4F6] text-[13px] text-[#4B5563]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-[#111827] mb-2">Cover Letter</p>
                      <p className="text-[#6B7280] leading-6">
                        {selectedApplicant.coverLetter}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <span className="flex items-center gap-1 text-[#6B7280]">
                        <Star size={16} className="text-[#EAB308]" />
                        {selectedApplicant.rating}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${getRankBadge(selectedApplicant.rank)}`}>
                        {selectedApplicant.rank}
                      </span>
                      <span>Experience: {selectedApplicant.experience}</span>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        className="flex-1 h-10 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                        onClick={() => setShowModal(true)}
                      >
                        Schedule Interview
                      </button>
                      <button className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-[#F8FAFC] transition flex items-center gap-1">
                        <Eye size={14} />
                        Profile
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[#9CA3AF]">Select an applicant to view details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-[18px] font-bold text-[#111827] mb-4">
              Schedule Interview
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#374151] mb-2">
                  Interview Type
                </label>
                <select
                  value={interviewForm.interviewType}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      interviewType: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-3 text-sm outline-none"
                >
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#374151] mb-2">
                  Mode
                </label>
                <select
                  value={interviewForm.mode}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      mode: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-3 text-sm outline-none"
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#374151] mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interviewForm.scheduledAt}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({
                      ...prev,
                      scheduledAt: e.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F8FAFC]"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                onClick={handleScheduleInterview}
                className="px-6 py-2 rounded-xl bg-[#0B6F6C] text-white hover:bg-[#095c5a]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applicants;