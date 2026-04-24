import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Star,
  CalendarDays,
} from "lucide-react";

function Applicants() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  const [applicants] = useState([
    {
      id: 1,
      name: "Sara Ahmed",
      email: "sara@example.com",
      role: "Frontend Developer",
      job: "Senior React Developer",
      skills: ["React", "TypeScript", "Tailwind"],
      rating: 4.8,
      rank: "Gold",
      status: "shortlisted",
      appliedDate: "Feb 5, 2026",
      coverLetter: "I have 5+ years of experience in React development...",
    },
    {
      id: 2,
      name: "Omar Essam",
      email: "omar@example.com",
      role: "UI/UX Designer",
      job: "UI/UX Designer",
      skills: ["Figma", "Adobe XD", "Prototyping"],
      rating: 4.5,
      rank: "Silver",
      status: "new",
      appliedDate: "Feb 6, 2026",
      coverLetter: "Passionate designer with a focus on user-centered design...",
    },
    {
      id: 3,
      name: "Hanan Muhammed",
      email: "hanan@example.com",
      role: "Backend Developer",
      job: "Senior React Developer",
      skills: ["Node.js", "Python", "MongoDB"],
      rating: 4.9,
      rank: "Gold",
      status: "interviewed",
      appliedDate: "Feb 3, 2026",
      coverLetter: "Experienced backend developer specializing in scalable APIs...",
    },
    {
      id: 4,
      name: "Youssef Khaled",
      email: "youssef@example.com",
      role: "Fullstack Developer",
      job: "Backend Node.js",
      skills: ["React", "Node.js", "AWS"],
      rating: 4.7,
      rank: "Gold",
      status: "rejected",
      appliedDate: "Feb 1, 2026",
      coverLetter: "Fullstack developer with cloud infrastructure experience...",
    },
    {
      id: 5,
      name: "Eman Ali",
      email: "eman@example.com",
      role: "DevOps Engineer",
      job: "Backend Node.js",
      skills: ["Docker", "Kubernetes", "CI/CD"],
      rating: 4.4,
      rank: "Silver",
      status: "new",
      appliedDate: "Feb 7, 2026",
      coverLetter: "DevOps engineer with experience in cloud-native architectures...",
    },
  ]);

  const filters = ["All", "New", "Shortlisted", "Interviewed", "Rejected"];

  /* =========================
     UI Logic
  ========================== */
  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.job.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "All" || a.status.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case "shortlisted":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2, label: "Shortlisted" };
      case "new":
        return { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]", icon: Clock, label: "New" };
      case "interviewed":
        return { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", icon: CalendarDays, label: "Interviewed" };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle, label: "Rejected" };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock, label: status };
    }
  };

  const getRankBadge = (rank) => {
    return rank === "Gold" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-[#F3F4F6] text-[#6B7280]";
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>
            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">Applicants</h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Review and manage job applicants.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            {/* Left: List */}
            <div>
              {/* Search */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or job..."
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 px-4 rounded-xl border border-[#E5E7EB] flex items-center gap-2 text-sm text-[#6B7280] hover:bg-[#F8FAFC] transition"
                  >
                    <Filter size={16} />
                    Filter
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter}
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
                )}
              </div>

              <p className="text-sm text-[#6B7280] mb-3">{filteredApplicants.length} applicants</p>

              {/* Cards */}
              <div className="space-y-3">
                {filteredApplicants.map((applicant) => {
                  const statusStyle = getStatusStyle(applicant.status);
                  const StatusIcon = statusStyle.icon;

                  return (
                    <div
                      key={applicant.id}
                      onClick={() => setSelectedApplicant(applicant)}
                      className={`bg-white rounded-2xl p-5 border transition cursor-pointer ${
                        selectedApplicant?.id === applicant.id
                          ? "border-[#0B6F6C] bg-[#F0FBFA]"
                          : "border-[#E5E7EB] hover:border-[#0B6F6C]/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                          <div>
                            <h3 className="text-[15px] font-semibold text-[#111827]">{applicant.name}</h3>
                            <p className="text-[13px] text-[#6B7280]">{applicant.role}</p>
                            <p className="text-[12px] text-[#9CA3AF] mt-1">Applied for: {applicant.job}</p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon size={12} />
                          {statusStyle.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {applicant.skills.map((skill) => (
                          <span key={skill} className="px-2.5 py-0.5 rounded-lg bg-[#F3F4F6] text-[11px] text-[#4B5563] font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-[12px] text-[#9CA3AF]">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-[#EAB308]" />
                          {applicant.rating}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getRankBadge(applicant.rank)}`}>
                          {applicant.rank}
                        </span>
                        <span>{applicant.appliedDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detail Panel */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] h-fit sticky top-24">
              {selectedApplicant ? (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-[#D9D9D9]" />
                    <div>
                      <h2 className="text-[18px] font-bold text-[#111827]">{selectedApplicant.name}</h2>
                      <p className="text-[14px] text-[#6B7280]">{selectedApplicant.role}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-[14px]">
                    <div className="flex items-center gap-2 text-[#6B7280]">
                      <Mail size={16} />
                      {selectedApplicant.email}
                    </div>

                    <div>
                      <p className="font-medium text-[#111827] mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplicant.skills.map((skill) => (
                          <span key={skill} className="px-3 py-1 rounded-lg bg-[#F3F4F6] text-[13px] text-[#4B5563]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-[#111827] mb-2">Cover Letter</p>
                      <p className="text-[#6B7280] leading-6">{selectedApplicant.coverLetter}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <span className="flex items-center gap-1 text-[#6B7280]">
                        <Star size={16} className="text-[#EAB308]" />
                        {selectedApplicant.rating}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${getRankBadge(selectedApplicant.rank)}`}>
                        {selectedApplicant.rank}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 h-10 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition">
                      Schedule Interview
                    </button>
                    <button className="h-10 px-4 rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-[#F8FAFC] transition flex items-center gap-1">
                      <Eye size={14} />
                      Profile
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[#9CA3AF]">Select an applicant to view details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Applicants;
