import { useMemo, useState } from "react";
import {
  StarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import { applicantsFake } from "../../../data/applicantsFake";
const PAGE_SIZE = 3;

export default function Applicants() {
  const [applicants, setApplicants] = useState(applicantsFake.applicants);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllPages, setShowAllPages] = useState(false);

  const totalPages = Math.ceil(applicants.length / PAGE_SIZE);

  const visibleApplicants = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return applicants.slice(start, start + PAGE_SIZE);
  }, [applicants, currentPage]);

  const pendingCount = applicants.filter((item) => !item.decision).length;

  const handleAccept = (id) => {
    setApplicants((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, decision: "Accepted" } : item
      )
    );
  };

  const handleReject = (id) => {
    setApplicants((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, decision: "Rejected" } : item
      )
    );
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = showAllPages
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [1, 2, "...", 6];

  return (
    <div className="min-h-screen bg-[#f4fbfb] font-sans text-[#111827]">
      <main className="mx-auto w-full max-w-[900px] px-4 pb-10 pt-[120px] sm:px-6 md:px-8 lg:pt-[128px]">
        <section className="mb-[46px] flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold leading-none">
              Review Applicants
            </h1>
            <p className="mt-[8px] text-[16px] leading-none text-[#374151]">
              Showing {applicantsFake.totalPending} pending proposals for your
              open projects.
            </p>
          </div>

          <div className="hidden min-w-[112px] rounded-[7px] bg-[#f5f7fa] px-[13px] py-[10px] sm:block">
            <p className="text-[13px] font-bold leading-none">{pendingCount}</p>
            <p className="mt-[5px] text-[13px] leading-none">Total Pending</p>
          </div>
        </section>

        <section className="flex flex-col gap-[14px]">
          {visibleApplicants.map((applicant) => (
            <article
              key={applicant.id}
              className="rounded-[7px] bg-white px-[16px] py-[14px]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-[14px]">
                  <div className="h-[35px] w-[35px] shrink-0 rounded-full bg-[#d8d8d8]" />

                  <div>
                    <div className="flex flex-wrap items-center gap-[18px]">
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
                        {applicant.rank}
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
                        onClick={() => setSelectedApplicant(applicant)}
                        className="h-[32px] min-w-[88px] rounded-[5px] border border-[#e6eeee] bg-white px-[12px] text-[13px] font-medium text-[#0e6b67]"
                      >
                        View Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(applicant.id)}
                        className="h-[32px] min-w-[86px] rounded-[5px] bg-[#0e6b67] px-[18px] text-[13px] font-medium text-white"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(applicant.id)}
                        className="h-[32px] min-w-[86px] rounded-[5px] border border-[#e6eeee] bg-white px-[18px] text-[13px] font-medium text-red-500"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

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
                  {selectedApplicant.rank} Rank • {selectedApplicant.budget}
                </p>
              </div>
            </div>

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