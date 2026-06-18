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
  Loader2,
} from "lucide-react";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

function getToken() {
  return (
    localStorage.getItem("teamup_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

function ClientJobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeJob = (data) => {
    return {
      id: data.jobId || data.id,
      title: data.title || "Untitled Job",
      status: data.status || "active",
      type: data.workType || data.jobType || "Full-Time",
      workMode: data.workMode || data.location || "Remote",
      location: data.location || data.workMode || "Remote",
      salary: data.budgetLabel || (data.budget ? `$${data.budget}` : "N/A"),
      posted: data.posted || (data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "Recently"),
      deadline: data.deadline || "Not specified",
      description: data.description || "",
      requirements: data.requirements || "No specific requirements listed.",
      skills: Array.isArray(data.skills) ? data.skills : [],
    };
  };

  const normalizeApplicant = (item) => ({
    id: item.applicationId,
    name: item.developer?.name || "Unknown Developer",
    role: item.developer?.profile?.title || "Developer",
    status: item.status || "new",
    rating: item.developer?.rankScore || 0,
    appliedDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recently",
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch Job Details
      const jobRes = await fetch(`${BASE_URL}/project/jobs/my-posts/${id}`, { headers });
      const jobResult = await jobRes.json().catch(() => null);

      if (!jobRes.ok) {
        throw new Error(jobResult?.message || "Failed to load job details");
      }
      setJob(normalizeJob(jobResult?.data || jobResult));

      // Fetch Applicants (limited to 5 for summary)
      const appRes = await fetch(`${BASE_URL}/project/jobs/my-posts/${id}/applicants?limit=5`, { headers });
      const appResult = await appRes.json().catch(() => null);

      if (appRes.ok) {
        const appList = appResult?.data?.applicants || appResult?.applicants || [];
        setApplicants(appList.map(normalizeApplicant));
      }
    } catch (err) {
      console.error("Error fetching job details:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  /* =========================
     UI Logic
  ========================== */
  const getJobStatusStyle = (status) => {
    const s = status?.toLowerCase();
    return s === "active" || s === "open"
      ? { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", dot: "bg-[#22C55E]", label: "Active" }
      : { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", dot: "bg-[#9CA3AF]", label: "Closed" };
  };

  const getApplicantStatusStyle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "shortlisted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2 };
      case "pending":
      case "new":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", icon: Clock };
      case "interviewed":
        return { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: CalendarDays };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle };
      case "accepted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2 };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F9F9] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-[#0B6F6C] animate-spin" />
          <p className="text-[#6B7280] font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F9F9] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 max-w-md text-center">
            <h3 className="font-bold text-lg mb-1">Failed to load job</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-6 h-11 bg-[#0B6F6C] text-white rounded-xl font-medium hover:bg-[#095c5a] transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F5F9F9] flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-[#6B7280] font-medium">Job not found</p>
          <button
            onClick={() => navigate("/client/my-jobs")}
            className="px-6 h-11 bg-[#0B6F6C] text-white rounded-xl font-medium"
          >
            Back to My Jobs
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
          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div className="flex-1">
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className={`h-8 px-4 rounded-full inline-flex items-center gap-2 text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {statusStyle.label}
                </span>
                <span className="text-sm text-[#6B7280]">Posted {job.posted}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Job Info */}
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: DollarSign, label: "Salary", value: job.salary },
                    { icon: MapPin, label: "Location", value: job.location },
                    { icon: Clock, label: "Type", value: job.type },
                    { icon: CalendarDays, label: "Deadline", value: job.deadline },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="text-center p-3 rounded-xl bg-[#F8FAFC]">
                        <Icon size={18} className="text-[#0B6F6C] mx-auto mb-2" />
                        <p className="text-[13px] text-[#9CA3AF]">{item.label}</p>
                        <p className="text-[14px] font-medium text-[#111827] mt-1">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                <h2 className="text-[18px] font-bold text-[#111827] mb-3">Description</h2>
                <p className="text-[15px] leading-7 text-[#6B7280] whitespace-pre-wrap">{job.description}</p>

                <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">Requirements</h2>
                <p className="text-[15px] leading-7 text-[#6B7280] whitespace-pre-wrap">{job.requirements}</p>

                {job.skills && job.skills.length > 0 && (
                  <>
                    <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span key={skill} className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[14px] text-[#4B5563] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Applicants */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] h-fit sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[#111827]">
                  <Users size={18} className="inline mr-2 text-[#0B6F6C]" />
                  {/* Applicants ({applicantsLoading ? "..." : totalApplicants}) */}
                </h2>
              </div>

              <div className="space-y-3">
                {applicants.length > 0 ? (
                  applicants.map((applicant) => {
                    const aStyle = getApplicantStatusStyle(applicant.status);
                    const StatusIcon = aStyle.icon;

                    return (
                      <div key={applicant.id} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#D9D9D9] shrink-0" />
                            <div>
                              <p className="text-[14px] font-medium text-[#111827]">{applicant.name}</p>
                              <p className="text-[12px] text-[#6B7280]">{applicant.role}</p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${aStyle.bg} ${aStyle.text}`}>
                            <StatusIcon size={10} />
                            {applicant.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-[12px] text-[#9CA3AF]">
                          <span>{applicant.appliedDate}</span>
                          <button
                            onClick={() => navigate(`/client/job/${id}/applicants`)}
                            className="text-[#0B6F6C] font-medium flex items-center gap-1 hover:underline"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <Users size={32} className="mx-auto text-[#D1D5DB] mb-2" />
                    <p className="text-sm text-[#9CA3AF]">No applicants yet</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/client/job/${id}/applicants`)}
                className="w-full mt-4 h-10 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition disabled:opacity-60 disabled:cursor-not-allowed"
                // disabled={applicantsLoading}
              >
                View Applicants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientJobDetails;
