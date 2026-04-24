import { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PostNewJob() {
  const navigate = useNavigate();

  const [jobData, setJobData] = useState({
    jobTitle: "",
    description: "",
    budget: "",
    estimatedDuration: "",
    workType: "Freelance / Contract",
  });

  const [skills, setSkills] = useState(["Ui/Ux", "React", "Python", "AI"]);
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});

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

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();

    if (!trimmedSkill) return;

    const alreadyExists = skills.some(
      (skill) => skill.toLowerCase() === trimmedSkill.toLowerCase()
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

  const handlePublishJob = () => {
    if (!validate()) return;

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
    };

    try {
      const raw = window.localStorage.getItem("client_jobs");
      const parsed = raw ? JSON.parse(raw) : [];
      const prev = Array.isArray(parsed) ? parsed : [];

      window.localStorage.setItem(
        "client_jobs",
        JSON.stringify([newJob, ...prev])
      );
    } catch {
      window.localStorage.setItem("client_jobs", JSON.stringify([newJob]));
    }

    navigate("/client/my-jobs");
  };

  return (
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

            <div className="mt-5 flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 h-[48px] rounded-[10px] border border-[#D1D5DB] px-4 text-[15px] outline-none focus:border-[#0B6B63] placeholder:text-[#A3A3A3]"
              />

              <button
                type="button"
                onClick={handleAddSkill}
                className="min-w-[170px] h-[48px] rounded-[10px] bg-[#0B6B63] text-white text-[15px] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Plus size={18} />
                Add Skill
              </button>
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
            className="min-w-[170px] h-[56px] rounded-[10px] border border-[#E5E7EB] bg-white text-[#0B6B63] text-[17px] font-medium hover:bg-[#F8FAFA] transition"
          >
            Preview Job
          </button>

          <button
            type="button"
            onClick={handlePublishJob}
            className="min-w-[170px] h-[56px] rounded-[10px] bg-[#0B6B63] text-white text-[17px] font-medium hover:opacity-90 transition"
          >
            Publish Job
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostNewJob;