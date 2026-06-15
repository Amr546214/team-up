import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  Briefcase,
  MapPin,
  Wallet,
  Users,
  CalendarDays,
  Award,
} from "lucide-react";

function PostJob() {
  const navigate = useNavigate();

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    experienceLevel: "Mid-Level",
    type: "Full-Time",
    workMode: "Remote",
    salary: "",
    deadline: "",
    developersCount: 1,
  });

  const [skills, setSkills] = useState(["React", "Node.js", "UI/UX", "AI"]);
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!jobData.title.trim()) newErrors.title = "Job title is required";
    if (!jobData.description.trim()) newErrors.description = "Description is required";
    if (!jobData.salary.trim()) newErrors.salary = "Salary range is required";
    if (!jobData.deadline.trim()) newErrors.deadline = "Deadline is required";

    if (!jobData.developersCount || Number(jobData.developersCount) < 1) {
      newErrors.developersCount = "Required developers count is required";
    }

    if (skills.length === 0) newErrors.skills = "At least one skill is required";

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
    const trimmed = newSkill.trim();

    if (!trimmed || skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill("");
      return;
    }

    setSkills((prev) => [...prev, trimmed]);
    setNewSkill("");

    setErrors((prev) => ({
      ...prev,
      skills: "",
    }));
  };

  const handlePreview = () => {
    if (!validate()) return;
    alert("Preview job is ready!");
  };

  const handlePublish = () => {
    if (!validate()) return;
    alert("Job posted successfully!");
    navigate("/company/jobs");
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1100px] mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-[#111827] hover:opacity-80"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-[28px] font-bold text-[#111827]">
              Post New Job
            </h1>
          </div>

          <p className="text-[15px] text-[#6B7280] mb-8">
            Create a hiring opportunity and find the right developers for your project.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form */}
            <div className="lg:col-span-8">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mb-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#D9EFEF] flex items-center justify-center">
                    <FileText size={18} className="text-[#0B6F6C]" />
                  </div>

                  <h2 className="text-[20px] font-semibold text-[#111827]">
                    Basic Information
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={jobData.title}
                      onChange={handleChange}
                      placeholder="e.g. Senior React Developer"
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                    />

                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      name="description"
                      value={jobData.description}
                      onChange={handleChange}
                      rows="5"
                      placeholder="Describe the role and responsibilities..."
                      className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none resize-none focus:border-[#0B6F6C]"
                    />

                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-3">
                      Required Skills <span className="text-red-500">*</span>
                    </label>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1.5 bg-[#D9EFEF] text-[#4B5563] px-4 py-1.5 rounded-full text-sm"
                        >
                          {skill}

                          <button
                            type="button"
                            onClick={() =>
                              setSkills((prev) => prev.filter((s) => s !== skill))
                            }
                            className="hover:text-black"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>

                    {errors.skills && (
                      <p className="mb-2 text-sm text-red-500">{errors.skills}</p>
                    )}

                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Add a skill..."
                        className="flex-1 h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                      />

                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#095c5a] transition"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Experience Level
                    </label>

                    <select
                      name="experienceLevel"
                      value={jobData.experienceLevel}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Mid-Level">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mb-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#D9EFEF] flex items-center justify-center">
                    <Briefcase size={18} className="text-[#0B6F6C]" />
                  </div>

                  <h2 className="text-[20px] font-semibold text-[#111827]">
                    Job Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Job Type
                    </label>

                    <select
                      name="type"
                      value={jobData.type}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Work Mode
                    </label>

                    <select
                      name="workMode"
                      value={jobData.workMode}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Salary <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      name="salary"
                      value={jobData.salary}
                      onChange={handleChange}
                      placeholder="e.g. $80K - $120K"
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                    />

                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-500">{errors.salary}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Deadline <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="date"
                      name="deadline"
                      value={jobData.deadline}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                    />

                    {errors.deadline && (
                      <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-[#111827] mb-2">
                      Required Developers Count
                    </label>

                    <input
                      type="number"
                      name="developersCount"
                      min="1"
                      value={jobData.developersCount}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                    />

                    {errors.developersCount && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.developersCount}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 mt-8 pb-4">
                <button
                  onClick={handlePreview}
                  className="h-12 px-6 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] text-[15px] font-medium hover:bg-[#F8FAFC] transition"
                >
                  Preview Job
                </button>

                <button
                  onClick={handlePublish}
                  className="h-12 px-8 rounded-xl bg-[#0B6F6C] text-white text-[15px] font-medium hover:bg-[#095c5a] transition"
                >
                  Publish Job
                </button>
              </div>
            </div>

            {/* Job Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden lg:sticky lg:top-24">
                <div className="bg-[#F5F9F9] px-6 py-5 border-b border-[#E5E7EB]">
                  <h2 className="text-[14px] font-bold tracking-wide uppercase text-[#0B6F6C]">
                    Job Summary Preview
                  </h2>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
                      Job Title
                    </p>

                    <h3 className="text-[24px] font-bold text-[#111827] leading-snug">
                      {jobData.title || "Senior Frontend Developer"}
                    </h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Award size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.experienceLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Briefcase size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.workMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Wallet size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.salary || "$100K - $120K"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.deadline || "Deadline"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users size={17} className="text-[#0B6F6C]" />
                      <span className="text-[15px] text-[#4B5563]">
                        {jobData.developersCount || 1} Position(s)
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-3">
                      Required Skills
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-md bg-[#F3F4F6] text-[#6B7280] text-[12px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PostJob;