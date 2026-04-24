import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState("client");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const isAdmin = userType === "admin";

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };

    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Please enter your email";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Please enter your password";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setShowPassword(false);
    setErrors({
      email: "",
      password: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    const authResult = login(email, password, userType, rememberMe);
    if (!authResult.ok) {
      if (authResult.reason === "not_found") {
        setErrors({ email: "", password: "Account not found. Please register first." });
        return;
      }
      if (authResult.reason === "bad_password") {
        setErrors({ email: "", password: "Incorrect password." });
        return;
      }
      if (authResult.reason === "skill_quiz_required") {
        setErrors({
          email: "",
          password: "Please complete the skill quiz before logging in.",
        });
        return;
      }
      setErrors({ email: "", password: "Login failed." });
      return;
    }

    const roleRedirects = {
      client: "/client/profile",
      developer: "/developer/dashboard",
      company: "/company/profile",
      admin: "/",
    };
    const targetRoute = roleRedirects[userType];

    resetForm();
    navigate(targetRoute);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="main-container">
        <div className="bg-white rounded-[20px] p-8">
          {/* -------------------- user type tabs -------------------- */}
          <div className="mb-8">
            <div className="flex items-center justify-between bg-gray-100 rounded-[10px] px-3 py-2">
              {/* client */}
              <button
                type="button"
                onClick={() => setUserType("client")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
                  userType === "client"
                    ? "text-white shadow-sm"
                    : "text-gray-900"
                }`}
                style={
                  userType === "client" ? { backgroundColor: "#0B6F6C" } : {}
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>client</span>
              </button>

              {/* developer */}
              <button
                type="button"
                onClick={() => setUserType("developer")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
                  userType === "developer"
                    ? "text-white shadow-sm"
                    : "text-gray-900"
                }`}
                style={
                  userType === "developer" ? { backgroundColor: "#0B6F6C" } : {}
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                <span>Developer</span>
              </button>

              {/* company */}
              <button
                type="button"
                onClick={() => setUserType("company")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
                  userType === "company"
                    ? "text-white shadow-sm"
                    : "text-gray-900"
                }`}
                style={
                  userType === "company" ? { backgroundColor: "#0B6F6C" } : {}
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Company</span>
              </button>

              {/* admin */}
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition ${
                  userType === "admin"
                    ? "text-white shadow-sm"
                    : "text-gray-900"
                }`}
                style={
                  userType === "admin" ? { backgroundColor: "#0B6F6C" } : {}
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 12a3 3 0 100-6 3 3 0 0 0 0 6zm0 2c-2.21 0-4 1.34-4 3v1h8v-1c0-1.66-1.79-3-4-3zM17 8l1-2 1 2 2 .5-1.5 1.5.3 2.1L18 13l-1.8 1.1.3-2.1L15 8.5 17 8z"
                  />
                </svg>
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* -------------------- Auth mode -------------------- */}
          <div className="mb-6 flex justify-center">
            <div
              className="flex items-center justify-between rounded-[10px] px-[10px] w-[420px] h-[50px]"
              style={{ backgroundColor: "#C7E8E5" }}
            >
<button
  onClick={() => setAuthMode("login")}
  type="button"
  className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center rounded-[10px] transition ${
    authMode === "login"
      ? "bg-white border border-[#0B6F6C] text-[#0B6F6C]"
      : "bg-transparent text-[#0B6F6C]"
  }`}
>
  Login
</button>

<button
  onClick={() => {
    setAuthMode("register");
    navigate("/register");
  }}
  type="button"
  className={`flex-1 py-2.5 text-sm font-medium rounded-[10px] transition ${
    authMode === "register"
      ? "bg-white border text-teal-600 shadow-sm"
      : "text-teal-700"
  }`}
>
  Register
</button>
            </div>
          </div>

          {/* Admin only info */}
          {isAdmin && authMode === "login" && (
            <div className="mb-5 flex items-center gap-2 text-[13px] text-[#8B95A7]">
              <ShieldCheck size={16} strokeWidth={1.8} />
              <span>2FA required after login</span>
            </div>
          )}

          {/* -------------------- Form -------------------- */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5 w-[380px] mx-auto translate-x-[5px]"
          >
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);

                  setErrors((prev) => ({
                    ...prev,
                    email: value.trim()
                      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                        ? ""
                        : "Please enter a valid email"
                      : "Please enter your email",
                  }));
                }}
                placeholder="kenzo.lawson@example.com"
                className={`w-full h-[40px] px-4 py-3 border rounded-xl outline-none transition ${
                  errors.email
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                }`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);

                    setErrors((prev) => ({
                      ...prev,
                      password: value.trim()
                        ? ""
                        : "Please enter your password",
                    }));
                  }}
                  placeholder="DJCAB-JODVOR-RIFGE8"
                  className={`w-full h-[40px] px-4 pr-12 border rounded-xl outline-none transition ${
                    errors.password
                      ? "border-red-500 focus:ring-2 focus:ring-red-400"
                      : "border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* REMEMBER + FORGOT */}
            <div className="flex items-center justify-between w-full">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-600"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>

              <a href="#" className="text-sm text-teal-600 hover:text-teal-700">
                Forgot your password?
              </a>
            </div>

            {/* LOGIN AS LINK */}
            <a
              href="#"
              onClick={handleLoginClick}
              className="w-[340px] h-[40px] mx-auto bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition font-medium flex items-center justify-center cursor-pointer"
            >
              Login
            </a>

            {/* Admin secure message only */}
            {isAdmin && authMode === "login" && (
              <div className="flex items-start gap-2 text-[12px] leading-5 text-[#8B95A7] px-1">
                <Lock size={15} strokeWidth={1.8} className="mt-[2px] shrink-0" />
                <p>
                  Your information is secure we use industry-standard
                  encryption
                </p>
              </div>
            )}

            {/* Social login only for non-admin */}
            {!isAdmin && (
              <div className="mt-4">
                <p className="text-center text-[12px] font-medium uppercase tracking-wide text-[#98A2B3]">
                  OR CONTINUE WITH
                </p>

                <div className="mt-6 grid grid-cols-3 gap-7">
                  <a
                    href="https://accounts.google.com/"
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
                  </a>

                  <a
                    href="https://github.com/"
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
                  </a>

                  <a
                    href="https://www.linkedin.com/"
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
                  </a>
                </div>
              </div>
            )}

            <p
              className={`text-center text-[13px] text-[#667085] ${
                isAdmin ? "mt-8" : "mt-6"
              }`}
            >
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register");
                }}
                className="font-semibold text-[#0B6F6C] hover:underline cursor-pointer"
              >
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;