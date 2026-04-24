import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Plus, X, Save, Loader2 } from "lucide-react";
import Header from "../../../components/common/Header";

const TRACK_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack",
  "UI/UX Designer",
  "Mobile Developer",
  "AI Engineer",
  "Data Analyst",
  "DevOps Engineer",
];

const SKILL_OPTIONS = [
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
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Python",
  "Django",
  "Java",
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
  "AWS",
  "Firebase",
  "AI",
  "Machine Learning",
];

const DevProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    image: "",
    name: "",
    track: "",
    experience: "",
    skills: [],
    portfolio: "",
    hourlyRate: "",
    hoursPerWeek: "",
    availability: "Yes",
  });

  const [newSkill, setNewSkill] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  useEffect(() => {
    const rawUser = window.localStorage.getItem("teamup_current_user");
    if (!rawUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      if (user.role !== "developer") {
        navigate("/");
        return;
      }

      setCurrentUser(user);
      const devProfile = user.developerProfile || {};

      setFormData({
        image: devProfile.image || "",
        name: user.name || "",
        track: devProfile.track || "",
        experience: devProfile.experience || "",
        skills: devProfile.skills || [],
        portfolio: devProfile.portfolio || "",
        hourlyRate: devProfile.hour_rate_usd?.toString() || "",
        hoursPerWeek: devProfile.hours_per_week?.toString() || "",
        availability: devProfile.available === false ? "No" : "Yes",
      });
    } catch {
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select an image file" }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
      setErrors((prev) => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;

    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkill("");
    setShowSkillDropdown(false);
    setErrors((prev) => ({ ...prev, skills: "" }));
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.track) {
      newErrors.track = "Track is required";
    }

    if (formData.skills.length === 0) {
      newErrors.skills = "At least one skill is required";
    }

    const hourlyRate = Number(formData.hourlyRate);
    if (!formData.hourlyRate || hourlyRate <= 0) {
      newErrors.hourlyRate = "Hourly rate must be greater than 0";
    }

    const hoursPerWeek = Number(formData.hoursPerWeek);
    if (!formData.hoursPerWeek || hoursPerWeek <= 0) {
      newErrors.hoursPerWeek = "Hours per week must be greater than 0";
    }

    if (formData.portfolio && !/^https?:\/\/.+/.test(formData.portfolio)) {
      newErrors.portfolio = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSuccessMessage("");

    try {
      const usersRaw = window.localStorage.getItem("teamup_users");
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      const userIndex = users.findIndex((u) => u.id === currentUser.id);
      if (userIndex === -1) {
        setErrors({ submit: "User not found" });
        return;
      }

      const updatedUser = {
        ...users[userIndex],
        name: formData.name.trim(),
        track: formData.track,
        skills: formData.skills,
        hour_rate_usd: Number(formData.hourlyRate),
        hours_per_week: Number(formData.hoursPerWeek),
        available: formData.availability === "Yes",
        developerProfile: {
          ...users[userIndex].developerProfile,
          image: formData.image,
          name: formData.name.trim(),
          track: formData.track,
          experience: formData.experience,
          skills: formData.skills,
          portfolio: formData.portfolio,
          hour_rate_usd: Number(formData.hourlyRate),
          hours_per_week: Number(formData.hoursPerWeek),
          available: formData.availability === "Yes",
          completedAt: new Date().toISOString(),
        },
      };

      users[userIndex] = updatedUser;
      window.localStorage.setItem("teamup_users", JSON.stringify(users));

      const { password, ...safeUser } = updatedUser;
      window.localStorage.setItem("teamup_current_user", JSON.stringify(safeUser));

      setSuccessMessage("Profile saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({ submit: "Failed to save profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSkills = SKILL_OPTIONS.filter(
    (skill) =>
      skill.toLowerCase().includes(newSkill.toLowerCase()) &&
      !formData.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
  );

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#f3f6f5] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0f766e]" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header profileImage={formData.image} />

      <div className="min-h-screen bg-[#f3f6f5] px-4 py-6 md:px-6">
        <div className="mx-auto mt-20 max-w-3xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-[#1f2937]">
                Developer Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Complete your profile to get matched with projects
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100 hover:bg-gray-200 transition"
                  >
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageChange}
                  />
                  <div className="text-sm text-gray-500">
                    <p>Click to upload a profile picture</p>
                    {errors.image && (
                      <p className="text-red-500">{errors.image}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Track */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Track <span className="text-red-500">*</span>
                </label>
                <select
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e] bg-white"
                >
                  <option value="">Select your track</option>
                  {TRACK_OPTIONS.map((track) => (
                    <option key={track} value={track}>
                      {track}
                    </option>
                  ))}
                </select>
                {errors.track && (
                  <p className="mt-1 text-sm text-red-500">{errors.track}</p>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Experience
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 2 years"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Skills <span className="text-red-500">*</span>
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 rounded-full bg-[#d7ece8] px-3 py-1 text-sm text-[#4b5563]"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-[#4b5563] hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => {
                        setNewSkill(e.target.value);
                        setShowSkillDropdown(true);
                      }}
                      onFocus={() => setShowSkillDropdown(true)}
                      placeholder="Search and add skills..."
                      className="h-12 flex-1 rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                    />
                    <button
                      type="button"
                      onClick={() => addSkill(newSkill)}
                      className="flex h-12 items-center gap-2 rounded-xl bg-[#0f766e] px-4 text-white hover:bg-[#0e6d65] transition"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                  {showSkillDropdown && newSkill && filteredSkills.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                      {filteredSkills.slice(0, 6).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.skills && (
                  <p className="mt-1 text-sm text-red-500">{errors.skills}</p>
                )}
              </div>

              {/* Portfolio */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Portfolio URL
                </label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                />
                {errors.portfolio && (
                  <p className="mt-1 text-sm text-red-500">{errors.portfolio}</p>
                )}
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Hourly Rate (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    placeholder="50"
                    min="1"
                    className="h-12 w-full rounded-xl border border-gray-200 pl-8 pr-4 outline-none focus:border-[#0f766e]"
                  />
                </div>
                {errors.hourlyRate && (
                  <p className="mt-1 text-sm text-red-500">{errors.hourlyRate}</p>
                )}
              </div>

              {/* Hours Per Week */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Hours Per Week <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  placeholder="40"
                  min="1"
                  max="168"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e]"
                />
                {errors.hoursPerWeek && (
                  <p className="mt-1 text-sm text-red-500">{errors.hoursPerWeek}</p>
                )}
              </div>

              {/* Availability */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Available for Projects
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-[#0f766e] bg-white"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] text-white font-medium hover:bg-[#0e6d65] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default DevProfile;