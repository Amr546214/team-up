import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import ClientSidebar from "../../components/common/ClientSidebar";
import { Users, Sparkles, Zap, ArrowLeft } from "lucide-react";

const BuildTeamOptions = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: "Build Manually",
      description: "Select developers yourself and create your team step by step.",
      icon: <Users className="text-[#0B6F6C]" size={32} />,
      buttonText: "Start Manual Build",
      path: "/client/build-team/manual",
    },
    {
      title: "Build with AI",
      description: "Let TeamUp AI help you choose the best team members based on your project needs.",
      icon: <Sparkles className="text-[#0B6F6C]" size={32} />,
      buttonText: "Use AI Helper",
      path: "/client/build-team/ai",
    },
    {
      title: "Auto Suggest Full Team",
      description: "Let the system suggest a complete ready team for your project automatically.",
      icon: <Zap className="text-[#0B6F6C]" size={32} />,
      buttonText: "Auto Suggest Team",
      path: "/client/build-team/auto",
    },
  ];

  return (
    <div className="flex h-screen bg-[#F0FDFA]">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#0B6F6C] transition mb-6"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
                Choose How to Build Your Team
              </h1>
              <p className="text-[#4B5563] text-lg">
                Select the best way to create a team for your project.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-[20px] shadow-sm border border-[#E5E7EB] flex flex-col items-center text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-[#F0FDFA] rounded-full flex items-center justify-center mb-6">
                    {option.icon}
                  </div>
                  <h2 className="text-xl font-bold text-[#111827] mb-3">
                    {option.title}
                  </h2>
                  <p className="text-[#6B7280] text-[15px] mb-8 flex-1">
                    {option.description}
                  </p>
                  <button
                    onClick={() => navigate(option.path)}
                    className="w-full py-3 px-4 bg-[#0B6F6C] text-white rounded-xl font-semibold hover:bg-[#095c5a] transition duration-200"
                  >
                    {option.buttonText}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BuildTeamOptions;
