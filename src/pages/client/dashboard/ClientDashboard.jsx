import React from "react";
import Header from "../../../components/common/Header";
import ClientSidebar from "../../../components/common/ClientSidebar";
import { 
  FilePlus2, 
  Users, 
  UserRoundPlus, 
  Briefcase, 
  MessageCircle 
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import clientIllustration from "../../../assets/images/Client.png";

const ClientDashboard = () => {
  const { user } = useAuth();
  const clientName = user?.name || "Client";

  const steps = [
    {
      id: 1,
      title: "Post a New Job",
      description: "Create a job post with your project requirements and skills you need.",
      icon: <FilePlus2 size={24} />,
    },
    {
      id: 2,
      title: "Receive Proposals",
      description: "Developers will send you proposals. Review profiles, skills, and experience.",
      icon: <Users size={24} />,
    },
    {
      id: 3,
      title: "Build Your Team",
      description: "Select the best developers and build your perfect team.",
      icon: <UserRoundPlus size={24} />,
    },
    {
      id: 4,
      title: "Manage Your Projects",
      description: "Track progress, communicate with your team, and deliver great results.",
      icon: <Briefcase size={24} />,
    },
    {
      id: 5,
      title: "Chat & Stay Updated",
      description: "Use messages and notifications to stay connected with your team.",
      icon: <MessageCircle size={24} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5FAFA]">
      <Header />
      <ClientSidebar />
      
      <main className="pt-24 pl-64 pr-8 pb-8 transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {clientName}! 👋</h1>
            <p className="text-gray-600 mt-2 text-lg">Here's what you can do on TeamUp</p>
          </div>

          {/* Hero Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left Side: Image */}
              <div className="md:w-1/2 p-8 flex items-center justify-center bg-teal-50/30">
                <div className="relative w-full max-w-md">
                  <img 
                    src={clientIllustration} 
                    alt="Client illustration" 
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Let's build something great together
                  </h2>
                  <p className="text-gray-600">
                    TeamUp helps you create projects, find the right talent, and build successful teams.
                  </p>
                </div>

                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.id}>
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-[#0B6B63]">
                            {step.icon}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0B6B63] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                            {step.id}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      {index !== steps.length - 1 && (
                        <div className="h-px bg-gray-100 my-6 ml-16"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
