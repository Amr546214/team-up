import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import { ArrowLeft, Plus, X } from "lucide-react";

function PostJob() {
  const navigate = useNavigate();

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    requirements: "",
    type: "Full-Time",
    workMode: "Remote",
    salary: "",
    deadline: "",
  });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!jobData.title.trim()) newErrors.title = "Job title is required";
    if (!jobData.description.trim()) newErrors.description = "Description is required";
    if (!jobData.requirements.trim()) newErrors.requirements = "Requirements are required";
    if (!jobData.salary.trim()) newErrors.salary = "Salary range is required";
    if (skills.length === 0) newErrors.skills = "At least one skill is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill("");
      return;
    }
    setSkills((prev) => [...prev, trimmed]);
    setNewSkill("");
    setErrors((prev) => ({ ...prev, skills: "" }));
  };

  const handlePublish = () => {
    if (!validate()) return;
    alert("Job posted successfully!");
    navigate("/company/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[880px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-[#111827] hover:opacity-80"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[28px] font-bold text-[#111827]">Post a New Job</h1>
          </div>
          <p className="text-[15px] text-[#6B7280] mb-8">
            Fill in the details to publish a new job opportunity.
          </p>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mb-5">
            <h2 className="text-[20px] font-semibold text-[#111827] mb-6">Job Information</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={jobData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior React Developer"
                  className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Description</label>
                <textarea
                  name="description"
                  value={jobData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describe the role and responsibilities..."
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none resize-none focus:border-[#0B6F6C]"
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Requirements</label>
                <textarea
                  name="requirements"
                  value={jobData.requirements}
                  onChange={handleChange}
                  rows="3"
                  placeholder="List key requirements for the role..."
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none resize-none focus:border-[#0B6F6C]"
                />
                {errors.requirements && <p className="mt-1 text-sm text-red-500">{errors.requirements}</p>}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-3">Required Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map((skill) => (
                    <span key={skill} className="flex items-center gap-1.5 bg-[#D9EFEF] text-[#4B5563] px-4 py-1.5 rounded-full text-sm">
                      {skill}
                      <button onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))} className="hover:text-black">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {errors.skills && <p className="mb-2 text-sm text-red-500">{errors.skills}</p>}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
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
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 mb-5">
            <h2 className="text-[20px] font-semibold text-[#111827] mb-6">Job Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Job Type</label>
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
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Work Mode</label>
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
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Salary Range</label>
                <input
                  type="text"
                  name="salary"
                  value={jobData.salary}
                  onChange={handleChange}
                  placeholder="e.g. $80K - $120K"
                  className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                />
                {errors.salary && <p className="mt-1 text-sm text-red-500">{errors.salary}</p>}
              </div>

              <div>
                <label className="block text-[15px] font-medium text-[#111827] mb-2">Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={jobData.deadline}
                  onChange={handleChange}
                  className="w-full h-12 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="h-12 px-6 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] text-[15px] font-medium hover:bg-[#F8FAFC] transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              className="h-12 px-8 rounded-xl bg-[#0B6F6C] text-white text-[15px] font-medium hover:bg-[#095c5a] transition"
            >
              Publish Job
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostJob;
