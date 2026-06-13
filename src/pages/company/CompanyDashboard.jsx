import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import CompanySidebar from "../../components/common/CompanySidebar";
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Clock,
  XCircle,
  CalendarDays,
  ExternalLink,
  Star,
  UserPlus,
  Edit,
} from "lucide-react";

function CompanyDashboard() {
  const navigate = useNavigate();

  // 1. Quick Stats
  const [stats] = useState([
    {
      id: 1,
      icon: Briefcase,
      label: "Active Job Posts",
      value: 12,
      note: "+3 this month",
      color: "text-[#0B6F6C]",
      bgColor: "bg-[#0B6F6C]/10",
    },
    {
      id: 2,
      icon: Users,
      label: "Total Applicants",
      value: 200,
      note: "+45 this week",
      color: "text-[#4F7CFF]",
      bgColor: "bg-[#4F7CFF]/10",
    },
    {
      id: 3,
      icon: FileText,
      label: "Pending Interviews",
      value: 8,
      note: "3 upcoming",
      color: "text-[#F97316]",
      bgColor: "bg-[#F97316]/10",
    },
    {
      id: 4,
      icon: TrendingUp,
      label: "Hired Developers",
      value: 24,
      note: "+5 this month",
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10",
    },
  ]);

  // 2. Job Posts Overview
  const [jobPosts] = useState([
    {
      id: 1,
      title: "Senior React Developer",
      type: "Full-time",
      applicants: 40,
      status: "Open",
    },
    {
      id: 2,
      title: "UI/UX Designer",
      type: "Freelance",
      applicants: 12,
      status: "Open",
    },
    {
      id: 3,
      title: "Backend Node.js",
      type: "Part-time",
      applicants: 25,
      status: "Closed",
    },
  ]);

  // 4. Interviews Preview
  const [interviews] = useState([
    {
      id: 1,
      candidate: "Emma Wilson",
      job: "Senior Frontend Developer",
      date: "Feb 10, 2026",
      time: "10:00 AM",
      type: "Online",
      status: "Scheduled",
    },
    {
      id: 2,
      candidate: "Ahmed Hassan",
      job: "UI/UX Designer",
      date: "Feb 12, 2026",
      time: "2:00 PM",
      type: "Onsite",
      status: "Today",
    },
  ]);

  // 5. Recent Activity
  const [activity] = useState([
    {
      id: 1,
      text: "New applicant applied for Frontend Developer job",
      time: "2 hours ago",
      type: "new",
    },
    {
      id: 2,
      text: "Ahmed accepted interview invitation",
      time: "5 hours ago",
      type: "update",
    },
    {
      id: 3,
      text: "Job post Backend Developer was closed",
      time: "1 day ago",
      type: "system",
    },
    {
      id: 4,
      text: "New message from developer",
      time: "2 days ago",
      type: "message",
    },
  ]);

  // 6. Suggested Developers
  const [suggestedDevs] = useState([
    {
      id: 1,
      name: "Hanan Muhammed",
      skills: ["Node.js", "Python", "MongoDB"],
      rank: "Gold",
      rating: 4.9,
      availability: "Immediate",
    },
    {
      id: 2,
      name: "Youssef Khaled",
      skills: ["React", "Node.js", "AWS"],
      rank: "Gold",
      rating: 4.7,
      availability: "In 2 weeks",
    },
  ]);

  const [interviewResults, setInterviewResults] = useState([
    {
      id: 1,
      developerName: "Sarah Connor",
      jobTitle: "Senior DevOps Engineer",
      date: "Feb 05, 2026",
      status: "Pending",
      note: "",
    },
    {
      id: 2,
      developerName: "John Doe",
      jobTitle: "Fullstack Engineer",
      date: "Feb 04, 2026",
      status: "Accepted",
      note: "Excellent communication skills.",
    },
    {
      id: 3,
      developerName: "Alice Smith",
      jobTitle: "Data Scientist",
      date: "Feb 03, 2026",
      status: "Rejected",
      note: "",
    },
  ]);

  const handleMarkAccepted = (id) => {
    setInterviewResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Accepted" } : item
      )
    );
  };

  const handleMarkRejected = (id) => {
    setInterviewResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Rejected" } : item
      )
    );
  };

  const handleAddNotes = (id) => {
    const item = interviewResults.find((i) => i.id === id);
    const newNote = prompt("Enter note for this interview:", item ? item.note : "");
    if (newNote !== null) {
      setInterviewResults((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, note: newNote } : item
        )
      );
    }
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "open":
      case "scheduled":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "today":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      case "closed":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <CompanySidebar />

      <main className="min-h-screen bg-[#F5F9F9] ml-[230px]">
        <Header />

        <div className="pt-20 px-4 md:px-8 pb-10">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 1) Quick Stats Cards */}
              <div className="lg:col-span-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.id}
                        className="bg-white rounded-2xl p-5 border border-[#E5E7EB]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                            <Icon size={20} className={stat.color} />
                          </div>
                          <span className="text-[12px] text-[#22C55E] font-medium">
                            {stat.note}
                          </span>
                        </div>
                        <p className="text-[24px] font-bold text-[#111827]">
                          {stat.value}
                        </p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Left Column (Main content) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 2) Job Posts Overview Section */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[18px] font-bold text-[#111827]">
                      Job Posts Overview
                    </h2>
                    <button
                      onClick={() => navigate("/company/jobs")}
                      className="text-sm text-[#0B6F6C] font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {jobPosts.map((job) => (
                      <div
                        key={job.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0B6F6C]/20 transition"
                      >
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-[15px] font-bold text-[#111827]">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[13px] text-[#6B7280]">
                              {job.type}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]"></span>
                            <span className="text-[13px] text-[#6B7280]">
                              {job.applicants} Applicants
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-[12px] font-medium ${getStatusStyle(job.status)}`}
                          >
                            {job.status}
                          </span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigate("/company/applicants")}
                              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[12px] font-medium text-[#111827] hover:bg-gray-50"
                            >
                              View Applicants
                            </button>
                            <button className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50">
                              <Edit size={16} />
                            </button>
                            <button className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50">
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6) Interviews Hub Section */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[17px] font-bold text-[#111827]">
                      Interviews Hub
                    </h2>
                    <button
                      onClick={() => navigate("/company/interviews")}
                      className="text-[13px] text-[#0B6F6C] font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="upcomingInterviews" id="upcomingInterviews">
                    <h3 className="text-[15px] font-bold text-[#111827] mb-4">
                      Upcoming Interviews
                    </h3>
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(interview.status)}`}
                            >
                              {interview.status}
                            </span>
                          </div>
                          <h3 className="text-[14px] font-bold text-[#111827]">
                            {interview.candidate}
                          </h3>
                          <p className="text-[12px] text-[#6B7280] mb-3 truncate">
                            {interview.job}
                          </p>

                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                              <CalendarDays size={14} className="text-[#9CA3AF]" />
                              {interview.date}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                              <Clock size={14} className="text-[#9CA3AF]" />
                              {interview.time}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                            <button 
                              onClick={() => navigate("/company/interviews")}
                              className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#111827] hover:bg-gray-50"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => navigate("/company/interviews")}
                              className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#111827] hover:bg-gray-50"
                            >
                              Reschedule
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => navigate("/company/interviews")}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#D1D5DB] text-[#6B7280] text-[13px] font-medium hover:border-[#0B6F6C] hover:text-[#0B6F6C] transition flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Schedule Interview
                      </button>
                    </div>
                  </div>

                  {/* Interview Results Section */}
                  <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                    <h3 className="text-[15px] font-bold text-[#111827] mb-4">
                      Interview Results
                    </h3>
                    <div className="space-y-4">
                      {interviewResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[14px] font-bold text-[#111827]">
                              {result.developerName}
                            </h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                result.status === "Accepted"
                                  ? "bg-[#EAF8EE] text-[#22C55E]"
                                  : result.status === "Rejected"
                                  ? "bg-[#FDECEC] text-[#DC2626]"
                                  : "bg-[#FEF3C7] text-[#B45309]"
                              }`}
                            >
                              {result.status}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#6B7280] mb-1">
                            {result.jobTitle}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mb-3">
                            <CalendarDays size={14} className="text-[#9CA3AF]" />
                            {result.date}
                          </div>

                          {result.note && (
                            <div className="mb-3 p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[11px] text-[#4B5563] break-words">
                              <span className="font-semibold text-[#111827]">Note: </span>
                              {result.note}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-[#E5E7EB]">
                            <button
                              onClick={() => handleMarkAccepted(result.id)}
                              className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#22C55E] hover:bg-emerald-50 transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleMarkRejected(result.id)}
                              className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-red-600 hover:bg-red-50 transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAddNotes(result.id)}
                              className="flex-1 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#6B7280] hover:bg-gray-50 transition"
                            >
                              {result.note ? "Edit Note" : "Add Note"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 4) Suggested Developers Section */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[18px] font-bold text-[#111827] mb-6">
                    Suggested Developers
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {suggestedDevs.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#0B6F6C]/20 transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0B6F6C]/10 text-[#0B6F6C] flex items-center justify-center font-bold">
                              {dev.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-[14px] font-bold text-[#111827]">
                                {dev.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                                  {dev.rank}
                                </span>
                                <div className="flex items-center gap-0.5 text-[#F59E0B]">
                                  <Star size={12} fill="currentColor" />
                                  <span className="text-[11px] font-bold">
                                    {dev.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {dev.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] text-[#6B7280]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <p className="text-[12px] text-[#6B7280] mb-5 flex items-center gap-1.5">
                          <Clock size={14} className="text-[#9CA3AF]" />
                          Availability:
                          <span className="text-[#111827] font-medium">
                            {dev.availability}
                          </span>
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => navigate("/developer/profile")}
                            className="w-full py-2 rounded-xl border border-[#E5E7EB] bg-white text-[12px] font-semibold text-[#111827] hover:bg-gray-50"
                          >
                            View Profile
                          </button>
                          <button 
                            onClick={() => navigate("/company/interviews")}
                            className="w-full py-2 rounded-xl bg-[#0B6F6C] text-white text-[12px] font-semibold hover:bg-[#095c5a]"
                          >
                            Invite
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7) Recent Activity Section */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <h2 className="text-[17px] font-bold text-[#111827] mb-5">
                    Recent Activity
                  </h2>
                  <div className="space-y-5">
                    {activity.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="mt-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              item.type === "new"
                                ? "bg-[#0B6F6C]"
                                : item.type === "update"
                                ? "bg-[#4F7CFF]"
                                : "bg-[#D1D5DB]"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <p className="text-[13px] text-[#111827] leading-tight font-medium">
                            {item.text}
                          </p>
                          <p className="text-[11px] text-[#9CA3AF] mt-1">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CompanyDashboard;