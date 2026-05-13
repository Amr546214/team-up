
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/common/Header";
import HeroSection from "../../components/common/HeroSection";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage({ type: "", text: "" });

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email must be valid.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://team-up-backend-production-6c43.up.railway.app/auth/send-forgot-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Reset link sent! Please check your email." });
      } else {
        setMessage({ type: "error", text: data.message || "Request failed. Please try again." });
      }
    } catch {
      setMessage({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col md:flex-row pt-16">
        {/* Left Section - Hero */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-white">
          <HeroSection />
        </div>
        
        {/* Right Section - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
                <p className="text-gray-600">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="kenzo.lawson@example.com"
                    className={`w-full h-[45px] px-4 border rounded-xl outline-none transition ${
                      error
                        ? "border-red-500 focus:ring-2 focus:ring-red-400"
                        : "border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                    }`}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </div>

                {message.text && (
                  <div className={`p-4 rounded-xl text-sm ${
                    message.type === "success" 
                      ? "bg-green-50 text-green-700 border border-green-100" 
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {message.text}

                    
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-[45px] bg-[#0B6F6C] text-white rounded-xl hover:bg-[#095a58] transition font-semibold flex items-center justify-center shadow-sm ${
                    loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : "Submit"}
                </button>

                <div className="text-center mt-6">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-[#0B6F6C] hover:underline transition-all"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
