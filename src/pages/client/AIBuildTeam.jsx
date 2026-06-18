import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import ClientSidebar from "../../components/common/ClientSidebar";
import PublishResultModal from "../../components/common/PublishResultModal";

const AIBuildTeam = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  const handleAcceptTeam = (acceptedJob) => {
    const raw = window.localStorage.getItem("client_jobs");
    const parsed = raw ? JSON.parse(raw) : [];
    const prev = Array.isArray(parsed) ? parsed : [];

    window.localStorage.setItem(
      "client_jobs",
      JSON.stringify([acceptedJob, ...prev])
    );

    navigate("/client/my-jobs");
  };

  const handleRejectTeam = () => {
    navigate("/client/build-team");
  };

  return (
    <div className="flex h-screen bg-[#F0FDFA]">
      <ClientSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto h-full">
            {job ? (
              <PublishResultModal
                job={job}
                onAcceptTeam={handleAcceptTeam}
                onRejectTeam={handleRejectTeam}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-white p-10 rounded-[20px] shadow-sm border border-[#E5E7EB] max-w-md w-full">
                  <h2 className="text-2xl font-bold text-[#111827] mb-4">
                    No published job found
                  </h2>
                  <p className="text-[#6B7280] mb-8">
                    To build a team with AI, you first need to publish a job.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => navigate("/client/job-post")}
                      className="w-full py-3 px-4 bg-[#0B6F6C] text-white rounded-xl font-semibold hover:bg-[#095c5a] transition duration-200"
                    >
                      Create New Job
                    </button>
                    <button
                      onClick={() => navigate("/client/build-team")}
                      className="w-full py-3 px-4 border border-[#E5E7EB] text-[#4B5563] rounded-xl font-semibold hover:bg-gray-50 transition duration-200"
                    >
                      Back to Build Team Options
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIBuildTeam;
