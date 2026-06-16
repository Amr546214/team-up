import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import ClientSidebar from "../../components/common/ClientSidebar";
import { ArrowLeft, Users, UserCheck, ClipboardList } from "lucide-react";

const ManualBuildTeam = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#F0FDFA]">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => navigate("/client/build-team")}
              className="flex items-center gap-2 text-[#6B7280] hover:text-[#0B6F6C] transition mb-6"
            >
              <ArrowLeft size={20} />
              <span>Back to Options</span>
            </button>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#111827]">Manual Build Team</h1>
              <p className="text-[#6B7280]">
                Select developers manually and organize them into a team.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Available Developers */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-[#0B6F6C]" size={24} />
                    <h2 className="text-lg font-bold text-[#111827]">Available Developers</h2>
                  </div>
                  <div className="py-12 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl">
                    <p className="text-[#9CA3AF]">List of developers will appear here.</p>
                  </div>
                </section>
              </div>

              {/* Sidebar: Selected & Requirements */}
              <div className="space-y-6">
                <section className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="text-[#0B6F6C]" size={24} />
                    <h2 className="text-lg font-bold text-[#111827]">Selected Team Members</h2>
                  </div>
                  <div className="py-8 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl">
                    <p className="text-[#9CA3AF]">No members selected yet.</p>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-[20px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="text-[#0B6F6C]" size={24} />
                    <h2 className="text-lg font-bold text-[#111827]">Team Requirements</h2>
                  </div>
                  <div className="py-8 text-center border-2 border-dashed border-[#E5E7EB] rounded-xl">
                    <p className="text-[#9CA3AF]">Define your team needs here.</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManualBuildTeam;
