import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeveloperLayout from "../../layouts/DeveloperLayout";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  CalendarDays,
  CodeXml,
  Github,
  FileText,
  Sparkles,
  SendHorizontal,
} from "lucide-react";

function DeveloperProjectDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [projectData] = useState({
    id: id || "1",
    title: "E-commerce API Integration",
    status: "active",
    deadline: "Oct 24, 2026",
    description:
      "Develop and integrate a robust, scalable backend API for the new e-commerce platform. Focus on secure authentication, optimized database queries, and comprehensive documentation for frontend consumption.",
    role: "Senior Backend Engineer",
    timeline: {
      startDate: "Sep 01, 2026",
      endDate: "Oct 24, 2026",
    },
    skills: ["Node.js", "GraphQL", "AWS"],
  });

  const [teamData] = useState([
    { id: 1, name: "Hanan Muhammed", role: "Lead Backend", avatar: "", profileLink: "/developer/profile" },
    { id: 2, name: "Sara Muhammed", role: "Database Eng", avatar: "", profileLink: "/developer/profile" },
  ]);

  const [resourcesData] = useState({
    github: "https://github.com",
    drive: "https://drive.google.com",
    docs: "https://docs.google.com",
  });

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  /* =========================
     UI Logic
  ========================== */
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return { badge: "bg-[#EAF8EE] text-[#22C55E]", dot: "bg-[#22C55E]", label: "Active" };
      case "planned":
        return { badge: "bg-[#FEF3C7] text-[#D97706]", dot: "bg-[#D97706]", label: "Planned" };
      case "completed":
        return { badge: "bg-[#EEF2FF] text-[#4F46E5]", dot: "bg-[#4F46E5]", label: "Completed" };
      default:
        return { badge: "bg-[#F3F4F6] text-[#6B7280]", dot: "bg-[#9CA3AF]", label: status };
    }
  };

  const statusStyles = getStatusStyles(projectData.status);

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    setAiMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: aiInput }]);
    setAiLoading(true);
    const input = aiInput;
    setAiInput("");
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "ai", text: `AI response to: "${input}"` },
      ]);
      setAiLoading(false);
    }, 800);
  };

  return (
    <DeveloperLayout>
      <>
        <Header />
        <div className="min-h-screen bg-[#F5F9F9] mt-15 p-4 md:p-6 ml-[240px]">
          <div className="max-w-[1100px] mx-auto">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-14 h-14 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
              >
                <ArrowLeft size={24} className="text-[#111827]" />
              </button>

              <div className="flex-1">
                <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                  {projectData.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-6">
                  <span className={`h-11 px-5 rounded-full inline-flex items-center gap-3 ${statusStyles.badge}`}>
                    <span className={`w-3 h-3 rounded-full ${statusStyles.dot}`} />
                    <span className="text-base font-medium">{statusStyles.label}</span>
                  </span>
                  <span className="flex items-center gap-3 text-[#6B7280]">
                    <CalendarDays size={20} />
                    <span className="text-base font-medium">Deadline: {projectData.deadline}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.95fr] gap-6">
              {/* Left */}
              <div className="space-y-6">
                {/* Overview */}
                <section className="bg-white rounded-2xl p-6 md:p-8">
                  <h2 className="text-[20px] font-bold text-[#111827]">Project Overview</h2>
                  <p className="mt-6 text-base leading-8 text-[#6B7280]">{projectData.description}</p>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-base text-[#9CA3AF] mb-4">Role</p>
                      <div className="flex items-center gap-3">
                        <CodeXml size={24} className="text-[#14B8A6]" />
                        <span className="text-lg font-medium text-[#111827]">{projectData.role}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-base text-[#9CA3AF] mb-4">Timeline</p>
                      <p className="text-lg font-medium text-[#111827]">
                        {projectData.timeline.startDate} — {projectData.timeline.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="text-base text-[#9CA3AF] mb-4">Required Skills</p>
                    <div className="flex flex-wrap gap-3">
                      {projectData.skills.map((skill) => (
                        <span key={skill} className="px-5 py-2.5 rounded-xl bg-[#F3F4F6] text-[#4B5563] text-base font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              {/* Right */}
              <div className="space-y-6">
                {/* Team */}
                <section className="bg-white rounded-2xl p-6 md:p-8">
                  <h2 className="text-[20px] font-bold text-[#111827]">Team</h2>
                  <div className="mt-6 space-y-5">
                    {teamData.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-[#D9D9D9] shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-lg font-medium text-[#111827] truncate">{member.name}</h3>
                            <p className="text-[15px] text-[#9CA3AF] mt-1">{member.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(member.profileLink)}
                          className="h-10 px-5 rounded-xl border border-[#D1D5DB] text-[#6B7280] text-[15px] font-medium hover:bg-[#F8FAFC] transition shrink-0"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Resources */}
                <section className="bg-white rounded-2xl p-6 md:p-8">
                  <h2 className="text-[20px] font-bold text-[#111827]">Resources</h2>
                  <div className="mt-6 space-y-4">
                    <a href={resourcesData.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#111827] hover:text-[#0B8B84] transition">
                      <Github size={20} className="text-[#6B7280]" />
                      <span className="text-lg font-medium">GitHub Repository</span>
                    </a>
                    <a href={resourcesData.docs} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[#111827] hover:text-[#0B8B84] transition">
                      <FileText size={20} className="text-[#6B7280]" />
                      <span className="text-lg font-medium">API Documentation</span>
                    </a>
                  </div>
                </section>

                {/* AI Assistant */}
                <section className="bg-white rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-[#0B8B84]" />
                    <h2 className="text-[20px] font-bold text-[#111827]">AI Assistant</h2>
                  </div>
                  <p className="mt-4 text-base text-[#6B7280]">Need help with code or project context? Ask the AI</p>

                  {aiMessages.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                      {aiMessages.map((msg) => (
                        <div key={msg.id} className={`rounded-xl px-4 py-3 text-sm ${msg.sender === "user" ? "bg-[#F0FBFA] text-[#111827]" : "bg-[#F3F4F6] text-[#374151]"}`}>
                          {msg.text}
                        </div>
                      ))}
                      {aiLoading && <div className="rounded-xl px-4 py-3 text-sm bg-[#F3F4F6] text-[#6B7280]">AI is typing...</div>}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
                      placeholder="Ask AI"
                      className="flex-1 h-12 rounded-xl border border-[#D1D5DB] px-4 text-base outline-none"
                    />
                    <button onClick={handleAiSend} className="w-12 h-12 rounded-xl border border-[#64C7C2] text-[#0B8B84] flex items-center justify-center hover:bg-[#F0FBFA] transition">
                      <SendHorizontal size={20} />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </>
    </DeveloperLayout>
  );
}

export default DeveloperProjectDetails;
