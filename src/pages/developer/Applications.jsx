import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DeveloperLayout from "../../layouts/DeveloperLayout";
import Header from "../../components/common/Header";
import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  RefreshCw,
  Send,
} from "lucide-react";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const STATUS_FILTERS = ["All", "Pending", "Accepted", "Rejected"];

const getToken = () =>
  localStorage.getItem("teamup_access_token") ||
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token");

const formatSubmittedDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBudget = (application) => {
  if (application.proposedBudgetLabel) return application.proposedBudgetLabel;

  if (application.proposedBudget != null) {
    const budget = Number(application.proposedBudget);
    if (!Number.isNaN(budget)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(budget);
    }
    return String(application.proposedBudget);
  }

  return "Not specified";
};

const normalizeApplication = (application, index) => ({
  id: application.applicationId || application.id || index + 1,
  title:
    application.projectName ||
    application.jobTitle ||
    application.title ||
    "Untitled Application",
  budget: formatBudget(application),
  status: (application.status || "pending").toLowerCase(),
  submittedDate: formatSubmittedDate(
    application.submittedAt ||
      application.submittedDate ||
      application.createdAt ||
      application.appliedAt
  ),
});

const getApplicationStatusClass = (status = "") => {
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

const getDetailsLink = (application) => `/developer/jobs/${application.id}`;

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      const response = await fetch(`${BASE_URL}/developer/dashboard`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error_message || result?.error || "Failed to load applications"
        );
      }

      const data = result?.data || result;
      const list = Array.isArray(data?.applications) ? data.applications : [];

      setApplications(list.map(normalizeApplication));
    } catch (err) {
      console.error("Applications Error:", err);
      setApplications([]);
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    if (selectedFilter === "All") return applications;

    return applications.filter(
      (application) => application.status === selectedFilter.toLowerCase()
    );
  }, [applications, selectedFilter]);

  return (
    <DeveloperLayout>
      <>
        <Header />

        <div className="min-h-screen bg-[#F5F9F9] pt-[96px] px-4 pb-10 md:px-6 lg:ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-6">
              <h1 className="text-[22px] sm:text-[24px] font-bold text-[#111827]">
                My Applications
              </h1>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Track your submitted proposals and their current status.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDFC] flex items-center justify-center">
                    <Send size={18} className="text-[#0B6F6C]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-[#6B7280]">Total applications</p>
                    <p className="text-[20px] font-semibold text-[#111827]">
                      {loading ? "..." : applications.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedFilter === filter
                          ? "bg-[#0B6F6C] text-white"
                          : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="bg-white rounded-2xl p-5 border border-[#E5E7EB] animate-pulse"
                  >
                    <div className="h-5 w-1/3 bg-[#F3F4F6] rounded mb-3" />
                    <div className="h-4 w-1/4 bg-[#F3F4F6] rounded mb-2" />
                    <div className="h-4 w-1/5 bg-[#F3F4F6] rounded" />
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="bg-white rounded-2xl p-8 border border-[#E5E7EB] text-center">
                <p className="text-[15px] text-[#DC2626] mb-4">{error}</p>
                <button
                  type="button"
                  onClick={fetchApplications}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                >
                  <RefreshCw size={16} />
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && filteredApplications.length === 0 && (
              <div className="bg-white rounded-2xl p-10 border border-[#E5E7EB] text-center">
                <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                  <FileText size={20} className="text-[#9CA3AF]" />
                </div>
                <h2 className="text-[16px] font-semibold text-[#111827] mb-2">
                  {applications.length === 0
                    ? "No applications yet"
                    : "No applications match this filter"}
                </h2>
                <p className="text-[14px] text-[#6B7280]">
                  {applications.length === 0
                    ? "When you apply to projects, your proposals will appear here."
                    : "Try selecting a different status filter."}
                </p>
              </div>
            )}

            {!loading && !error && filteredApplications.length > 0 && (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB]"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText size={18} className="text-[#22C55E] mt-1 shrink-0" />

                        <div className="min-w-0">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#111827] break-words">
                            {application.title}
                          </h3>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#6B7280]">
                            <span className="inline-flex items-center gap-1.5">
                              <CircleDollarSign size={14} />
                              Proposed Budget: {application.budget}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={14} />
                              Submitted: {application.submittedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span
                          className={`px-4 py-1 rounded-full text-[14px] font-medium capitalize ${getApplicationStatusClass(
                            application.status
                          )}`}
                        >
                          {application.status}
                        </span>

                        <Link
                          to={getDetailsLink(application)}
                          className="h-10 px-5 rounded-xl border border-[#E5E7EB] text-[#0B6F6C] text-sm font-medium hover:bg-[#F8FAFC] transition inline-flex items-center justify-center"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    </DeveloperLayout>
  );
}

export default Applications;
