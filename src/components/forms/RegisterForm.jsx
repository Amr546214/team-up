import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Code2, Building2, Shield, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  registerUser,
  findUserByEmail,
} from "../../services/fakeApi";
import { useAuth } from "../../hooks/useAuth";
import { signInWithGoogle, signInWithGitHub, signInWithLinkedIn } from "../../lib/supabaseAuth";

// -------------- CONSTANTS -------------- //
const roles = [
  { id: "client", label: "client", icon: User },
  { id: "developer", label: "Developer", icon: Code2 },
  { id: "company", label: "Company", icon: Building2 },
  { id: "admin", label: "Admin", icon: Shield },
];

const skillsOptions = [
  "React",
  "Node.js",
  "Python",
  "AI",
  "UI/UX",
  "DevOps",
  "Flutter",
];

const initialFormData = {
  // client
  clientFullName: "",
  clientEmail: "",
  clientPassword: "",
  clientConfirmPassword: "",
  clientServices: "",
  // developer
  devFullName: "",
  devEmail: "",
  devPassword: "",
  devConfirmPassword: "",
  devSkillsInput: "",
  // company
  companyName: "",
  companyEmail: "",
  companyPassword: "",
  companyConfirmPassword: "",
  companySize: "",
  companyIndustry: "",
  // admin
  adminCode: "",
  adminEmail: "",
  adminPassword: "",
};

const initialShowPassword = {
  clientPassword: false,
  clientConfirmPassword: false,
  devPassword: false,
  devConfirmPassword: false,
  companyPassword: false,
  companyConfirmPassword: false,
  adminPassword: false,
  adminCode: false,
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const preselectedRole = searchParams.get("role");
  const [activeRole, setActiveRole] = useState("client");
  const [authTab, setAuthTab] = useState("register");

  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(initialShowPassword);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // -------------- HANDLERS -------------- //
  const toggleShowPassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = formData.devSkillsInput.trim();
      if (value && !selectedSkills.includes(value)) {
        setSelectedSkills((prev) => [...prev, value]);
      }
      setFormData((prev) => ({ ...prev, devSkillsInput: "" }));
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeRole === "client") {
      if (formData.clientPassword !== formData.clientConfirmPassword) {
        window.alert("Passwords do not match.");
        return;
      }
    }
    if (activeRole === "developer") {
      if (formData.devPassword !== formData.devConfirmPassword) {
        window.alert("Passwords do not match.");
        return;
      }
    }
    if (activeRole === "company") {
      if (formData.companyPassword !== formData.companyConfirmPassword) {
        window.alert("Passwords do not match.");
        return;
      }
    }

    let email = "";
    let password = "";
    let profile = {};

    if (activeRole === "client") {
      email = formData.clientEmail;
      password = formData.clientPassword;
      profile = {
        fullName: formData.clientFullName,
        services: formData.clientServices,
      };
    } else if (activeRole === "developer") {
      email = formData.devEmail;
      password = formData.devPassword;
      profile = {
        fullName: formData.devFullName,
        skills: [...selectedSkills],
      };
    } else if (activeRole === "company") {
      email = formData.companyEmail;
      password = formData.companyPassword;
      profile = {
        companyName: formData.companyName,
        size: formData.companySize,
        industry: formData.companyIndustry,
      };
    } else if (activeRole === "admin") {
      email = formData.adminEmail;
      password = formData.adminPassword;
      profile = {
        adminCode: formData.adminCode,
      };
    }

    // Required-field guard (extra safety beyond HTML "required")
    if (!String(email || "").trim() || !String(password || "").trim()) {
      window.alert("Please fill in all required fields.");
      return;
    }
    if (activeRole === "client") {
      if (!String(formData.clientFullName || "").trim() || !String(formData.clientServices || "").trim()) {
        window.alert("Please fill in all required fields.");
        return;
      }
    }
    if (activeRole === "developer") {
      if (!String(formData.devFullName || "").trim()) {
        window.alert("Please fill in all required fields.");
        return;
      }
    }
    if (activeRole === "company") {
      if (
        !String(formData.companyName || "").trim() ||
        !String(formData.companySize || "").trim() ||
        !String(formData.companyIndustry || "").trim()
      ) {
        window.alert("Please fill in all required fields.");
        return;
      }
    }
    if (activeRole === "admin") {
      if (!String(formData.adminCode || "").trim()) {
        window.alert("Please fill in all required fields.");
        return;
      }
    }

    const existing = findUserByEmail(email);
    if (existing) {
      window.alert("Email already exists");
      return;
    }

    const name = profile.fullName || profile.companyName || "";
    const result = registerUser({
      name,
      email,
      password,
      role: activeRole,
      profile,
    });

    if (!result.success) {
      window.alert(result.message || "Registration failed.");
      return;
    }

    // Registration successful - user is already logged in (auto-login)
    // Sync AuthContext session with the newly registered user in localStorage
    refreshSession();

    // Navigate to appropriate page based on role
    const roleRedirects = {
      client: "/client/profile",
      developer: "/skill-quiz", // Developers need to complete quiz first
      company: "/company/profile",
      admin: "/",
    };
    const targetRoute = roleRedirects[activeRole] || "/";

    setFormData(initialFormData);
    setSelectedSkills([]);
    setShowPassword(initialShowPassword);
    setActiveRole("client");
    setAuthTab("register");
    navigate(targetRoute);
  };

  React.useEffect(() => {
    if (!preselectedRole) return;
    if (roles.some((role) => role.id === preselectedRole)) {
      setActiveRole(preselectedRole);
    }
  }, [preselectedRole]);

  return (
    <div
      className="bg-white rounded-[18px] shadow-[0_18px_40px_rgba(0,0,0,0.08)] border border-gray-100 
                 px-6 py-6 sm:px-8 sm:py-8 min-h-[520px] flex flex-col"
    >
      {/* Role Tabs container */}
      <div className="mb-5">
        <div className="w-full flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2 gap-1">
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = activeRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveRole(role.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition
                ${
                  isActive
                    ? "bg-[#0B6F6C] text-white"
                    : "bg-transparent text-gray-700 hover:bg-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize">{t(`auth.${role.id}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Login / Register toggle */}
      <div className="mb-4">
        <div className="w-[88%] mx-auto rounded-xl bg-[#C7E8E5] flex p-1">
          <button
            type="button"
            onClick={() => {
              setAuthTab("login");
              navigate("/login");
            }}
            className={`flex-1 text-sm sm:text-base py-2 rounded-lg font-medium transition
            ${
              authTab === "login"
                ? "bg-white border border-[#0B6F6C] text-[#0B6F6C] shadow-sm"
                : "bg-transparent text-gray-700"
            }`}
          >
            {t("auth.signIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("register");
              navigate("/register");
            }}
            className={`flex-1 text-sm sm:text-base py-2 rounded-lg font-medium transition
            ${
              authTab === "register"
                ? "bg-white border border-[#0B6F6C] text-[#0B6F6C] shadow-sm"
                : "bg-transparent text-gray-700"
            }`}
          >
            {t("common.register")}
          </button>
        </div>
      </div>

      {/* سطر ثابت فوق الفورم عشان المكان مايتغيّرش بين الأدوار */}
      <p className="text-xs sm:text-sm text-gray-600 mb-4 min-h-[18px]">
        {activeRole === "company"
          ? t("auth.registerSubtitle")
          : "\u00A0"}
      </p>

      {/* FORMS */}
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* CLIENT */}
        {activeRole === "client" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.fullName")}
                </label>
                <input
                  type="text"
                  name="clientFullName"
                  value={formData.clientFullName}
                  onChange={handleChange}
                  placeholder="Cody Fisher"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  placeholder="deanna.curtis@example.com"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.clientPassword ? "text" : "password"}
                    name="clientPassword"
                    value={formData.clientPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("clientPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.clientPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={
                      showPassword.clientConfirmPassword ? "text" : "password"
                    }
                    name="clientConfirmPassword"
                    value={formData.clientConfirmPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("clientConfirmPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.clientConfirmPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* What services dropdown */}
            <div className="w-full sm:w-4/5 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("auth.whatServices")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                name="clientServices"
                value={formData.clientServices}
                onChange={handleChange}
                className="w-full h-12 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                required
              >
                <option value="">{t("auth.selectService")}</option>
                <option value="web-dev">{t("auth.webDev")}</option>
                <option value="mobile-dev">{t("auth.mobileDev")}</option>
                <option value="ui-ux">{t("auth.uiux")}</option>
                <option value="ai-ml">{t("auth.aiMl")}</option>
                <option value="other">{t("auth.other")}</option>
              </select>
            </div>
          </>
        )}

        {/* DEVELOPER */}
        {activeRole === "developer" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.fullName")}
                </label>
                <input
                  type="text"
                  name="devFullName"
                  value={formData.devFullName}
                  onChange={handleChange}
                  placeholder="Cody Fisher"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  name="devEmail"
                  value={formData.devEmail}
                  onChange={handleChange}
                  placeholder="deanna.curtis@example.com"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.devPassword ? "text" : "password"}
                    name="devPassword"
                    value={formData.devPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("devPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.devPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.devConfirmPassword ? "text" : "password"}
                    name="devConfirmPassword"
                    value={formData.devConfirmPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("devConfirmPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.devConfirmPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Skills pills + input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("auth.skills")}
              </label>
              <div className="w-full min-h-[44px] rounded-lg border border-gray-200 px-3 py-2 text-sm flex flex-wrap gap-2 items-center">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-[#C9E6E4] px-3 py-1 text-xs"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-gray-600 text-[10px] leading-none"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  name="devSkillsInput"
                  value={formData.devSkillsInput}
                  onChange={handleChange}
                  onKeyDown={addCustomSkill}
                  placeholder={t("auth.addSkills")}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">{t("auth.skills")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-700">
                {skillsOptions.map((skill) => (
                  <label
                    key={skill}
                    className="inline-flex items-center gap-1.5"
                  >
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 border-gray-300 rounded"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* COMPANY */}
        {activeRole === "company" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.companyName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="TeamUp Inc."
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.companyEmail")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="TeamUp@example.com"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.password")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.companyPassword ? "text" : "password"}
                    name="companyPassword"
                    value={formData.companyPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("companyPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.companyPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.confirmPassword")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={
                      showPassword.companyConfirmPassword ? "text" : "password"
                    }
                    name="companyConfirmPassword"
                    value={formData.companyConfirmPassword}
                    onChange={handleChange}
                    placeholder="***********"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      toggleShowPassword("companyConfirmPassword")
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.companyConfirmPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.companySize")} <span className="text-red-500">*</span>
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                >
                  <option value="">{t("auth.selectCompanySize")}</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>

            {/* Industry عرض أقل */}
            <div className="w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("auth.industry")} <span className="text-red-500">*</span>
              </label>
              <select
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleChange}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                required
              >
                <option value="">{t("auth.selectIndustry")}</option>
                <option value="software">{t("auth.software")}</option>
                <option value="design">{t("auth.design")}</option>
                <option value="finance">{t("auth.finance")}</option>
                <option value="other">{t("auth.other")}</option>
              </select>
            </div>
          </>
        )}

        {/* ADMIN */}
        {activeRole === "admin" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Code */}
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.adminCode")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.adminCode ? "text" : "password"}
                    name="adminCode"
                    value={formData.adminCode}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword("adminCode")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                  >
                    {showPassword.adminCode ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("auth.email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
              </div>
            </div>

            {/* Password نفس عرض Admin Code */}
            <div className="w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("auth.password")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.adminPassword ? "text" : "password"}
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="***********"
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 pr-10 text-sm outline-none focus:border-[#0B6F6C] focus:ring-1 focus:ring-[#0B6F6C]"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("adminPassword")}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showPassword.adminPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="pt-2 space-y-3 flex flex-col items-center">
          <button
            type="submit"
            className="w-full sm:w-3/4 max-w-sm h-11 rounded-lg text-sm sm:text-base font-semibold bg-[#0B6F6C] text-white hover:bg-[#0a5a59] transition"
          >
            {t("auth.createAccount")}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full sm:w-3/4 max-w-sm h-11 rounded-lg text-sm sm:text-base font-semibold border border-[#0B6F6C] text-[#0B6F6C] bg-white hover:bg-[#C7E8E5]/40 transition"
          >
            {t("auth.signupLater")}
          </button>
        </div>

        {/* OR CONTINUE WITH بدون خطوط */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm text-center text-gray-500 mb-5">
            {t("auth.orContinueWith")}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-7">
            <button
              type="button"
              onClick={() => signInWithGoogle(activeRole)}
              className="flex h-[44px] items-center justify-center rounded-[12px] border border-[#D9DEE7] bg-white transition hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Continue with Google"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[20px] w-[20px]"
                aria-hidden="true"
              >
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.29h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.63Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.25 14.28A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.37-2.28V6.6H1.25A12 12 0 0 0 0 12c0 1.93.46 3.76 1.25 5.4l4-3.12Z" />
                <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.11 15.23 0 12 0A12 12 0 0 0 1.25 6.6l4 3.12c.95-2.85 3.61-4.97 6.75-4.97Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => signInWithGitHub(activeRole)}
              className="flex h-[44px] items-center justify-center rounded-[12px] border border-[#D9DEE7] bg-white transition hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Continue with GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[20px] w-[20px] fill-[#4B5563]"
                aria-hidden="true"
              >
                <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.41-4.04-1.41-.55-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.08 1.83 2.83 1.3 3.52 1 .1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.32-5.47-5.9 0-1.3.47-2.36 1.23-3.2-.12-.3-.53-1.5.12-3.13 0 0 1-.32 3.3 1.22A11.5 11.5 0 0 1 12 6.3c1.02 0 2.04.14 3 .4 2.29-1.54 3.29-1.22 3.29-1.22.65 1.63.24 2.83.12 3.13.77.84 1.23 1.9 1.23 3.2 0 4.6-2.8 5.6-5.48 5.9.43.37.82 1.1.82 2.22v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => signInWithLinkedIn(activeRole)}
              className="flex h-[44px] items-center justify-center rounded-[12px] border border-[#D9DEE7] bg-white transition hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Continue with LinkedIn"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[20px] w-[20px]"
                aria-hidden="true"
              >
                <path
                  fill="#4B5563"
                  d="M6.94 8.5A1.56 1.56 0 1 0 6.94 5.38 1.56 1.56 0 0 0 6.94 8.5ZM5.6 9.78h2.67V18H5.6V9.78Zm4.35 0h2.56v1.12h.04c.36-.68 1.23-1.4 2.53-1.4 2.7 0 3.2 1.73 3.2 3.98V18H15.6v-3.98c0-.95-.02-2.17-1.36-2.17-1.36 0-1.57 1.03-1.57 2.1V18H9.95V9.78Z"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="pt-4 text-xs sm:text-sm text-center text-gray-500">
          {t("auth.hasAccount")}{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[#0B6F6C] font-medium"
          >
            {t("auth.signIn")}
          </button>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;