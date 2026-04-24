import Header from "../../components/common/Header";
import heroImage from "../../assets/images/image.png";
import { Link, useNavigate } from "react-router-dom";
import footerLogo from "../../assets/logo/teamup-logo.png";
import { useAuth } from "../../context/AuthContext";

import {
  UserPlus,
  FileText,
  Users,
  ClipboardList,
  Star,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Trophy,
  CheckCircle, User2,
  BriefcaseBusiness, CodeXml, Building2, Check,
  Github, Linkedin, Mail
} 
from "lucide-react";

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

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated && session?.role) {
      navigate(getDashboardPathByRole(session.role));
    } else {
      navigate("/register");
    }
  };

  const handleSignUp = (role) => {
    if (isAuthenticated && session?.role) {
      // Already logged in, go to dashboard
      navigate(getDashboardPathByRole(session.role));
    } else {
      navigate(`/register?role=${role}`);
    }
  };

  return (
    <div className="bg-[#F5FAFA] min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-[#F5FAFA] min-h-[calc(100vh-4rem)] w-full flex items-center overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-16 py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Text Box */}
            <div className="flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left">

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F172A] leading-tight">
                Build high-performance{" "}
                <span className="text-[#0B6F6C]">teams</span> with smart
                matching.
              </h1>

              {/* Description */}
              <p className="mt-6 text-lg text-[#64748B] max-w-xl leading-relaxed mx-auto lg:mx-0">
                TeamUp Connects Freelancers, developers, designers, and companies
                through AI-powered team building. Find the right people, manage
                projects and grow together.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto h-12 px-8 bg-[#0B6F6C] text-white rounded-md hover:bg-[#15807d] transition font-medium flex items-center justify-center"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                </button>

                <a
                  href="#features"
                  className="w-full sm:w-auto h-12 px-8 border border-[#0B6F6C] text-[#0B6F6C] rounded-md hover:bg-[#e6f3f2] transition font-medium flex items-center justify-center"
                >
                  Learn More
                </a>
              </div>

            </div>

            {/* Image */}
            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
              <img
                src={heroImage}
                alt="team illustration"
                className="w-full max-w-[320px] md:max-w-[480px] lg:max-w-[600px] object-contain rounded-[100px] lg:rounded-[150px]"
              />
            </div>

          </div>
        </div>
      </section>

{/* section 2 how it work & choos your role */}
      
 <section className="bg-[#F5FAFA]">
  {/* How It Work */}
  <div className="bg-white px-6 md:px-10 py-10">
    <h2 className="text-center text-[24px] md:text-[32px] font-bold text-[#111827] mb-12">
      How It Work
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <button
        onClick={() => handleSignUp("client")}
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition text-left">
            
        <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
          <UserPlus size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
          Create your account
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Choose your role
          <br />
          and complete your profile
        </p>
      </button>

      <Link
        to="/projects"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
          <FileText size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
          Post or apply
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Clients post projects.
          <br />
          Developers apply or get invited
        </p>
      </Link>

      <Link
        to="/teams"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
          <Users size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
          Build teams
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Manually, with AI help,
          <br />
          or auto-suggested teams.
        </p>
      </Link>

      <Link
        to="/dashboard"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
          <ClipboardList size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
          Work & track
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Manage tasks, chat,
          <br />
          and monitor progress.
        </p>
      </Link>

      <Link
        to="/profile"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-full bg-[#D8F0EC] flex items-center justify-center mx-auto mb-4 text-[#0B6F6C]">
          <Star size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-2">
          Rate & grow
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Feedback improves
          <br />
          ranking and future matching.
        </p>
      </Link>
    </div>
  </div>

  {/* Choose your role */}
  <div className="bg-[#F5FAFA] px-6 md:px-10 py-12">
    <h2 className="text-center text-[24px] md:text-[32px] font-bold text-[#111827] mb-12">
    Choose your role
    </h2>

    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link
        to="/ai-team-builder"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center mb-5 text-[#0B6F6C]">
          <Sparkles size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
          AI Team Builder
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Suggests the best team based on skills,
          <br />
          experience, and availability.
        </p>
      </Link>

      <Link
        to="/performance-tracking"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center mb-5 text-[#0B6F6C]">
          <TrendingUp size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
          Performance Tracking
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Track tasks, deadlines, and team progress
          <br />
          in real-time.
        </p>
      </Link>

      <Link
        to="/chatbot"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">

        <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center mb-5 text-[#0B6F6C]">
          <MessageSquare size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
          Smart Chatbot
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Ask about projects, tasks, deadlines, or
          <br />
          hiring instantly.
        </p>
      </Link>

      <Link
        to="/ranking-system"
        className="bg-white border border-[#D9E3E2] rounded-[8px] px-5 py-6 hover:shadow-md transition">
            
        <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center mb-5 text-[#0B6F6C]">
          <Trophy size={18} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#111827] mb-3">
          Ranking System
        </h3>
        <p className="text-[14px] leading-7 text-[#6B7280]">
          Developers grow their rank based on
          <br />
          performance and reviews.
        </p>
       </Link>
     </div>
   </div>
 </section>

 {/* Section 3 - Stats */}
<section className="bg-[#ffffff] py-16 px-6 md:px-10">

{/* Title */}
<h2 className="text-center text-[26px] md:text-[32px] font-semibold text-[#111827] mb-12">
  Trusted by teams and professionals
</h2>

{/* Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">

  {/* Card 1 */}
  <div className="bg-[#F9FBFB] border border-[#E5EDED] rounded-[10px] px-8 py-6 text-center">
    <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C]">
      <Users size={18} />
    </div>
    <h3 className="text-[20px] font-semibold text-[#111827]">50,000+</h3>
    <p className="text-[14px] text-[#6B7280] mt-1">Total Users</p>
  </div>

  {/* Card 2 */}
  <div className="bg-[#F9FBFB] border border-[#E5EDED] rounded-[10px] px-8 py-6 text-center">
    <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C]">
      <CheckCircle size={18} />
    </div>
    <h3 className="text-[20px] font-semibold text-[#111827]">12,500+</h3>
    <p className="text-[14px] text-[#6B7280] mt-1">Projects Completed</p>
  </div>

  {/* Card 3 */}
  <div className="bg-[#F9FBFB] border border-[#E5EDED] rounded-[10px] px-8 py-6 text-center">
    <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C]">
      <User2 size={18} />
    </div>
    <h3 className="text-[20px] font-semibold text-[#111827]">3,200+</h3>
    <p className="text-[14px] text-[#6B7280] mt-1">Active Teams</p>
  </div>

  {/* Card 4 */}
  <div className="bg-[#F9FBFB] border border-[#E5EDED] rounded-[10px] px-8 py-6 text-center">
    <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C]">
      <Star size={18} />
    </div>
    <h3 className="text-[20px] font-semibold text-[#111827]">4.8/5</h3>
    <p className="text-[14px] text-[#6B7280] mt-1">Average Rating</p>
  </div>

</div>
</section>
{/* Section 3 - Part 2 */}
<section className="bg-[#F5FAFA] px-5 md:px-8 py-16">
  <h2 className="text-center text-[26px] md:text-[32px] font-semibold text-[#111827] mb-12">
    Ready to build or join your next team?
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-15">
    {/* Client Card */}
    <div className="bg-white rounded-[10px] px-3 py-3 border border-[#E3ECEB]">
      <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C] mb-5">
        <BriefcaseBusiness size={18} />
      </div>

      <h3 className="text-[18px] font-semibold text-[#111827] mb-5">Client</h3>

      <p className="text-[15px] leading-8 text-[#5F6B76] mb-5">
        Post projects, find skilled developers, and
        <br />
        build custom teams for your needs.
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Post unlimited projects</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>AI team suggestions</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Rate team members</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Track project progress</span>
        </div>
      </div>

      <button
        onClick={() => handleSignUp("client")}
        className="block w-full text-center border border-[#0B6F6C] text-[#0B6F6C] rounded-[8px] py-3 text-[15px] font-medium hover:bg-[#EAF6F5] transition"
      >
        {isAuthenticated ? "Go to Dashboard" : "Sign up as client"}
      </button>
    </div>

    {/* Developer Card */}
    <div className="bg-white rounded-[10px] px-5 py-5 border border-[#E3ECEB]">
      <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C] mb-5">
        <CodeXml size={18} />
      </div>

      <h3 className="text-[18px] font-semibold text-[#111827] mb-5">Developer</h3>

      <p className="text-[15px] leading-8 text-[#5F6B76] mb-5">
        Apply to projects, join teams, and grow
        <br />
        your professional ranking.
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Browse open projects</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Get AI-matched invites</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Build your reputation</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Earn performance badges</span>
        </div>
      </div>

      <button
        onClick={() => handleSignUp("developer")}
        className="block w-full text-center border border-[#0B6F6C] text-[#0B6F6C] rounded-[8px] py-3 text-[15px] font-medium hover:bg-[#EAF6F5] transition"
      >
        {isAuthenticated ? "Go to Dashboard" : "Sign up as Developer"}
      </button>
    </div>

    {/* Company Card */}
    <div className="bg-white rounded-[10px] px-5 py-5 border border-[#E3ECEB]">
      <div className="w-10 h-10 rounded-[8px] bg-[#D8F0EC] flex items-center justify-center text-[#0B6F6C] mb-5">
        <Building2 size={18} />
      </div>

      <h3 className="text-[18px] font-semibold text-[#111827] mb-5">Company</h3>

      <p className="text-[15px] leading-8 text-[#5F6B76] mb-5">
        Hire developers, manage internal teams,
        <br />
        and scale your workforce.
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Post job openings</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Access talent pool</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Manage multiple teams</span>
        </div>

        <div className="flex items-center gap-3 text-[15px] text-[#4B5563]">
          <Check size={16} className="text-[#0B6F6C]" />
          <span>Analytics & reporting</span>
        </div>
      </div>

      <button
        onClick={() => handleSignUp("company")}
        className="block w-full text-center border border-[#0B6F6C] text-[#0B6F6C] rounded-[8px] py-3 text-[15px] font-medium hover:bg-[#EAF6F5] transition"
      >
        {isAuthenticated ? "Go to Dashboard" : "Sign up as Company"}
      </button>
    </div>
  </div>
</section>

{/* Footer */}
<footer className="bg-white px-7 md:px-10 py-10">
  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5">
    {/* Left */}
    <div className="max-w-sm">
      <div className="flex items-center gap-3 mb-5">
        <img
          src={footerLogo}
          alt="TeamUp logo"
          className="w-10 h-10 object-contain"
        />
        <h2 className="text-[22px] font-bold text-[#0B6F6C]">TeamUp</h2>
      </div>

      <p className="text-[15px] text-[#6B7280] leading-7 mb-14">
        Building teams, powering success.
      </p>

      <p className="text-[15px] text-[#4B5563]">
        © 2024 TeamUp. All rights reserved.
      </p>
    </div>

    {/* Right */}
    <div className="flex flex-col gap-8 lg:items-start">
      {/* Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 md:gap-20">
        {/* Product */}
        <div>
          <h3 className="text-[18px] font-bold text-[#111827] mb-5">
            Product
          </h3>

          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Features
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Pricing
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              How it Work
            </a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-[18px] font-bold text-[#111827] mb-5">
            Company
          </h3>

          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              About
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Blog
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Careers
            </a>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-[18px] font-bold text-[#111827] mb-5">
            Support
          </h3>

          <div className="flex flex-col gap-3">
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Helper Center
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Contact
            </a>
            <a
              href="#"
              className="block text-[15px] text-[#6B7280] hover:text-[#0B6F6C] transition"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>

      {/* Social Icons */}
      <div className="flex gap-6 justify-start">
        <a
          href="#"
          className="w-[110px] h-[42px] rounded-[10px] border border-[#E1E7E6] flex items-center justify-center text-[#4B5563] hover:text-[#0B6F6C] hover:border-[#0B6F6C] transition"
        >
          <Mail size={18} />
        </a>

        <a
          href="#"
          className="w-[110px] h-[42px] rounded-[10px] border border-[#E1E7E6] flex items-center justify-center text-[#4B5563] hover:text-[#0B6F6C] hover:border-[#0B6F6C] transition"
        >
          <Github size={18} />
        </a>

        <a
          href="#"
          className="w-[110px] h-[42px] rounded-[10px] border border-[#E1E7E6] flex items-center justify-center text-[#4B5563] hover:text-[#0B6F6C] hover:border-[#0B6F6C] transition"
        >
          <Linkedin size={18} />
        </a>
      </div>
    </div>
  </div>
</footer>

    </div>
  );
};

export default Home;