import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";

function CompanyDashboard() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [stats] = useState([
    { id: 1, icon: Briefcase, label: "Active Jobs", value: 12, note: "+3 this month", color: "text-[#22C55E]" },
    { id: 2, icon: Users, label: "Total Applicants", value: 200, note: "+45 this week", color: "text-[#4F7CFF]" },
    { id: 3, icon: FileText, label: "Interviews", value: 8, note: "3 upcoming", color: "text-[#F97316]" },
    { id: 4, icon: TrendingUp, label: "Hire Rate", value: "68%", note: "+5% vs last month", color: "text-[#9333EA]" },
  ]);

  const [recentJobs] = useState([
    { id: 1, title: "Senior React Developer", applicants: 40, status: "active", posted: "5 days ago" },
    { id: 2, title: "UI/UX Designer", applicants: 10, status: "active", posted: "1 week ago" },
    { id: 3, title: "Backend Node.js", applicants: 20, status: "closed", posted: "2 weeks ago" },
  ]);

  const [upcomingInterviews] = useState([
    { id: 1, candidate: "Emma Wilson", job: "Senior Frontend Developer", date: "Feb 10, 2026", time: "10:00 AM" },
    { id: 2, candidate: "Ahmed Hassan", job: "UI/UX Designer", date: "Feb 12, 2026", time: "2:00 PM" },
  ]);

  const [recentApplicants] = useState([
    { id: 1, name: "Sara Ahmed", role: "Frontend Developer", status: "shortlisted", applied: "2 days ago" },
    { id: 2, name: "Omar Essam", role: "UI/UX Designer", status: "new", applied: "3 days ago" },
    { id: 3, name: "Hanan Muhammed", role: "Backend Developer", status: "rejected", applied: "5 days ago" },
    { id: 4, name: "Youssef Khaled", role: "Fullstack Developer", status: "shortlisted", applied: "1 week ago" },
  ]);

  /* =========================
     UI Logic
  ========================== */
  const getJobStatusStyle = (status) => {
    return status === "active"
      ? "bg-[#EAF8EE] text-[#22C55E]"
      : "bg-[#F3F4F6] text-[#6B7280]";
  };

  const getApplicantStatusStyle = (status) => {
    switch (status) {
      case "shortlisted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2 };
      case "new":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", icon: Clock };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                Company Dashboard
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Manage your jobs, applicants, and interviews.
              </p>
            </div>

            <button
              onClick={() => navigate("/company/post-job")}
              className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#095c5a] transition"
            >
              <Plus size={18} />
              Post New Job
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.id} className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
                  <div className="flex items-start justify-between">
                    <Icon size={22} className={stat.color} />
                    <span className="text-[12px] text-[#22C55E] font-medium">{stat.note}</span>
                  </div>
                  <p className="text-[28px] font-bold text-[#111827] mt-3">{stat.value}</p>
                  <p className="text-[14px] text-[#6B7280] mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-[#111827]">Recent Job Posts</h2>
                <button
                  onClick={() => navigate("/company/profile")}
                  className="text-sm text-[#0B6F6C] font-medium hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0B6F6C]/20 transition cursor-pointer"
                    onClick={() => navigate("/company/applicants")}
                  >
                    <div>
                      <h3 className="text-[15px] font-medium text-[#111827]">{job.title}</h3>
                      <p className="text-[13px] text-[#6B7280] mt-1">
                        {job.applicants} applicants · {job.posted}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${getJobStatusStyle(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-[#111827]">Upcoming Interviews</h2>
                <button
                  onClick={() => navigate("/company/interviews")}
                  className="text-sm text-[#0B6F6C] font-medium hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {upcomingInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
                  >
                    <h3 className="text-[15px] font-medium text-[#111827]">{interview.candidate}</h3>
                    <p className="text-[13px] text-[#6B7280] mt-1">{interview.job}</p>
                    <div className="flex items-center gap-3 mt-2 text-[13px] text-[#9CA3AF]">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={14} />
                        {interview.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {interview.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] xl:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-bold text-[#111827]">Recent Applicants</h2>
                <button
                  onClick={() => navigate("/company/applicants")}
                  className="text-sm text-[#0B6F6C] font-medium hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-4 text-[13px] font-medium text-[#6B7280]">Name</th>
                      <th className="text-left py-3 px-4 text-[13px] font-medium text-[#6B7280]">Applied For</th>
                      <th className="text-left py-3 px-4 text-[13px] font-medium text-[#6B7280]">Status</th>
                      <th className="text-left py-3 px-4 text-[13px] font-medium text-[#6B7280]">Applied</th>
                      <th className="text-right py-3 px-4 text-[13px] font-medium text-[#6B7280]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplicants.map((applicant) => {
                      const statusStyle = getApplicantStatusStyle(applicant.status);
                      const StatusIcon = statusStyle.icon;
                      return (
                        <tr key={applicant.id} className="border-b border-[#F3F4F6] last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#D9D9D9] shrink-0" />
                              <span className="text-[14px] font-medium text-[#111827]">{applicant.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[14px] text-[#6B7280]">{applicant.role}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium capitalize ${statusStyle.bg} ${statusStyle.text}`}>
                              <StatusIcon size={12} />
                              {applicant.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[13px] text-[#9CA3AF]">{applicant.applied}</td>
                          <td className="py-3 px-4 text-right">
                            <button className="text-[#0B6F6C] hover:underline text-[13px] font-medium flex items-center gap-1 ml-auto">
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyDashboard;
