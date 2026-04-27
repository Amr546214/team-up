import React from "react";
import RegisterForm from "../../components/forms/RegisterForm";
import { Bell, Moon, CircleUser, Check } from "lucide-react";
import logo from "../../assets/logo/teamup-logo.png";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";

function getDashboardPathByRole(role) {
  switch (role) {
    case "client":
      return "/client/profile";
    case "developer":
      return "/developer/dashboard";
    case "company":
      return "/company/profile";
    case "admin":
      return "/";
    default:
      return "/";
  }
}

const Register = () => {
  const { isAuthenticated, session } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && session?.role) {
    return <Navigate to={getDashboardPathByRole(session.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F7FFFD] flex flex-col">
      {/* Top Header */}
      <header className="w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] h-16 flex items-center justify-between px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="TeamUp logo"
            className="w-12 h-12 object-contain"
          />
          <span className="text-xl font-semibold text-[#0E6B67]">TeamUp</span>
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-3 text-gray-500">
          <button className="relative w-11 h-11">
            <Bell className="w-6 h-6" />
          </button>
          <button className="w-9 h-9">
            <Moon className="w-6 h-6" />
          </button>
          <button className="w-9 h-9 rounded-full border border-gray-200 shadow-[0_3px_8px_rgba(0,0,0,0.08)] flex items-center justify-center bg-white">
            <CircleUser className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 lg:px-10 lg:py-12">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-10 lg:gap-14">

          {/* LEFT TEXT – ثابت ومش هيتحرك */}
     <section className="flex-1 flex flex-col justify-center h-fit mt-28">


            <div className="space-y-6 max-w-xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-gray-900">
                Create Your{" "}
                <span className="text-[#0E6B67]">Account</span>
                <br />
                Start{" "}
                <span className="text-[#0E6B67]">Building</span>
                <br />
                <span className="text-[#0E6B67]">Smarter</span>.
              </h1>

              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Join thousands of developers who are building the
                <br />
                future. Connect with top talent, work on exciting
                <br />
                projects, and grow your career with TeamUp&apos;s
                <br />
                innovative platform.
              </p>

              <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0B6F6C]" />
                  <span>Premium Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0B6F6C]" />
                  <span>Global Teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0B6F6C]" />
                  <span>Fair Compensation</span>
                </div>
              </div>
            </div>
          </section>

          
          <section className="flex-1 flex items-start justify-center">
            <div className="w-full max-w-xl">
              <RegisterForm />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Register;
