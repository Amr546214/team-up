import React, { useRef, useState } from "react";
import { Code2, Star, Hourglass } from "lucide-react";
import Header from "../../../components/common/Header";

const DevProfile = () => {
  const [user, setUser] = useState({
    name: "Hanan Muhammed",
    rank: "Gold",
    title: "Frontend Developer",
    status: "Online",
    level: "Senior Level",
    experience: "4+ Years experience",
    avatar: "",
  });

  const [skills, setSkills] = useState(["ui/ux", "React", "Python", "AI"]);

  const [portfolio, setPortfolio] = useState([
    {
      id: 1,
      projectName: "E- commerce Dashboard",
      description:
        "Modern admin dashboard for e-commerce platform with real-time analytics and inventory management.",
      skills: ["React", "JavaScript", "Tailwind css"],
    },
    {
      id: 2,
      projectName: "Task Management App",
      description:
        "Collaborative project management tool with drag-and-drop functionality and team collaboration features.",
      skills: ["Vue.js", "Node.js", "MongoDB"],
    },
  ]);

  const [rankProgress] = useState({
    currentRank: "Gold",
    nextRank: "Platinum",
    currentPoints: 850,
    targetPoints: 1000,
    completedProjects: 12,
    performanceScore: 4.8,
  });

  const [workHistory] = useState([
    {
      id: 1,
      title: "E-commerce Platform",
      client: "TechCorp",
      role: "Frontend Developer",
      duration: "3 months",
      status: "Completed",
      rating: 5.0,
    },
    {
      id: 2,
      title: "Task Manager App",
      client: "StartupXYZ",
      role: "Full Stack",
      duration: "2 months",
      status: "Ongoing",
      rating: null,
    },
  ]);

  const [availability, setAvailability] = useState({
    workingHours: "",
    preferredJobTypes: ["Freelance", "Part-time"],
    salaryExpectations: "",
    acceptingNewProjects: true,
  });

  const fileInputRef = useRef(null);
  const [skillInput, setSkillInput] = useState("");

  const emptyPortfolioForm = {
    projectName: "",
    description: "",
    skillInput: "",
    skills: [],
  };

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyPortfolioForm);

  const handleImageChange = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setUser((prev) => ({
      ...prev,
      avatar: imageUrl,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleImageChange(file);
  };

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (!trimmedSkill) return;

    const alreadyExists = skills.some(
      (skill) => skill.toLowerCase() === trimmedSkill.toLowerCase()
    );

    if (alreadyExists) {
      setSkillInput("");
      return;
    }

    setSkills([...skills, trimmedSkill]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handlePortfolioAddSkill = () => {
    const trimmedSkill = formData.skillInput.trim();
    if (!trimmedSkill) return;

    const alreadyExists = formData.skills.some(
      (skill) => skill.toLowerCase() === trimmedSkill.toLowerCase()
    );

    if (alreadyExists) {
      setFormData((prev) => ({ ...prev, skillInput: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmedSkill],
      skillInput: "",
    }));
  };

  const handlePortfolioRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSavePortfolio = () => {
    if (!formData.projectName.trim() || !formData.description.trim()) return;

    const newItem = {
      id: Date.now(),
      projectName: formData.projectName,
      description: formData.description,
      skills: formData.skills,
    };

    setPortfolio([newItem, ...portfolio]);
    setFormData(emptyPortfolioForm);
    setShowForm(false);
  };

  const progressPercentage = Math.min(
    (rankProgress.currentPoints / rankProgress.targetPoints) * 100,
    100
  );

  const jobTypes = ["Freelance", "Full-time", "Part-time"];

  const handleJobTypeChange = (jobType) => {
    const exists = availability.preferredJobTypes.includes(jobType);

    if (exists) {
      setAvailability({
        ...availability,
        preferredJobTypes: availability.preferredJobTypes.filter(
          (item) => item !== jobType
        ),
      });
    } else {
      setAvailability({
        ...availability,
        preferredJobTypes: [...availability.preferredJobTypes, jobType],
      });
    }
  };

  const toggleAcceptingProjects = () => {
    setAvailability({
      ...availability,
      acceptingNewProjects: !availability.acceptingNewProjects,
    });
  };

  return (
    <>
      <Header profileImage={user.avatar} showProfileMenu={true} />

      <div className="min-h-screen bg-[#f3f6f5] px-4 py-6 md:px-6">
        <div className="mx-auto mt-20 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="flex flex-col gap-6">
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div>
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="h-20 w-20 overflow-hidden rounded-full bg-gray-200"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-[#1f2937]">
                        {user.name}
                      </h2>
                      <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-medium text-[#b45309]">
                        {user.rank}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-y-3 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Code2 size={16} className="text-[#0f766e]" />
                        <span>{user.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                        <span>{user.status}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Star
                          size={16}
                          fill="currentColor"
                          className="text-[#0f766e]"
                        />
                        <span>{user.level}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Hourglass size={16} className="text-[#0f766e]" />
                        <span>{user.experience}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold text-[#1f2937]">
                  Skills
                </h3>

                <div className="mb-4 flex flex-wrap gap-3">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 rounded-full bg-[#d7ece8] px-4 py-2 text-sm text-[#4b5563]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove ${skill}`}
                        className="text-[#4b5563]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                  />

                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 text-white"
                  >
                    <span>+</span>
                    <span>Add Skill</span>
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-semibold text-[#1f2937]">
                    Portfolio
                  </h3>

                  <button
                    type="button"
                    onClick={() => setShowForm((prev) => !prev)}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 text-white"
                  >
                    <span>+</span>
                    <span>Add Portfolio Item</span>
                  </button>
                </div>

                {showForm && (
                  <div className="mb-5 rounded-2xl border border-gray-200 bg-[#f9fbfb] p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-sm text-gray-600">
                          Project Name
                        </p>
                        <input
                          type="text"
                          placeholder="Project Name"
                          value={formData.projectName}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              projectName: e.target.value,
                            }))
                          }
                          className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-sm text-gray-600">Description</p>
                        <textarea
                          placeholder="Description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="min-h-[120px] w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-[#0f766e]"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-sm text-gray-600">
                          What skills are used in the project?
                        </p>

                        <div className="mb-3 flex flex-wrap gap-3">
                          {formData.skills.map((skill) => (
                            <div
                              key={skill}
                              className="flex items-center gap-2 rounded-full bg-[#d7ece8] px-4 py-2 text-sm text-[#4b5563]"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handlePortfolioRemoveSkill(skill)}
                                aria-label={`Remove ${skill}`}
                                className="text-[#4b5563]"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            type="text"
                            placeholder="Add a skill..."
                            value={formData.skillInput}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                skillInput: e.target.value,
                              }))
                            }
                            className="h-12 flex-1 rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                          />

                          <button
                            type="button"
                            onClick={handlePortfolioAddSkill}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 text-white"
                          >
                            <span>+</span>
                            <span>Add Skill</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleSavePortfolio}
                        className="rounded-xl bg-[#0f766e] px-5 py-3 text-white"
                      >
                        Save Item
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <h4 className="mb-3 text-2xl font-semibold text-[#1f2937]">
                        {item.projectName}
                      </h4>
                      <p className="mb-4 text-sm leading-6 text-gray-500">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-[#1f2937]">
                      Security Settings
                    </h3>
                    <p className="text-sm text-[#1f2937]">Change Password</p>
                  </div>

                  <a href="#change-password" className="text-sm text-[#0f766e]">
                    Change
                  </a>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6">
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold text-[#1f2937]">
                  Work History
                </h3>

                <div className="space-y-4">
                  {workHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h4 className="text-lg font-medium text-[#1f2937]">
                          {item.title}
                        </h4>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            item.status === "Completed"
                              ? "bg-[#dcfce7] text-[#16a34a]"
                              : "bg-[#dbeafe] text-[#2563eb]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="mb-4 flex flex-col gap-2 text-sm text-gray-500">
                        <span>Client: {item.client}</span>
                        <span>Role: {item.role}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{item.duration}</span>

                        {item.status === "Completed" ? (
                          <span className="flex items-center gap-1 text-[#f59e0b]">
                            <Star size={16} fill="currentColor" />
                            <span>{item.rating}</span>
                          </span>
                        ) : (
                          <span>Ongoing</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-semibold text-[#1f2937]">
                  Rank Progress
                </h3>

                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current Rank</span>
                  <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-medium text-[#b45309]">
                    {rankProgress.currentRank}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                  <span>Progress to {rankProgress.nextRank}</span>
                  <span>
                    {rankProgress.currentPoints}/{rankProgress.targetPoints} pts
                  </span>
                </div>

                <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-[#0f766e]"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold text-[#0f766e]">
                      {rankProgress.completedProjects}
                    </div>
                    <div className="text-xs text-gray-400">
                      Completed Projects
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-semibold text-[#0f766e]">
                      {rankProgress.performanceScore}
                    </div>
                    <div className="text-xs text-gray-400">
                      Performance Score
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-semibold text-[#1f2937]">
                  Availability Settings
                </h3>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm text-gray-600">Working Hours</p>
                    <input
                      type="text"
                      placeholder="9 AM - 5 PM EST"
                      value={availability.workingHours}
                      onChange={(e) =>
                        setAvailability({
                          ...availability,
                          workingHours: e.target.value,
                        })
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm text-gray-600">
                      Preferred Job Types
                    </p>

                    <div className="space-y-3">
                      {jobTypes.map((jobType) => (
                        <label
                          key={jobType}
                          className="flex items-center gap-3 text-sm text-gray-600"
                        >
                          <input
                            type="checkbox"
                            checked={availability.preferredJobTypes.includes(
                              jobType
                            )}
                            onChange={() => handleJobTypeChange(jobType)}
                            className="h-4 w-4 accent-[#2563eb]"
                          />
                          <span>{jobType}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-gray-600">
                      Salary Expectations
                    </p>
                    <input
                      type="text"
                      placeholder="$80-120/hour"
                      value={availability.salaryExpectations}
                      onChange={(e) =>
                        setAvailability({
                          ...availability,
                          salaryExpectations: e.target.value,
                        })
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      Accepting New Projects
                    </span>

                    <button
                      type="button"
                      onClick={toggleAcceptingProjects}
                      aria-label="Toggle accepting new projects"
                      className={`relative h-7 w-12 rounded-full transition ${
                        availability.acceptingNewProjects
                          ? "bg-[#0f766e]"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                          availability.acceptingNewProjects ? "right-1" : "left-1"
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DevProfile