import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const getToken = () => localStorage.getItem("teamup_access_token");

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
};

const normalizeJob = (data, id) => {
  const payload = data?.data || {};
  const header = payload.header || {};
  const cards = payload.summaryCards || {};
  const info = payload.jobInfo || {};

  return {
    id,
    title: header.title || info.title || "Untitled Job",
    status: header.status || payload.stats?.status || "active",
    statusLabel: header.statusLabel || payload.stats?.statusLabel,
    type: cards.type || info.typeLabel || info.type || "Full-Time",
    location: cards.location || info.location || info.workMode || "Remote",
    salary: cards.salary || info.salaryLabel || `$${info.budget || 0}/hr`,
    posted: header.postedAt
      ? new Date(header.postedAt).toLocaleDateString()
      : "Recently",
    deadline: cards.deadline
      ? new Date(cards.deadline).toLocaleDateString()
      : "No deadline",
    description: info.description || "No description available.",
    requirements: info.requirements || "No requirements available.",
    skills: info.skills || [],
    applicantsPreview: payload.applicants?.preview || [],
    applicantsTotal: payload.applicants?.total || payload.stats?.numberOfApplicants || 0,
  };
};

const normalizeApplicant = (item = {}) => ({
  id: item.applicationId,
  applicationId: item.applicationId,
  developerId: item.developerId,
  name: item.name || "Unknown Developer",
  role: item.title || "Developer",
  status: item.statusLabel || item.status || "pending",
  appliedDate: item.appliedAt
    ? new Date(item.appliedAt).toLocaleDateString()
    : "Recently",
  profilePicture: item.profilePicture,
});

function ClientJobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const jobData = await apiRequest(`/client/job/${id}`);
      const normalizedJob = normalizeJob(jobData, id);

      setJob(normalizedJob);
      setApplicants(normalizedJob.applicantsPreview.map(normalizeApplicant));
    } catch (err) {
      console.error("Failed to load job details:", err);
      setError(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleBuildTeam = async () => {
    try {
      const applicationIds = applicants
        .filter((app) => String(app.status).toLowerCase() === "accepted")
        .map((app) => app.applicationId)
        .filter(Boolean);

      const data = await apiRequest(`/client/job/${id}/build-team`, {
        method: "POST",
        body: JSON.stringify({
          applicationIds,
          closeJob: true,
          projectTitle: `${job?.title || "Project"} Team`,
        }),
      });

      alert(data?.message || "Team built successfully");
      fetchPageData();
    } catch (err) {
      console.error("Build team failed:", err);
      alert(err.message || "Failed to build team");
    }
  };

  const getJobStatusStyle = (status) =>
    String(status).toLowerCase() === "active"
      ? {
          bg: "bg-[#EAF8EE]",
          text: "text-[#22C55E]",
          dot: "bg-[#22C55E]",
          label: "Active",
        }
      : {
          bg: "bg-[#F3F4F6]",
          text: "text-[#6B7280]",
          dot: "bg-[#9CA3AF]",
          label: job?.statusLabel || "Closed",
        };

  const getApplicantStatusStyle = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "accepted":
        return {
          bg: "bg-[#EAF8EE]",
          text: "text-[#22C55E]",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          bg: "bg-[#FEE2E2]",
          text: "text-[#DC2626]",
          icon: XCircle,
        };
      case "interviewed":
        return {
          bg: "bg-[#FEF3C7]",
          text: "text-[#D97706]",
          icon: CalendarDays,
        };
      default:
        return {
          bg: "bg-[#EEF2FF]",
          text: "text-[#4F46E5]",
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9F9]">
        <Header />
        <div className="pt-28 text-center text-[#6B7280]">Loading job...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F5F9F9]">
        <Header />
        <div className="pt-28 text-center px-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchPageData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B6F6C] text-white rounded-lg"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getJobStatusStyle(job.status);

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                {job.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span
                  className={`h-8 px-4 rounded-full inline-flex items-center gap-2 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>

                <span className="text-sm text-[#6B7280]">
                  Posted {job.posted}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: DollarSign, label: "Salary", value: job.salary },
                  { icon: MapPin, label: "Location", value: job.location },
                  { icon: Clock, label: "Type", value: job.type },
                  {
                    icon: CalendarDays,
                    label: "Deadline",
                    value: job.deadline,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="text-center p-3 rounded-xl bg-[#F8FAFC]"
                    >
                      <Icon size={18} className="text-[#0B6F6C] mx-auto mb-2" />
                      <p className="text-[13px] text-[#9CA3AF]">
                        {item.label}
                      </p>
                      <p className="text-[14px] font-medium text-[#111827] mt-1">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <h2 className="text-[18px] font-bold text-[#111827] mb-3">
                Description
              </h2>
              <p className="text-[15px] leading-7 text-[#6B7280]">
                {job.description}
              </p>

              <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">
                Requirements
              </h2>
              <p className="text-[15px] leading-7 text-[#6B7280]">
                {job.requirements}
              </p>

              <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">
                Required Skills
              </h2>

              {job.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[14px] text-[#4B5563] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[15px] text-[#6B7280]">
                  No skills available.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] h-fit xl:sticky xl:top-24">
              <h2 className="text-[18px] font-bold text-[#111827] mb-4">
                <Users size={18} className="inline mr-2 text-[#0B6F6C]" />
                Applicants ({job.applicantsTotal || applicants.length})
              </h2>

              {applicants.length === 0 ? (
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-8 text-center text-sm text-[#6B7280]">
                  No applicants yet
                </div>
              ) : (
                <div className="space-y-3">
                  {applicants.map((applicant) => {
                    const style = getApplicantStatusStyle(applicant.status);
                    const StatusIcon = style.icon;

                    return (
                      <div
                        key={applicant.applicationId}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#D9D9D9] shrink-0 overflow-hidden">
                              {applicant.profilePicture && (
                                <img
                                  src={applicant.profilePicture}
                                  alt={applicant.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[14px] font-medium text-[#111827] truncate">
                                {applicant.name}
                              </p>
                              <p className="text-[12px] text-[#6B7280] truncate">
                                {applicant.role}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize shrink-0 ${style.bg} ${style.text}`}
                          >
                            <StatusIcon size={10} />
                            {applicant.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[12px] text-[#9CA3AF]">
                          <span>{applicant.appliedDate}</span>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/client/developers/${applicant.developerId}/profile`
                              )
                            }
                            className="text-[#0B6F6C] font-medium flex items-center gap-1 hover:underline"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate(`/client/job/${id}/applicants`)}
                className="w-full mt-4 h-10 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
              >
                View Applicants
              </button>

              <button
                type="button"
                onClick={handleBuildTeam}
                className="w-full mt-3 h-10 rounded-xl border border-[#0B6F6C] text-[#0B6F6C] text-sm font-medium hover:bg-[#C7E8E5]/40 transition"
              >
                Build Team From Applicants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientJobDetails;