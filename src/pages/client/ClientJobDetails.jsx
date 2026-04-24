import { useState } from "react";
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
} from "lucide-react";

function ClientJobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [job] = useState({
    id: id || "1",
    title: "Senior React Developer",
    status: "active",
    type: "Full-Time",
    workMode: "Remote",
    location: "Remote",
    salary: "$80K - $120K",
    posted: "5 days ago",
    deadline: "Mar 15, 2026",
    description:
      "We are looking for a senior React developer to lead our frontend team. You will be responsible for building scalable, maintainable UI components, mentoring junior developers, and collaborating closely with the design and backend teams.",
    requirements: "5+ years of React experience, TypeScript, state management (Redux/Zustand), testing frameworks.",
    skills: ["React", "TypeScript", "Tailwind CSS", "Redux", "Jest"],
  });

  const [applicants] = useState([
    { id: 1, name: "Sara Ahmed", role: "Frontend Developer", status: "shortlisted", rating: 4.8, appliedDate: "Feb 5, 2026" },
    { id: 2, name: "Omar Essam", role: "Frontend Developer", status: "new", rating: 4.5, appliedDate: "Feb 6, 2026" },
    { id: 3, name: "Hanan Muhammed", role: "Fullstack Developer", status: "interviewed", rating: 4.9, appliedDate: "Feb 3, 2026" },
    { id: 4, name: "Youssef Khaled", role: "Frontend Developer", status: "rejected", rating: 4.2, appliedDate: "Feb 1, 2026" },
  ]);

  /* =========================
     UI Logic
  ========================== */
  const getJobStatusStyle = (status) => {
    return status === "active"
      ? { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", dot: "bg-[#22C55E]", label: "Active" }
      : { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", dot: "bg-[#9CA3AF]", label: "Closed" };
  };

  const getApplicantStatusStyle = (status) => {
    switch (status) {
      case "shortlisted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2 };
      case "new":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", icon: Clock };
      case "interviewed":
        return { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: CalendarDays };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock };
    }
  };

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
                <p className="text-[15px] leading-7 text-[#6B7280]">{job.description}</p>

                <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">Requirements</h2>
                <p className="text-[15px] leading-7 text-[#6B7280]">{job.requirements}</p>

                <h2 className="text-[18px] font-bold text-[#111827] mt-6 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-4 py-2 rounded-xl bg-[#F3F4F6] text-[14px] text-[#4B5563] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Applicants */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] h-fit sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-bold text-[#111827]">
                  <Users size={18} className="inline mr-2 text-[#0B6F6C]" />
                  Applicants ({applicants.length})
                </h2>
              </div>

              <div className="space-y-3">
                {applicants.map((applicant) => {
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
                        <button className="text-[#0B6F6C] font-medium flex items-center gap-1 hover:underline">
                          <Eye size={12} />
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => navigate("/client/build-team")}
                className="w-full mt-4 h-10 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
              >
                Build Team from Applicants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientJobDetails;
