import { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendRequirementsToN8n } from "../../../lib/n8n";
import PublishingPreloader from "../../../components/common/PublishingPreloader";
import PublishResultModal from "../../../components/common/PublishResultModal";

const skillOptions = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Express.js",
  ".NET",
  "C#",
  "ASP.NET",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Python",
  "Django",
  "Flask",
  "Java",
  "Spring Boot",
  "PHP",
  "Laravel",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "UI/UX",
  "Figma",
  "React Native",
  "Flutter",
  "DevOps",
  "Docker",
  "Kubernetes",
  "AWS",
  "Firebase",
  "AI",
  "Machine Learning",
  "Data Analysis"
];

function PostNewJob() {
  const navigate = useNavigate();

  const [jobData, setJobData] = useState({
    jobTitle: "",
    description: "",
    budget: "",
    estimatedDuration: "",
    workType: "Freelance / Contract",
    teamSize: 1,
    priority: "best quality",
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedJob, setPublishedJob] = useState(null);

  const validate = () => {
    const newErrors = {};

    if (!jobData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required";
    }

    if (!jobData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!jobData.budget.trim()) {
      newErrors.budget = "Budget is required";
    }

    if (!jobData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = "Duration is required";
    }

    if (!jobData.teamSize || jobData.teamSize < 1) {
      newErrors.teamSize = "Team size must be at least 1";
    }

    if (!jobData.priority) {
      newErrors.priority = "Priority is required";
    }

    if (skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setJobData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const addSkill = (skill) => {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) return;

    const alreadyExists = skills.some(
      (item) => item.toLowerCase() === trimmedSkill.toLowerCase()
    );

    if (alreadyExists) {
      setNewSkill("");
      return;
    }

    setSkills((prev) => [...prev, trimmedSkill]);
    setNewSkill("");

    setErrors((prev) => ({
      ...prev,
      skills: "",
    }));
  };

  const handleAddSkill = () => addSkill(newSkill);

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const handlePreviewJob = () => {
    console.log("Preview Job:", {
      ...jobData,
      skills,
    });
    alert("Preview job data ready!");
  };

  const handlePublishJob = async () => {
    // Prevent duplicate submits
    if (isPublishing) return;

    if (!validate()) return;

    setIsPublishing(true);

    try {
      const requirements = {
        team_size: Number(jobData.teamSize) || 1,
        skills: [...skills],
        budget: Number(jobData.budget.replace(/[^0-9]/g, "")) || 0,
        priority: jobData.priority,
      };

      console.log("[n8n DEBUG] API input being sent:", requirements);

      // Initialize n8n fields
      let n8nResponse = null;
      let n8nStatus = "pending";
      let n8nError = null;
      let n8nSyncedAt = null;

      // Send to n8n before saving
      try {
        console.log("[n8n DEBUG] Sending request to n8n...");
        n8nResponse = await sendRequirementsToN8n(requirements);
        n8nStatus = "success";
        n8nSyncedAt = new Date().toISOString();
        console.log("[n8n DEBUG] API response received:", n8nResponse);
        console.log("[PostNewJob] n8n sync successful:", n8nResponse);
      } catch (error) {
        n8nResponse = null;
        n8nStatus = "failed";
        n8nError = error?.message || "Unknown error";
        n8nSyncedAt = null;
        console.error("[n8n DEBUG] API request failed:", error);
        console.error("[n8n DEBUG] Error message:", error?.message);
        console.error("[PostNewJob] n8n sync failed:", error);
        // Don't block job creation - continue to save the job
      }

      const newJob = {
        id: Date.now(),
        title: jobData.jobTitle,
        location: "Remote",
        jobType: jobData.workType,
        salary: jobData.budget,
        applications: 0,
        applicationsLabel: "0 Applications",
        status: "Open",
        posted: "Posted just now",
        isNew: true,
        description: jobData.description,
        duration: jobData.estimatedDuration,
        skills: [...skills],
        team_size: requirements.team_size,
        priority: requirements.priority,
        requirements,
        n8nResponse,
        n8nStatus,
        n8nError,
        n8nSyncedAt,
      };

      console.log("[n8n DEBUG] Saved job with n8n fields:", newJob);

      console.log("[PostNewJob] Created job:", newJob);

      // Job is not saved to localStorage yet - will be saved on Accept Team
      setPublishedJob(newJob);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      {isPublishing && <PublishingPreloader />}
      {publishedJob && (
        <PublishResultModal
          job={publishedJob}
          onAcceptTeam={(acceptedJob) => {
            const raw = window.localStorage.getItem("client_jobs");
            const parsed = raw ? JSON.parse(raw) : [];
            const prev = Array.isArray(parsed) ? parsed : [];

            window.localStorage.setItem(
              "client_jobs",
              JSON.stringify([acceptedJob, ...prev])
            );

            navigate("/client/my-jobs");
          }}
          onRejectTeam={() => {
            setPublishedJob(null);
          }}
        />
      )}
      <div className="min-h-screen bg-[#F5FAFA] px-6 py-10">
        <div className="max-w-[880px] mx-auto">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/client/profile")}
              className="text-[#111827] hover:opacity-80"
            >
              <ArrowLeft size={18} />
            </button>

            <h1 className="text-[32px] font-semibold text-[#111827]">
              Create a New Job Post
            </h1>
          </div>

          <p className="mt-3 text-center text-[16px] text-[#6B7280]">
            Fill in the details below to publish your new opportunity.
          </p>

          <div className="mt-10 bg-white rounded-[12px] border border-[#E5E7EB] p-6 md:p-8">
            <h2 className="text-[22px] font-semibold text-[#111827]">
              Job Basic Information
            </h2>

            <p className="mt-2 text-[15px] text-[#6B7280]">
              Core details about the position.
            </p>

            <div className="mt-6">
              <label className="block text-[15px] font-medium text-[#111827] mb-2">
                Job Title
              </label>
              <input
                type="text"
                name="jobTitle"
                value={jobData.jobTitle}
                onChange={handleChange}
                placeholder="e.g Frontend Developer"
                className="w-full h-[52px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
              />
              {errors.jobTitle && (
                <p className="mt-1 text-sm text-red-500">{errors.jobTitle}</p>
              )}
            </div>

            <div className="mt-5">
              <label className="block text-[15px] font-medium text-[#111827] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={jobData.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, and ideal candidate...."
                rows="6"
                className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-4 text-[15px] outline-none resize-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-[15px] font-medium text-[#111827] mb-4">
                Required Skills
              </label>

              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#D9EFEF] text-[#6B7280] px-5 h-[36px] rounded-full text-[14px]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#7B8794] hover:text-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {errors.skills && (
                <p className="mt-2 text-sm text-red-500">{errors.skills}</p>
              )}

              <div className="mt-5 relative">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(newSkill);
                        }
                      }}
                      placeholder="Search skills, e.g. JavaScript, .NET, SQL"
                      className="w-full h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                    />

                    {/* Dropdown */}
                    {newSkill.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#D1D5DB] rounded-[10px] shadow-lg z-50 max-h-[240px] overflow-y-auto">
                        {(() => {
                          const query = newSkill.trim().toLowerCase();
                          const filtered = skillOptions.filter((skill) => {
                            const alreadySelected = skills.some(
                              (selected) => selected.toLowerCase() === skill.toLowerCase()
                            );
                            return (
                              !alreadySelected &&
                              skill.toLowerCase().includes(query)
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <button
                                type="button"
                                onClick={() => addSkill(newSkill)}
                                className="w-full text-left px-4 py-3 text-[15px] text-[#111827] hover:bg-[#F9FAFB] first:rounded-t-[10px] last:rounded-b-[10px]"
                              >
                                Add "{newSkill}"
                              </button>
                            );
                          }

                          return filtered.slice(0, 6).map((skill, index) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className={`w-full text-left px-4 py-3 text-[15px] text-[#111827] hover:bg-[#F9FAFB] ${
                                index === 0 ? "rounded-t-[10px]" : ""
                              } ${
                                index === Math.min(filtered.length, 6) - 1
                                  ? "rounded-b-[10px]"
                                  : ""
                              }`}
                            >
                              {skill}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!newSkill.trim()}
                    className="min-w-[170px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[15px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                    Add Skill
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 bg-white rounded-[12px] border border-[#E5E7EB] p-6 md:p-8">
            <h2 className="text-[22px] font-semibold text-[#111827]">
              Project Details
            </h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">
                  Budget
                </label>
                <input
                  type="text"
                  name="budget"
                  value={jobData.budget}
                  onChange={handleChange}
                  placeholder="$0.00"
                  className="w-full h-[52px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-500">{errors.budget}</p>
                )}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  name="estimatedDuration"
                  value={jobData.estimatedDuration}
                  onChange={handleChange}
                  placeholder="e.g. 2 weeks"
                  className="w-full h-[52px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                />
                {errors.estimatedDuration && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.estimatedDuration}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">
                  Team Size
                </label>
                <input
                  type="number"
                  name="teamSize"
                  min="1"
                  value={jobData.teamSize}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  className="w-full h-[52px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
                />
                {errors.teamSize && (
                  <p className="mt-1 text-sm text-red-500">{errors.teamSize}</p>
                )}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={jobData.priority}
                  onChange={handleChange}
                  className="w-full h-[52px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none bg-white focus:border-[#0B6B63]"
                >
                  <option value="best quality">Best Quality</option>
                  <option value="fast delivery">Fast Delivery</option>
                  <option value="lowest cost">Lowest Cost</option>
                  <option value="balanced">Balanced</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-500">{errors.priority}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 bg-white rounded-[12px] border border-[#E5E7EB] p-6 md:p-8">
            <h2 className="text-[22px] font-semibold text-[#111827]">
              Advanced Options
            </h2>

            <div className="mt-6">
              <p className="text-[15px] font-medium text-[#111827] mb-4">
                Work Type
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() =>
                    setJobData((prev) => ({
                      ...prev,
                      workType: "Freelance / Contract",
                    }))
                  }
                  className={`relative text-left rounded-[12px] border p-6 min-h-[160px] transition ${
                    jobData.workType === "Freelance / Contract"
                      ? "border-[#0B6B63] bg-[#F5FAFA]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  <span
                    className={`absolute top-4 right-4 w-[20px] h-[20px] rounded-full border ${
                      jobData.workType === "Freelance / Contract"
                        ? "bg-[#0D8AE2] border-[#0D8AE2]"
                        : "border-[#98A2B3] bg-white"
                    }`}
                  />

                  <h3 className="text-[22px] font-semibold text-[#111827]">
                    Freelance / Contract
                  </h3>

                  <p className="mt-4 text-[16px] leading-8 text-[#111827]">
                    Project-based work with flexible hours and deliverables.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setJobData((prev) => ({
                      ...prev,
                      workType: "Full-time Role",
                    }))
                  }
                  className={`relative text-left rounded-[12px] border p-6 min-h-[160px] transition shadow-sm ${
                    jobData.workType === "Full-time Role"
                      ? "border-[#0B6B63] bg-[#F5FAFA]"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  <span
                    className={`absolute top-4 right-4 w-[20px] h-[20px] rounded-full border ${
                      jobData.workType === "Full-time Role"
                        ? "bg-[#0D8AE2] border-[#0D8AE2]"
                        : "border-[#98A2B3] bg-white"
                    }`}
                  />

                  <h3 className="text-[22px] font-semibold text-[#111827]">
                    Full-time Role
                  </h3>

                  <p className="mt-4 text-[16px] leading-8 text-[#111827]">
                    Standard 40hrs/week position with long-term commitment.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-end gap-5 pb-4">
            <button
              type="button"
              onClick={handlePreviewJob}
              disabled={isPublishing}
              className="min-w-[170px] h-[56px] rounded-[10px] border border-[#E5E7EB] bg-white text-[#0B6B63] text-[17px] font-medium hover:bg-[#F8FAFA] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview Job
            </button>

            <button
              type="button"
              onClick={handlePublishJob}
              disabled={isPublishing}
              className="min-w-[170px] h-[56px] rounded-[10px] bg-[#0B6B63] text-white text-[17px] font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? "Publishing..." : "Publish Job"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PostNewJob;