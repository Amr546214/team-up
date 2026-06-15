import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import CompanySidebar from "../../components/common/CompanySidebar";
import { Plus, Pencil, XCircle, Users, Briefcase } from "lucide-react";

const INITIAL_JOBS = [
  {
    id: 1,
    title: "Senior React Developer",
    type: "Full-time",
    applicantsCount: 40,
    status: "Open",
    datePosted: "Jan 15, 2026",
  },
  {
    id: 2,
    title: "UI/UX Designer",
    type: "Freelance",
    applicantsCount: 12,
    status: "Open",
    datePosted: "Jan 22, 2026",
  },
  {
    id: 3,
    title: "Backend Node.js",
    type: "Part-time",
    applicantsCount: 25,
    status: "Closed",
    datePosted: "Dec 8, 2025",
  },
  {
    id: 4,
    title: "DevOps Engineer",
    type: "Full-time",
    applicantsCount: 18,
    status: "Open",
    datePosted: "Feb 1, 2026",
  },
  {
    id: 5,
    title: "Mobile Developer (Flutter)",
    type: "Freelance",
    applicantsCount: 9,
    status: "Open",
    datePosted: "Feb 4, 2026",
  },
  {
    id: 6,
    title: "Product Manager",
    type: "Full-time",
    applicantsCount: 31,
    status: "Closed",
    datePosted: "Nov 20, 2025",
  },
];

function JobManagement() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(INITIAL_JOBS);

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "closed":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const handleCloseJob = (id) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: "Closed" } : job
      )
    );
  };

  const handleEdit = (id) => {
    navigate(`/company/post-job?edit=${id}`);
  };

  const totalActiveJobs = jobs.filter((job) => job.status === "Open").length;
  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicantsCount, 0);

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <CompanySidebar />

      <main className="min-h-screen bg-[#F5F9F9] ml-[230px]">
        <Header />

        <div className="pt-20 px-4 md:px-8 pb-10">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                  Company Job Posts
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1">
                  View and manage all posted jobs in one place.
                </p>
              </div>

              <button
                onClick={() => navigate("/company/post-job")}
                className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#095c5a] transition shrink-0"
              >
                <Plus size={18} />
                Post New Job
              </button>
            </div>

            {/* Summary Cards */}
            <div className="flex flex-wrap gap-4 mb-6">
  {/* Total Active Jobs */}
  <div className="w-[260px] bg-white rounded-2xl p-5 border border-[#E5E7EB]">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-[#0B6F6C]/10">
        <Briefcase size={20} className="text-[#0B6F6C]" />
      </div>
    </div>

    <p className="text-[24px] font-bold text-[#111827]">
      {totalActiveJobs}
    </p>

    <p className="text-[14px] text-[#6B7280] mt-1">
      Total Active Jobs
    </p>
  </div>

  {/* Total Applicants */}
  <div className="w-[260px] bg-white rounded-2xl p-5 border border-[#E5E7EB]">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 rounded-lg bg-[#4F7CFF]/10">
        <Users size={20} className="text-[#4F7CFF]" />
      </div>
    </div>

    <p className="text-[24px] font-bold text-[#111827]">
      {totalApplicants}
    </p>

    <p className="text-[14px] text-[#6B7280] mt-1">
      Total Applicants
    </p>
  </div>
</div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Job Title
                      </th>
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Job Type
                      </th>
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Applicants Count
                      </th>
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Date Posted
                      </th>
                      <th className="text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {jobs.map((job) => {
                      const isClosed = job.status === "Closed";

                      return (
                        <tr
                          key={job.id}
                          className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8FAFC]/60 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="text-[14px] font-semibold text-[#111827]">
                              {job.title}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[14px] text-[#6B7280]">
                              {job.type}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[14px] text-[#111827] font-medium">
                              {job.applicantsCount}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-[12px] font-medium ${getStatusStyle(job.status)}`}
                            >
                              {job.status}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[14px] text-[#6B7280]">
                              {job.datePosted}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() =>
                                  navigate(`/company/applicants?jobId=${job.id}`)
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B6F6C] text-white text-[12px] font-medium hover:bg-[#095c5a] transition"
                              >
                                <Users size={14} />
                                View Applicants
                              </button>

                              <button
                                onClick={() => handleEdit(job.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#6B7280] hover:bg-[#F8FAFC] hover:text-[#111827] transition"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              {!isClosed && (
                                <button
                                  onClick={() => handleCloseJob(job.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition"
                                >
                                  <XCircle size={14} />
                                  Close Job
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {jobs.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-[14px] text-[#9CA3AF]">
                    No job posts yet. Create your first job to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6">
              <span className="text-sm text-[#6B7280]">Page 1 of 1</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobManagement;
