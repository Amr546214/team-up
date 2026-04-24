import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, Award, Briefcase, Code2, Globe, Layers } from "lucide-react";
import Header from "../../components/common/Header";
import { getCurrentUser, saveDeveloperProfile } from "../../services/fakeApi";

const TRACK_OPTIONS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Mobile",
  "UI/UX",
  "AI / Machine Learning",
];

function CompleteProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const currentUser = getCurrentUser();
  const quizRank = currentUser?.quiz?.rank || "Unranked";

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [experience, setExperience] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [track, setTrack] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    setImagePreview(URL.createObjectURL(file));

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const newErrors = {};
    if (!experience.trim()) newErrors.experience = "Experience is required";
    if (!skillsText.trim()) newErrors.skills = "At least one skill is required";
    if (!track) newErrors.track = "Please select a track";
    if (!portfolio.trim()) newErrors.portfolio = "Portfolio link is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser?.id) return;

    setSaving(true);

    const result = saveDeveloperProfile(currentUser.id, {
      image: imageBase64,
      experience: experience.trim(),
      skills: skillsText,
      track,
      portfolio: portfolio.trim(),
    });

    setSaving(false);

    if (result.success) {
      navigate("/developer/dashboard");
    } else {
      alert(result.message || "Failed to save profile.");
    }
  };

  // Redirect if not a developer or no quiz completed
  if (!currentUser || currentUser.role !== "developer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F9F9]">
        <p className="text-gray-500">Access denied. Developer account required.</p>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#F5F9F9] px-4 py-6 md:px-6">
        <div className="mx-auto mt-20 max-w-2xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-[#111827]">
                Complete Your Profile
              </h1>
              <p className="mt-2 text-sm text-[#6B7280]">
                Fill in your developer details to get matched with the right projects.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-[#0f766e] transition flex items-center justify-center"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera size={28} className="text-gray-400" />
                  )}
                </button>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <X size={12} />
                    Remove
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />

                <p className="text-xs text-gray-400">Upload a profile photo (optional)</p>
              </div>

              {/* Rank (read-only, from quiz) */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Award size={16} className="text-[#0f766e]" />
                  Your Rank
                </label>
                <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-[#111827] font-medium">
                  {quizRank}
                  <span className="ml-2 text-xs text-gray-400">(from quiz result)</span>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Briefcase size={16} className="text-[#0f766e]" />
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder='e.g. "2 years" or "6 months"'
                  value={experience}
                  onChange={(e) => {
                    setExperience(e.target.value);
                    if (errors.experience) setErrors((p) => ({ ...p, experience: "" }));
                  }}
                  className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] ${
                    errors.experience ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.experience && (
                  <p className="mt-1 text-xs text-red-500">{errors.experience}</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Code2 size={16} className="text-[#0f766e]" />
                  Skills <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="React, Node.js, UI/UX (comma-separated)"
                  value={skillsText}
                  onChange={(e) => {
                    setSkillsText(e.target.value);
                    if (errors.skills) setErrors((p) => ({ ...p, skills: "" }));
                  }}
                  className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] ${
                    errors.skills ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.skills && (
                  <p className="mt-1 text-xs text-red-500">{errors.skills}</p>
                )}

                {/* Live preview chips */}
                {skillsText.trim() && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillsText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((skill, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-[#d7ece8] px-3 py-1 text-xs text-[#374151]"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Track */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Layers size={16} className="text-[#0f766e]" />
                  Track <span className="text-red-500">*</span>
                </label>
                <select
                  value={track}
                  onChange={(e) => {
                    setTrack(e.target.value);
                    if (errors.track) setErrors((p) => ({ ...p, track: "" }));
                  }}
                  className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] ${
                    errors.track ? "border-red-400" : "border-gray-200"
                  } ${!track ? "text-gray-400" : "text-[#111827]"}`}
                >
                  <option value="" disabled>
                    Select your track
                  </option>
                  {TRACK_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.track && (
                  <p className="mt-1 text-xs text-red-500">{errors.track}</p>
                )}
              </div>

              {/* Portfolio */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
                  <Globe size={16} className="text-[#0f766e]" />
                  Portfolio <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={portfolio}
                  onChange={(e) => {
                    setPortfolio(e.target.value);
                    if (errors.portfolio) setErrors((p) => ({ ...p, portfolio: "" }));
                  }}
                  className={`h-12 w-full rounded-xl border px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] ${
                    errors.portfolio ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.portfolio && (
                  <p className="mt-1 text-xs text-red-500">{errors.portfolio}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="h-12 w-full rounded-xl bg-[#0f766e] text-white font-medium text-sm hover:bg-[#0e6d65] transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default CompleteProfile;
