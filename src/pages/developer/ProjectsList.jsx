import { useEffect, useMemo, useState } from "react";
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
  X,
} from "lucide-react";

const API_BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

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
    throw new Error(data?.message || data?.error_message || data?.error || "Request failed");
  }

  return data;
};

const normalizeProject = (project = {}) => ({
  id: project.jobId || project.id || project._id,
  title: project.title || "Untitled Project",
  company: project.company?.name || "Company",
  location:
    project.workMode === "remote"
      ? "Remote"
      : project.workMode === "hybrid"
      ? `Hybrid${project.location ? ` - ${project.location}` : ""}`
      : project.location || "Onsite",
  budget: project.budgetLabel || `$${project.budgetMin || 0} - $${project.budgetMax || 0}`,
  duration: project.duration || project.estimatedDuration || "Not specified",
  skills: Array.isArray(project.skills) ? project.skills : [],
  status: project.status || project.applicationStatus || "open",
  rawStatus: project.rawStatus,
  applicationStatus: project.applicationStatus,
  applicants: project.applicantsCount || 0,
  postedAgo: project.postedAgo || "Recently",
  description: project.description || "",
  action: project.action || null,
});

function ProjectsList() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedWorkMode, setSelectedWorkMode] = useState("all");
  const [skillQuery, setSkillQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState("");

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [proposedBudget, setProposedBudget] = useState("");

  const filters = ["All", "Open", "Applied", "Closed"];
  const workModes = ["all", "remote", "onsite", "hybrid"];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

    const params = new URLSearchParams();

if (searchQuery.trim()) params.append("search", searchQuery.trim());
if (skillQuery.trim()) params.append("skill", skillQuery.trim());
if (selectedWorkMode !== "all") params.append("workMode", selectedWorkMode);

if (selectedFilter.toLowerCase() !== "all") {
  params.append("status", selectedFilter.toLowerCase());
}

params.append("page", "1");
params.append("limit", "10");

      const data = await apiRequest(`/developer/projects?${params.toString()}`);

      const list =
  data?.data?.projects ||
  data?.projects ||
  data?.data?.items ||
  data?.items ||
  [];

console.log("PROJECTS RESPONSE:", data);
console.log("PROJECTS LIST:", list);
      setProjects(Array.isArray(list) ? list.map(normalizeProject) : []);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, selectedWorkMode]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const value = searchQuery.toLowerCase().trim();

      if (!value) return true;

      return (
        project.title.toLowerCase().includes(value) ||
        project.company.toLowerCase().includes(value) ||
        project.skills.some((skill) => skill.toLowerCase().includes(value))
      );
    });
  }, [projects, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
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

  const getActionLabel = (project) => {
    if (project.action?.label) return project.action.label;
    if (project.status === "applied") return "Applied";
    if (project.status === "closed") return "Closed";
    return "Apply";
  };

  const isActionDisabled = (project) => {
    return (
      project.action?.disabled ||
      project.status === "applied" ||
      project.status === "closed"
    );
  };

  const openApplyModal = (project) => {
    setSelectedProject(project);
    setProposedBudget("");
    setShowApplyModal(true);
  };

  const closeApplyModal = () => {
    setSelectedProject(null);
    setProposedBudget("");
    setShowApplyModal(false);
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!selectedProject?.id) return;

    if (!proposedBudget || Number(proposedBudget) <= 0) {
      alert("Please enter proposed budget");
      return;
    }

    try {
      setApplyLoading(true);

      await apiRequest(`/developer/jobs/${selectedProject.id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          proposedBudget: Number(proposedBudget),
        }),
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === selectedProject.id
            ? {
                ...project,
                status: "applied",
                applicationStatus: "applied",
                action: {
                  ...project.action,
                  label: "Applied",
                  disabled: true,
                },
              }
            : project
        )
      );

      closeApplyModal();
    } catch (err) {
      console.error("Failed to apply:", err);
      alert(err.message || "Failed to apply");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <DeveloperLayout>
      <>
        <Header />

        <div className="min-h-screen bg-[#F5F9F9] pt-[96px] px-4 pb-10 md:px-6 lg:ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            <div className="mb-6">
              <h1 className="text-[22px] sm:text-[24px] font-bold text-[#111827]">
                Browse Projects
              </h1>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                Find projects that match your skills and apply.
              </p>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-2xl p-4 border border-[#E5E7EB] mb-6"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-11 px-4 rounded-xl border border-[#E5E7EB] flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:bg-[#F8FAFC] transition"
                >
                  <Filter size={16} />
                  Filter
                  <ChevronDown size={14} />
                </button>

                <button
                  type="submit"
                  className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                >
                  Search
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-[13px] text-[#6B7280] mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.map((filter) => (
                        <button
                          type="button"
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
                  </div>

                  <div>
                    <p className="text-[13px] text-[#6B7280] mb-2">Work Mode</p>
                    <div className="flex flex-wrap gap-2">
                      {workModes.map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => setSelectedWorkMode(mode)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                            selectedWorkMode === mode
                              ? "bg-[#0B6F6C] text-white"
                              : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[13px] text-[#6B7280] mb-2">Skill</p>
                    <input
                      type="text"
                      value={skillQuery}
                      onChange={(e) => setSkillQuery(e.target.value)}
                      placeholder="React, Node.js..."
                      className="w-full sm:max-w-[300px] h-11 px-4 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    />
                  </div>
                </div>
              )}
            </form>

            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-sm text-[#6B7280]">
                {loading
                  ? "Loading projects..."
                  : `${filteredProjects.length} project${
                      filteredProjects.length !== 1 ? "s" : ""
                    } found`}
              </p>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] hover:border-[#0B6F6C]/30 transition cursor-pointer"
                  onClick={() => navigate(`/developer/project/${project.id}`)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-[16px] sm:text-[17px] font-semibold text-[#111827] break-words">
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

                      <p className="text-[14px] text-[#6B7280] mb-3 leading-6">
                        {project.description}
                      </p>

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

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#6B7280]">
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

                    <div className="w-full lg:w-auto lg:text-right shrink-0">
                      <div className="flex lg:block items-center justify-between gap-4">
                        <div>
                          <p className="text-[12px] text-[#9CA3AF]">
                            {project.postedAgo}
                          </p>
                          <p className="text-[12px] text-[#6B7280] mt-1">
                            {project.applicants} applicants
                          </p>
                        </div>

                        <button
                          disabled={isActionDisabled(project)}
                          onClick={(e) => {
                            e.stopPropagation();

                            if (isActionDisabled(project)) return;

                            openApplyModal(project);
                          }}
                          className={`mt-0 lg:mt-3 h-10 px-5 rounded-xl text-sm font-medium transition ${
                            isActionDisabled(project)
                              ? "bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed"
                              : "bg-[#0B6F6C] text-white hover:bg-[#095c5a]"
                          }`}
                        >
                          {getActionLabel(project)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!loading && filteredProjects.length === 0 && (
                <div className="bg-white rounded-2xl p-10 border border-[#E5E7EB] text-center">
                  <p className="text-[#6B7280]">No projects match your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {showApplyModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[18px] font-semibold text-[#111827]">
                  Apply To Project
                </h2>

                <button
                  onClick={closeApplyModal}
                  className="w-9 h-9 rounded-full hover:bg-[#F3F4F6] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <p className="text-[14px] text-[#6B7280] mb-2">Project</p>
                  <p className="text-[15px] font-medium text-[#111827]">
                    {selectedProject?.title}
                  </p>
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Proposed Budget
                  </label>

                  <input
                    type="number"
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(e.target.value)}
                    placeholder="5000"
                    className="w-full h-11 px-4 rounded-xl border border-[#E5E7EB] outline-none focus:border-[#0B6F6C]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition disabled:opacity-60"
                  >
                    {applyLoading ? "Applying..." : "Apply"}
                  </button>

                  <button
                    type="button"
                    onClick={closeApplyModal}
                    className="h-11 px-5 rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    </DeveloperLayout>
  );
}

export default ProjectsList;