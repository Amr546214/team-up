import { useMemo, useState } from "react";
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
} from "@heroicons/react/24/outline";

const emptyForm = {
  title: "",
  location: "",
  jobType: "Full-time",
  salary: "",
  applications: "",
  applicationsLabel: "",
  status: "Open",
};

function StatusBadge({ status }) {
  const isClosed = status === "Closed";

  return (
    <span
      className={`inline-flex min-w-[64px] items-center justify-center rounded-full px-[15px] h-[24px] text-[13.5px] font-medium ${
        isClosed
          ? "bg-[#e6e6e8] text-[#727b88]"
          : "bg-[#eaf7ed] text-[#58ab71]"
      }`}
    >
      {status}
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
  const [jobs, setJobs] = useState(() => {
    let saved = [];
    try {
      const raw = window.localStorage.getItem("client_jobs");
      const parsed = raw ? JSON.parse(raw) : [];
      saved = Array.isArray(parsed) ? parsed : [];
    } catch {
      saved = [];
    }
    return saved;
  });
  const [detailsJob, setDetailsJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  // Helper to save jobs to both state and localStorage
  function saveJobs(nextJobs) {
    setJobs(nextJobs);
    window.localStorage.setItem("client_jobs", JSON.stringify(nextJobs));
  }

  const stats = useMemo(
    () => [
      { id: 1, number: jobs.length, label: "Total Posts", type: "posts" },
      { id: 2, number: 0, label: "Applied Project", type: "applied" },
      { id: 3, number: jobs.reduce((sum, job) => sum + (job.applications || 0), 0), label: "Total Application", type: "applications" },
    ],
    [jobs]
  );

  const openEditModal = (job) => {
    setEditJob(job);
    setFormData({
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      salary: job.salary,
      applications: job.applications,
      applicationsLabel: job.applicationsLabel,
      status: job.status,
    });
  };

  const closeEditModal = () => {
    setEditJob(null);
    setFormData(emptyForm);
  };

  const handleDelete = (id) => {
    const nextJobs = jobs.filter((job) => job.id !== id);
    saveJobs(nextJobs);

    if (detailsJob?.id === id) setDetailsJob(null);
    if (editJob?.id === id) closeEditModal();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    const title = formData.title.trim();
    const location = formData.location.trim();

    if (!title || !location) return;

    const applicationsNumber = Number(formData.applications) || 0;

    const updatedJobs = jobs.map((job) =>
      job.id === editJob.id
        ? {
            ...job,
            title,
            location,
            jobType: formData.jobType,
            salary: formData.salary.trim(),
            applications: applicationsNumber,
            applicationsLabel:
              formData.applicationsLabel.trim() ||
              `${applicationsNumber} Applications`,
            status: formData.status,
          }
        : job
    );

    saveJobs(updatedJobs);

    const updatedSelected = updatedJobs.find((job) => job.id === editJob.id);
    if (detailsJob?.id === editJob.id) {
      setDetailsJob(updatedSelected);
    }

    closeEditModal();
  };

  return (
    <div className="min-h-screen bg-[#f5f9f9]">
      <main className="mx-auto w-full max-w-[1320px] px-[44px] pb-[34px] pt-[74px] max-[900px]:px-[18px] max-[900px]:pb-[30px] max-[900px]:pt-[86px] max-[640px]:px-[14px] max-[640px]:pb-[26px] max-[640px]:pt-[72px]">
        <section className="mb-[26px] flex items-start justify-between gap-[20px] max-[900px]:flex-col max-[900px]:items-start">
          <div className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                aria-label="Go back to profile"
                onClick={() => navigate("/client/profile")}
                className="grid h-[24px] w-[24px] place-items-center bg-transparent p-0 cursor-pointer"
              >
                <ArrowLeftIcon className="h-[21px] w-[21px] stroke-[2] text-[#1b1c1e]" />
              </button>

              <h1 className="m-0 text-[18px] font-bold leading-[1.2] text-[#141618] max-[640px]:text-[17px]">
                My Job Posts
              </h1>
            </div>

            <p className="m-0 ml-[34px] text-[15px] font-normal leading-[1.5] text-[#32363d] max-[640px]:ml-[32px] max-[640px]:text-[14px]">
              Manage and track your active and closed job listings.
            </p>
          </div>

          <button
            onClick={() => navigate("/client/job-post")}
            type="button"
            className="inline-flex h-[34px] min-w-[136px] items-center justify-center gap-[6px] rounded-[7px] bg-[#0e6b67] px-[16px] text-[13px] font-medium text-white max-[640px]:w-full"
          >
            <PlusIcon className="h-[14px] w-[14px] stroke-[2.2]" />
            Post New Job
          </button>
        </section>

        <section className="mb-[12px] flex items-center justify-center gap-[42px] rounded-[8px] bg-white px-[18px] py-[20px] max-[900px]:flex-col max-[900px]:gap-[16px]">
          {stats.map((item) => (
            <div
              key={item.id}
              className="flex min-h-[82px] w-[30%] items-center justify-between rounded-[6px] bg-[#eff9f8] px-[16px] py-[16px] max-[900px]:w-full"
            >
              <div className="flex flex-col items-start">
                <h3 className="m-0 mb-[8px] text-[19px] font-bold leading-[1] text-[#111827]">
                  {item.number}
                </h3>
                <p className="m-0 text-[14px] font-normal leading-[1.2] text-[#1f2937]">
                  {item.label}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <StatIcon type={item.type} />
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-[12px]">
          {jobs.length === 0 ? (
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
              const isClosed = job.status === "Closed";

              return (
                <article
                  key={job.id}
                  className={`rounded-[8px] px-[18px] py-[14px] ${
                    job.isNew
                      ? "border border-[#0e6b67] bg-[#ECFDFC]"
                      : isClosed
                        ? "bg-[#f9f9fa]"
                        : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-[22px] max-[900px]:flex-col max-[900px]:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="mb-[16px] flex items-center gap-[24px]">
                        <h2
                          className={`m-0 text-[15.5px] font-bold leading-[1.2] ${
                            isClosed ? "text-[#707887]" : "text-[#0e6b67]"
                          }`}
                        >
                          {job.title}
                        </h2>

                        <StatusBadge status={job.status} />
                      </div>

                      <div className="mb-[17px] flex flex-wrap items-center gap-[22px]">
                        <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                          <MapPinIcon className="h-[15px] w-[15px] stroke-[1.9] text-[#a0a8b6]" />
                          <span>{job.location}</span>
                        </div>

                        <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                          <ClockIcon className="h-[15px] w-[15px] stroke-[1.9] text-[#a0a8b6]" />
                          <span>{job.jobType}</span>
                        </div>

                        {!isClosed && job.salary && (
                          <div className="inline-flex items-center gap-[7px] text-[13px] font-normal text-[#a0a8b6]">
                            <CurrencyDollarIcon className="h-[15px] w-[15px] stroke-[1.9] text-[#a0a8b6]" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-[9px]">
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
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-[12px] max-[900px]:w-full max-[900px]:flex-wrap">
                      <button
                        onClick={() => setDetailsJob(job)}
                        type="button"
                        className={`h-[33px] min-w-[95px] rounded-[6px] px-[14px] text-[13px] font-medium ${
                          isClosed
                            ? "border border-transparent bg-[#f9f9fa] text-[#8f97a4]"
                            : "border border-[#e7efef] bg-white text-[#0e6b67]"
                        }`}
                      >
                        View Details
                      </button>

                      {!isClosed && (
                        <button
                          onClick={() => openEditModal(job)}
                          type="button"
                          className="h-[33px] min-w-[82px] rounded-[6px] bg-[#0e6b67] px-[16px] text-[13px] font-medium text-white"
                        >
                          Edit
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(job.id)}
                        type="button"
                        aria-label="Delete job"
                        className="grid h-[22px] w-[22px] place-items-center bg-transparent p-0"
                      >
                        <TrashIcon className="h-[18px] w-[18px] stroke-[1.8] text-[#b4bcc8]" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="mt-[14px] flex items-center justify-center gap-[10px]">
          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e7ebee] text-[#5d6775] transition hover:-translate-y-[1px] hover:bg-[#dde3e8]"
          >
            <ChevronLeftIcon className="h-[15px] w-[15px] stroke-[2.1] text-[#586372]" />
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e8ecef] text-[13px] font-medium text-[#5d6775] transition hover:-translate-y-[1px] hover:bg-[#dde3e8]"
          >
            1
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#dfe4e8] text-[13px] font-medium text-[#4d5866] transition hover:-translate-y-[1px]"
          >
            2
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e8ecef] text-[#5d6775] transition hover:-translate-y-[1px] hover:bg-[#dde3e8]"
          >
            <EllipsisHorizontalIcon className="h-[16px] w-[16px] stroke-[1.9] text-[#586372]" />
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e8ecef] text-[13px] font-medium text-[#5d6775] transition hover:-translate-y-[1px] hover:bg-[#dde3e8]"
          >
            6
          </button>

          <button
            type="button"
            className="grid h-[30px] w-[30px] place-items-center rounded-[6px] bg-[#e7ebee] text-[#5d6775] transition hover:-translate-y-[1px] hover:bg-[#dde3e8]"
          >
            <ChevronRightIcon className="h-[15px] w-[15px] stroke-[2.1] text-[#586372]" />
          </button>
        </section>
      </main>

      {editJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.22)] p-[20px]"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-[520px] rounded-[14px] bg-white p-[18px] shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
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
                Location
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Job Type
                <select
                  value={formData.jobType}
                  onChange={(e) =>
                    setFormData({ ...formData, jobType: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Salary
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Applications Count
                <input
                  type="number"
                  value={formData.applications}
                  onChange={(e) =>
                    setFormData({ ...formData, applications: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Applications Label
                <input
                  type="text"
                  value={formData.applicationsLabel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicationsLabel: e.target.value,
                    })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                />
              </label>

              <label className="grid gap-[6px] text-[13px] font-semibold text-[#24303d]">
                Status
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="h-[42px] rounded-[10px] border border-[#d8e0e4] px-[12px] text-[14px] text-[#1f2937] outline-none focus:border-[#0e6b67]"
                >
                  <option>Open</option>
                  <option>Closed</option>
                </select>
              </label>

              <div className="mt-[4px] flex items-center justify-end gap-[10px]">
                <button
                  onClick={closeEditModal}
                  type="button"
                  className="h-[40px] min-w-[92px] rounded-[10px] border border-[#d9e1e5] bg-white text-[14px] font-semibold text-[#445160]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-[40px] min-w-[120px] rounded-[10px] bg-[#0e6b67] text-[14px] font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.22)] p-[20px]"
          onClick={() => setDetailsJob(null)}
        >
          <div
            className="w-full max-w-[540px] rounded-[14px] bg-white p-[18px] shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
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
              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Title
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.title}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Status
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Location
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.location}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Job Type
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.jobType}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Salary
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.salary || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] border-b border-[#edf1f3] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Applications
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.applicationsLabel}
                </span>
              </div>

              <div className="flex items-center justify-between gap-[16px] py-[12px]">
                <span className="text-[14px] font-semibold text-[#556170]">
                  Posted
                </span>
                <span className="text-right text-[14px] font-medium text-[#171b21]">
                  {detailsJob.posted}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}