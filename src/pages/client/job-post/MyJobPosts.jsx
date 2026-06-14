import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const BASE_URL =
  "https://team-up-backend-production-6c43.up.railway.app";

const emptyForm = {
  title: "",
  location: "",
  jobType: "full-time",
  salary: "",
  applications: "",
  applicationsLabel: "",
  status: "active",
  budget: "",
  priority: "medium",
};

function getToken() {
  return (
    localStorage.getItem("teamup_access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
}

function StatusBadge({ status }) {
  const label =
    status === "closed" || status === "Closed" ? "Closed" : "Open";

  const isClosed = label === "Closed";

  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-[15px] h-[24px] text-[13.5px] font-medium ${
        isClosed
          ? "bg-[#e6e6e8] text-[#727b88]"
          : "bg-[#eaf7ed] text-[#58ab71]"
      }`}
    >
      {label}
    </span>
  );
}

function StatIcon({ type }) {
  if (type === "posts") {
    return (
      <BriefcaseIcon className="h-[20px] w-[20px] text-[#18936f] stroke-[2]" />
    );
  }

  if (type === "applied") {
    return (
      <CheckCircleIcon className="h-[20px] w-[20px] text-[#18936f] stroke-[2]" />
    );
  }

  return <UsersIcon className="h-[20px] w-[20px] text-[#18936f] stroke-[2]" />;
}

export default function MyJobPosts() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [statsData, setStatsData] = useState({
    totalPosts: 0,
    appliedProject: 0,
    totalApplication: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });

  const [detailsJob, setDetailsJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const normalizeJob = (job, index = 0) => {
    const status = job.status || "active";

    return {
      id: job.jobId || job.id || index + 1,
      jobId: job.jobId || job.id || index + 1,
      title: job.title || "Untitled Job",
      location: job.location || job.workMode || "Remote",
      jobType: job.workType || job.jobType || "full-time",
      salary:
        job.salary ||
        job.budgetLabel ||
        (job.budget ? `$${job.budget}` : ""),
      budget: job.budget || "",
      priority: job.priority || "medium",
      applications: Number(job.applicantsCount || job.applications || 0),
      applicationsLabel: `${Number(
        job.applicantsCount || job.applications || 0
      )} Applications`,
      status,
      statusLabel:
        job.statusLabel ||
        (status === "closed" || status === "Closed" ? "Closed" : "Open"),
      posted: job.posted || job.createdAt || "",
      actions: job.actions || {
        canViewDetails: true,
        canEdit: status !== "closed",
        canDelete: true,
      },
      isNew: false,
      raw: job,
    };
  };

  const fetchMyJobs = async (page = 1) => {
    setIsLoading(true);

    try {
      const token = getToken();

      const response = await fetch(
        `${BASE_URL}/project/jobs/my-posts?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("My Jobs API Error:", response.status, result);
        setJobs([]);
        return;
      }

      const data = result?.data || result || {};
      const items = Array.isArray(data.items) ? data.items : [];

      setJobs(items.map(normalizeJob));

      setStatsData({
        totalPosts: data.stats?.totalPosts ?? items.length ?? 0,
        appliedProject: data.stats?.appliedProject ?? 0,
        totalApplication: data.stats?.totalApplication ?? 0,
      });

      setPagination({
        page: data.pagination?.page ?? page,
        limit: data.pagination?.limit ?? 10,
        totalCount: data.pagination?.totalCount ?? items.length,
        totalPages: data.pagination?.totalPages ?? 1,
      });
    } catch (error) {
      console.error("Failed to load my jobs:", error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => [
      {
        id: 1,
        number: statsData.totalPosts,
        label: "Total Posts",
        type: "posts",
      },
      {
        id: 2,
        number: statsData.appliedProject,
        label: "Applied Project",
        type: "applied",
      },
      {
        id: 3,
        number: statsData.totalApplication,
        label: "Total Application",
        type: "applications",
      },
    ],
    [statsData]
  );

  const openEditModal = (job) => {
    setEditJob(job);
    setFormData({
      title: job.title || "",
      location: job.location || "",
      jobType: job.jobType || "full-time",
      salary: job.salary || "",
      applications: job.applications || 0,
      applicationsLabel: job.applicationsLabel || "",
      status: job.status || "active",
      budget: job.budget || "",
      priority: job.priority || "medium",
    });
  };

  const closeEditModal = () => {
    setEditJob(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job post?"
    );

    if (!confirmDelete) return;

    setIsDeleting(jobId);

    try {
      const token = getToken();

      const response = await fetch(
        `${BASE_URL}/project/jobs/my-posts/${jobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete job");
      }

      if (detailsJob?.jobId === jobId) setDetailsJob(null);
      if (editJob?.jobId === jobId) closeEditModal();

      await fetchMyJobs(pagination.page);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to delete job");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const title = formData.title.trim();

    if (!title) return;

    setIsSaving(true);

    try {
      const token = getToken();

      const response = await fetch(
        `${BASE_URL}/project/jobs/my-posts/${editJob.jobId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            budget: Number(formData.budget || formData.salary || 0),
            priority: formData.priority,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Failed to update job");
      }

      closeEditModal();
      await fetchMyJobs(pagination.page);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = async (job) => {
    try {
      const token = getToken();

      const response = await fetch(
        `${BASE_URL}/project/jobs/my-posts/${job.jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Details error:", response.status, result);
        setDetailsJob(job);
        return;
      }

      const data = result?.data || result || {};
      setDetailsJob(normalizeJob({ ...job.raw, ...data, jobId: job.jobId }));
    } catch (error) {
      console.error(error);
      setDetailsJob(job);
    }
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    fetchMyJobs(nextPage);
  };

  return (
    <div className="min-h-screen bg-[#f5f9f9] overflow-x-hidden">
      <main className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-[44px] pb-[26px] sm:pb-[30px] lg:pb-[34px] pt-[72px] sm:pt-[86px] lg:pt-[74px]">
        <section className="mb-[26px] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-[20px]">
          <div className="flex flex-col gap-[2px] min-w-0">
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                aria-label="Go back to profile"
                onClick={() => navigate("/client/profile")}
                className="grid h-[24px] w-[24px] place-items-center bg-transparent p-0 cursor-pointer shrink-0"
              >
                <ArrowLeftIcon className="h-[21px] w-[21px] stroke-[2] text-[#1b1c1e]" />
              </button>

              <h1 className="m-0 text-[17px] sm:text-[18px] font-bold leading-[1.2] text-[#141618]">
                My Job Posts
              </h1>
            </div>

            <p className="m-0 ml-[34px] text-[14px] sm:text-[15px] font-normal leading-[1.5] text-[#32363d]">
              Manage and track your active and closed job listings.
            </p>
          </div>

          <button
            onClick={() => navigate("/client/job-post")}
            type="button"
            className="inline-flex h-[38px] sm:h-[34px] w-full sm:w-auto min-w-[136px] items-center justify-center gap-[6px] rounded-[7px] bg-[#0e6b67] px-[16px] text-[13px] font-medium text-white"
          >
            <PlusIcon className="h-[14px] w-[14px] stroke-[2.2]" />
            Post New Job
          </button>
        </section>

        <section className="mb-[12px] grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-[42px] rounded-[8px] bg-white px-4 lg:px-[18px] py-[20px]">
          {stats.map((item) => (
            <div
              key={item.id}
              className="flex min-h-[82px] w-full items-center justify-between rounded-[6px] bg-[#eff9f8] px-[16px] py-[16px]"
            >
              <div className="flex flex-col items-start">
                <h3 className="m-0 mb-[8px] text-[19px] font-bold leading-[1] text-[#111827]">
                  {item.number}
                </h3>
                <p className="m-0 text-[14px] font-normal leading-[1.2] text-[#1f2937]">
                  {item.label}
                </p>
              </div>

              <StatIcon type={item.type} />
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-[12px]">
          {isLoading ? (
            <div className="rounded-[8px] bg-white px-[18px] py-[60px] text-center">
              <ArrowPathIcon className="mx-auto h-8 w-8 animate-spin text-[#0e6b67]" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-[8px] bg-white px-[18px] py-[40px] text-center">
              <BriefcaseIcon className="mx-auto h-[48px] w-[48px] text-[#a0a8b6] stroke-[1.5] mb-4" />
              <h3 className="text-[16px] font-semibold text-[#374151] mb-2">
                No job posts yet
              </h3>
              <p className="text-[14px] text-[#6b7280]">
                Create your first job post to start finding the perfect team.
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const isClosed =
                job.status === "closed" || job.statusLabel === "Closed";

              return (
                <article
                  key={job.jobId}
                  className={`rounded-[8px] px-4 sm:px-[18px] py-[14px] ${
                    job.isNew
                      ? "border border-[#0e6b67] bg-[#ECFDFC]"
                      : isClosed
                        ? "bg-[#f9f9fa]"
                        : "bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 lg:gap-[22px]">
                    <div className="min-w-0 flex-1">
                      <div className="mb-[16px] flex flex-wrap items-center gap-3 sm:gap-[24px]">
                        <h2
                          className={`m-0 text-[15.5px] font-bold leading-[1.2] break-words ${
                            isClosed ? "text-[#707887]" : "text-[#0e6b67]"
                          }`}
                        >
                          {job.title}
                        </h2>

                        <StatusBadge status={job.statusLabel} />
                      </div>

                      <div className="mb-[17px] flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-[22px]">
                        <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                          <MapPinIcon className="h-[15px] w-[15px] shrink-0 stroke-[1.9] text-[#a0a8b6]" />
                          <span className="break-words">{job.location}</span>
                        </div>

                        <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                          <ClockIcon className="h-[15px] w-[15px] shrink-0 stroke-[1.9] text-[#a0a8b6]" />
                          <span>{job.jobType}</span>
                        </div>

                        {!isClosed && job.salary && (
                          <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                            <CurrencyDollarIcon className="h-[15px] w-[15px] shrink-0 stroke-[1.9] text-[#a0a8b6]" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-[9px]">
                        <div className="relative h-[22px] w-[31px] shrink-0">
                          <span className="absolute left-0 top-0 h-[22px] w-[22px] rounded-full border border-[#b6bcc6] bg-[#d9d9db]" />
                          <span className="absolute left-[10px] top-0 h-[22px] w-[22px] rounded-full border border-[#b6bcc6] bg-[#d9d9db]" />
                        </div>

                        <span
                          className={`text-[13px] ${
                            isClosed
                              ? "font-normal text-[#b1b7c2]"
                              : "font-medium text-[#2a313c]"
                          }`}
                        >
                          {job.applicationsLabel}
                        </span>

                        {job.posted && (
                          <>
                            <span className="text-[13px] font-normal text-[#9ca5b3]">
                              •
                            </span>

                            <span
                              className={`text-[13px] font-normal ${
                                isClosed ? "text-[#b1b7c2]" : "text-[#9ca5b3]"
                              }`}
                            >
                              {job.posted}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full lg:w-auto flex-col sm:flex-row lg:flex-nowrap items-stretch sm:items-center gap-[12px]">
                      {job.actions?.canViewDetails !== false && (
                        <button
                          onClick={() => handleViewDetails(job)}
                          type="button"
                          className={`h-[36px] sm:h-[33px] min-w-[95px] rounded-[6px] px-[14px] text-[13px] font-medium ${
                            isClosed
                              ? "border border-transparent bg-[#f9f9fa] text-[#8f97a4]"
                              : "border border-[#e7efef] bg-white text-[#0e6b67]"
                          }`}
                        >
                          View Details
                        </button>
                      )}

                      {!isClosed && job.actions?.canEdit !== false && (
                        <button
                          onClick={() => openEditModal(job)}
                          type="button"
                          className="h-[36px] sm:h-[33px] min-w-[82px] rounded-[6px] bg-[#0e6b67] px-[16px] text-[13px] font-medium text-white"
                        >
                          Edit
                        </button>
                      )}

                      {job.actions?.canDelete !== false && (
                        <button
                          onClick={() => handleDelete(job.jobId)}
                          type="button"
                          disabled={isDeleting === job.jobId}
                          aria-label="Delete job"
                          className="grid h-[36px] sm:h-[22px] w-full sm:w-[22px] place-items-center rounded-[6px] sm:rounded-none bg-[#f8fafb] sm:bg-transparent p-0 disabled:opacity-50"
                        >
                          {isDeleting === job.jobId ? (
                            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin text-[#b4bcc8]" />
                          ) : (
                            <TrashIcon className="h-[18px] w-[18px] stroke-[1.8] text-[#b4bcc8]" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="mt-[14px] flex flex-wrap items-center justify-center gap-[10px]">
          <button
            type="button"
            onClick={() => goToPage(pagination.page - 1)}
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e7ebee] text-[#5d6775]"
          >
            <ChevronLeftIcon className="h-[15px] w-[15px] stroke-[2.1] text-[#586372]" />
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#dfe4e8] text-[13px] font-medium text-[#4d5866]"
          >
            {pagination.page}
          </button>

          {pagination.totalPages > 1 && (
            <>
              <button
                type="button"
                className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e8ecef] text-[#5d6775]"
              >
                <EllipsisHorizontalIcon className="h-[16px] w-[16px] stroke-[1.9] text-[#586372]" />
              </button>

              <button
                type="button"
                onClick={() => goToPage(pagination.totalPages)}
                className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e8ecef] text-[13px] font-medium text-[#5d6775]"
              >
                {pagination.totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => goToPage(pagination.page + 1)}
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e7ebee] text-[#5d6775]"
          >
            <ChevronRightIcon className="h-[15px] w-[15px] stroke-[2.1] text-[#586372]" />
          </button>
        </section>
      </main>

      {editJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.22)] p-4 sm:p-[20px]"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[14px] bg-white p-[18px] shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[14px] flex items-center justify-between">
              <h3 className="m-0 text-[18px] font-bold text-[#13171c]">
                Edit Job
              </h3>

              <button
                onClick={closeEditModal}
                type="button"
                className="grid h-[34px] w-[34px] place-items-center rounded-[8px] bg-[#f3f6f7]"
              >
                <XMarkIcon className="h-[18px] w-[18px] stroke-[2.2] text-[#5f6977]" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid gap-[12px]">
              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Job Title
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Budget
                <input
                  type="number"
                  value={formData.budget || formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Priority
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>

              <div className="mt-[4px] flex flex-col sm:flex-row sm:items-center sm:justify-end gap-[10px]">
                <button
                  onClick={closeEditModal}
                  type="button"
                  className="h-[40px] w-full sm:w-auto min-w-[92px] rounded-[10px] border border-[#d9e1e5] bg-white text-[14px] font-semibold text-[#445160]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-[40px] w-full sm:w-auto min-w-[120px] rounded-[10px] bg-[#0e6b67] text-[14px] font-semibold text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.22)] p-4 sm:p-[20px]"
          onClick={() => setDetailsJob(null)}
        >
          <div
            className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-[14px] bg-white p-[18px] shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[14px] flex items-center justify-between">
              <h3 className="m-0 text-[18px] font-bold text-[#13171c]">
                Job Details
              </h3>

              <button
                onClick={() => setDetailsJob(null)}
                type="button"
                className="grid h-[34px] w-[34px] place-items-center rounded-[8px] bg-[#f3f6f7]"
              >
                <XMarkIcon className="h-[18px] w-[18px] stroke-[2.2] text-[#5f6977]" />
              </button>
            </div>

            <div className="grid gap-[10px]">
              {[
                ["Title", detailsJob.title],
                ["Status", detailsJob.statusLabel],
                ["Location", detailsJob.location],
                ["Job Type", detailsJob.jobType],
                ["Salary", detailsJob.salary || "—"],
                ["Applications", detailsJob.applicationsLabel],
                ["Posted", detailsJob.posted || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-[16px] border-b border-[#edf1f3] py-[12px]"
                >
                  <span className="text-[14px] font-semibold text-[#556170]">
                    {label}
                  </span>
                  <span className="sm:text-right text-[14px] font-medium text-[#171b21] break-words">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}