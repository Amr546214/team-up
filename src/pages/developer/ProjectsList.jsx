import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeveloperLayout from "../../layouts/DeveloperLayout";
import Header from "../../components/common/Header";
import {
  Search,
  Filter,
  ChevronDown,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";

function ProjectsList() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [projects] = useState([
    {
      id: 1,
      title: "E-commerce Platform Redesign",
      company: "RetailX",
      location: "Remote",
      budget: "$5K - $8K",
      duration: "3 months",
      skills: ["React", "Node.js", "MongoDB"],
      status: "open",
      applicants: 12,
      postedAgo: "2 days ago",
      description: "Complete redesign of the e-commerce platform with modern React frontend.",
    },
    {
      id: 2,
      title: "AI Learning Platform",
      company: "Edtech Startup",
      location: "Hybrid - Cairo",
      budget: "$8K - $12K",
      duration: "4 months",
      skills: ["Python", "React", "TensorFlow"],
      status: "open",
      applicants: 8,
      postedAgo: "5 days ago",
      description: "Build an AI-powered learning platform with personalized recommendations.",
    },
    {
      id: 3,
      title: "Healthcare Booking App",
      company: "MedConnect",
      location: "Remote",
      budget: "$4K - $6K",
      duration: "2 months",
      skills: ["React Native", "Node.js", "PostgreSQL"],
      status: "open",
      applicants: 15,
      postedAgo: "1 week ago",
      description: "Mobile app for booking healthcare appointments with real-time scheduling.",
    },
    {
      id: 4,
      title: "SaaS Dashboard Redesign",
      company: "CloudMetrics",
      location: "Remote",
      budget: "$3K - $5K",
      duration: "6 weeks",
      skills: ["React", "Tailwind", "D3.js"],
      status: "applied",
      applicants: 20,
      postedAgo: "3 days ago",
      description: "Redesign analytics dashboard with interactive charts and data visualization.",
    },
    {
      id: 5,
      title: "FinTech Mobile Wallet",
      company: "PayFlow",
      location: "Onsite - Alexandria",
      budget: "$10K - $15K",
      duration: "5 months",
      skills: ["Flutter", "Dart", "Firebase"],
      status: "closed",
      applicants: 30,
      postedAgo: "2 weeks ago",
      description: "Build a secure mobile wallet application with payment processing.",
    },
  ]);

  const filters = ["All", "Open", "Applied", "Closed"];

  /* =========================
     UI Logic
  ========================== */
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      selectedFilter === "All" || p.status.toLowerCase() === selectedFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "applied":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      case "closed":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  return (
    <DeveloperLayout>
      <>
        <Header />
        <div className="min-h-screen bg-[#F5F9F9] mt-15 p-4 md:p-6 ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-[20px] md:text-[24px] font-bold text-[#111827]">
                Browse Projects
              </h1>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Find projects that match your skills and apply.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, companies, or skills..."
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

            {/* Results Count */}
            <p className="text-sm text-[#6B7280] mb-4">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} found
            </p>

            {/* Project Cards */}
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#0B6F6C]/30 transition cursor-pointer"
                  onClick={() => navigate(`/developer/project/${project.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[17px] font-semibold text-[#111827]">
                          {project.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium capitalize ${getStatusBadge(
                            project.status
                          )}`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <p className="text-[14px] text-[#6B7280] mb-3">{project.description}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-lg bg-[#F3F4F6] text-[12px] text-[#4B5563] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-5 text-[13px] text-[#6B7280]">
                        <span className="flex items-center gap-1.5">
                          <Briefcase size={14} />
                          {project.company}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} />
                          {project.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={14} />
                          {project.budget}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {project.duration}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[12px] text-[#9CA3AF]">{project.postedAgo}</p>
                      <p className="text-[12px] text-[#6B7280] mt-1">
                        {project.applicants} applicants
                      </p>
                      {project.status === "open" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/developer/jobs/${project.id}/apply`);
                          }}
                          className="mt-3 h-9 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                        >
                          Apply
                        </button>
                      )}
                      {project.status === "applied" && (
                        <span className="mt-3 inline-block h-9 px-5 rounded-xl bg-[#EEF2FF] text-[#4F46E5] text-sm font-medium leading-9">
                          Applied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredProjects.length === 0 && (
                <div className="bg-white rounded-2xl p-10 border border-[#E5E7EB] text-center">
                  <p className="text-[#6B7280]">No projects match your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    </DeveloperLayout>
  );
}

export default ProjectsList;
