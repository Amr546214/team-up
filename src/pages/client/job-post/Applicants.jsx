import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";
const PAGE_SIZE = 3;

const getToken = () => localStorage.getItem("teamup_access_token");

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.log("API ERROR RESPONSE:", data);
    throw new Error(
      data?.message || data?.error_message || data?.error || "Request failed"
    );
  }

  return data;
};

const normalizeApplicant = (item = {}) => ({
  id: item.applicationId,
  applicationId: item.applicationId,
  status: item.status,
  decision:
    item.status === "accepted"
      ? "Accepted"
      : item.status === "rejected"
      ? "Rejected"
      : null,
  name: item.developer?.name || "Unknown Developer",
  userId: item.developer?.userId,
  rank: item.developer?.rank || "No Rank",
  rankScore: item.developer?.rankScore || 0,
  budget: `$${item.proposedBudget || 0}`,
  skills: item.developer?.skills || [],
  email: item.developer?.email || "",
  title: item.developer?.profile?.title || "",
  badge:
    item.developer?.rank === "Gold"
      ? "Top Rated"
      : item.status === "pending"
      ? "New"
      : "",
  badgeType: item.developer?.rank === "Gold" ? "top" : "new",
  actions: item.actions || {},
});

export default function Applicants() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllPages, setShowAllPages] = useState(false);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPagesFromApi, setTotalPagesFromApi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(totalPagesFromApi || 1, 1);

  const visibleApplicants = useMemo(() => {
    return applicants;
  }, [applicants]);

  const fetchApplicants = async (page = currentPage) => {
    if (!jobId) {
      setError("Missing jobId in route");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        `/project/jobs/my-posts/${jobId}/applicants?page=${page}&limit=${PAGE_SIZE}`
      );

      const payload = data?.data || {};
      const list = payload?.applicants || [];

      setApplicants(list.map(normalizeApplicant));
      setTotalPending(payload?.stats?.totalPending || 0);
      setTotalPagesFromApi(payload?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load applicants:", err);
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, jobId]);

  const handleDecision = async (applicant, status) => {
    try {
      await apiRequest(
        `/project/jobs/my-posts/${jobId}/applicants/${applicant.applicationId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setApplicants((prev) =>
        prev.map((item) =>
          item.applicationId === applicant.applicationId
            ? {
                ...item,
                status,
                decision: status === "accepted" ? "Accepted" : "Rejected",
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update applicant:", err);
      alert(err.message || "Failed to update applicant");
    }
  };

  const handleAccept = (applicant) => {
    handleDecision(applicant, "accepted");
  };

  const handleReject = (applicant) => {
    handleDecision(applicant, "rejected");
  };

  const handleViewProfile = (applicant) => {
    if (applicant.actions?.canViewProfile && applicant.userId) {
      navigate(`/developer/profile/${applicant.userId}`);
      return;
    }

    setSelectedApplicant(applicant);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = showAllPages
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : totalPages <= 4
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [1, 2, "...", totalPages];

  return (
    <div className="min-h-screen bg-[#f4fbfb] font-sans text-[#111827]">
      <main className="mx-auto w-full max-w-[900px] px-4 pb-10 pt-[100px] sm:px-6 md:px-8 lg:pt-[120px]">
        <section className="mb-[34px] flex flex-col gap-4 sm:mb-[46px] sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[20px] font-bold leading-tight sm:text-[22px]">
              Review Applicants
            </h1>

            <p className="mt-[8px] text-[15px] leading-6 text-[#374151] sm:text-[16px]">
              Showing {totalPending} pending proposals for your open projects.
            </p>
          </div>

          <div className="w-fit min-w-[112px] rounded-[7px] bg-[#f5f7fa] px-[13px] py-[10px]">
            <p className="text-[13px] font-bold leading-none">{totalPending}</p>
            <p className="mt-[5px] text-[13px] leading-none">Total Pending</p>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-[8px] bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[7px] bg-white px-5 py-8 text-center text-sm text-[#6b7280]">
            Loading applicants...
          </div>
        ) : (
          <section className="flex flex-col gap-[14px]">
            {visibleApplicants.map((applicant) => (
              <article
                key={applicant.applicationId}
                className="rounded-[7px] bg-white px-[16px] py-[14px]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-[14px]">
                    <div className="h-[35px] w-[35px] shrink-0 rounded-full bg-[#d8d8d8]" />

                    <div>
                      <div className="flex flex-wrap items-center gap-[12px] sm:gap-[18px]">
                        <h2 className="text-[13px] font-bold">
                          {applicant.name}
                        </h2>

                        {applicant.badge && (
                          <span
                            className={`min-w-[80px] rounded-[5px] px-[10px] py-[4px] text-center text-[12px] leading-none ${
                              applicant.badgeType === "new"
                                ? "bg-[#dbeafe] text-[#2563eb]"
                                : "bg-[#fff6d9] text-[#d89100]"
                            }`}
                          >
                            {applicant.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-[8px] flex flex-wrap items-center gap-[12px] text-[11px] text-[#6b7280]">
                        <span className="flex items-center gap-[4px]">
                          {applicant.rank === "No Rank" ? (
                            <StarIcon className="h-[15px] w-[15px] fill-[#d1d5db] text-[#d1d5db]" />
                          ) : (
                            <SolidStarIcon className="h-[15px] w-[15px] text-[#facc15]" />
                          )}

                          {applicant.rankScore || applicant.rank}
                          {applicant.rank !== "No Rank" && " Rank"}
                        </span>

                        <span>{applicant.budget} Budget</span>
                      </div>

                      <div className="mt-[14px] flex flex-wrap gap-[13px]">
                        {applicant.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-[5px] bg-[#f0f2f5] px-[10px] py-[4px] text-[12px] text-[#4b5563]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-[10px] md:justify-end">
                    {applicant.decision ? (
                      <span
                        className={`min-w-[92px] rounded-[6px] px-[15px] py-[9px] text-center text-[13px] font-medium ${
                          applicant.decision === "Accepted"
                            ? "bg-[#e0f7ec] text-[#0e6b67]"
                            : "bg-[#fee2e2] text-[#dc2626]"
                        }`}
                      >
                        {applicant.decision}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={!applicant.actions?.canViewProfile}
                          onClick={() => handleViewProfile(applicant)}
                          className="h-[32px] min-w-[88px] rounded-[5px] border border-[#e6eeee] bg-white px-[12px] text-[13px] font-medium text-[#0e6b67] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          View Profile
                        </button>

                        <button
                          type="button"
                          disabled={!applicant.actions?.canAccept}
                          onClick={() => handleAccept(applicant)}
                          className="h-[32px] min-w-[86px] rounded-[5px] bg-[#0e6b67] px-[18px] text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Accept
                        </button>

                        <button
                          type="button"
                          disabled={!applicant.actions?.canReject}
                          onClick={() => handleReject(applicant)}
                          className="h-[32px] min-w-[86px] rounded-[5px] border border-[#e6eeee] bg-white px-[18px] text-[13px] font-medium text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}

            {!loading && visibleApplicants.length === 0 && (
              <div className="rounded-[7px] bg-white px-5 py-8 text-center text-sm text-[#6b7280]">
                No applicants found.
              </div>
            )}
          </section>
        )}

        <section className="mt-[38px] flex items-center justify-center gap-[11px]">
          <PageButton onClick={() => goToPage(currentPage - 1)}>
            <ChevronLeftIcon className="h-[15px] w-[15px]" />
          </PageButton>

          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <PageButton key="dots" onClick={() => setShowAllPages(true)}>
                <EllipsisHorizontalIcon className="h-[16px] w-[16px]" />
              </PageButton>
            ) : (
              <PageButton
                key={`${page}-${index}`}
                active={currentPage === page}
                onClick={() => goToPage(page)}
              >
                {page}
              </PageButton>
            )
          )}

          <PageButton onClick={() => goToPage(currentPage + 1)}>
            <ChevronRightIcon className="h-[15px] w-[15px]" />
          </PageButton>
        </section>
      </main>

      {selectedApplicant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelectedApplicant(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[18px] font-bold">Applicant Profile</h3>
              <button type="button" onClick={() => setSelectedApplicant(null)}>
                <XMarkIcon className="h-5 w-5 text-[#6b7280]" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-[48px] w-[48px] rounded-full bg-[#d8d8d8]" />
              <div>
                <p className="font-bold">{selectedApplicant.name}</p>
                <p className="text-sm text-[#6b7280]">
                  {selectedApplicant.title || "Developer"}
                </p>
                <p className="text-sm text-[#6b7280]">
                  {selectedApplicant.rank} Rank • {selectedApplicant.budget}
                </p>
              </div>
            </div>

            {selectedApplicant.email && (
              <p className="mt-4 text-sm text-[#6b7280]">
                {selectedApplicant.email}
              </p>
            )}

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold">Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedApplicant.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-[5px] bg-[#f0f2f5] px-3 py-1 text-sm text-[#4b5563]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedApplicant(null)}
              className="mt-5 h-[38px] w-full rounded-[8px] bg-[#0e6b67] text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PageButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-[30px] w-[30px] place-items-center rounded-[6px] text-[13px] transition hover:-translate-y-[1px] ${
        active ? "bg-white text-[#111827]" : "bg-[#e8ecef] text-[#4b5563]"
      }`}
    >
      {children}
    </button>
  );
}