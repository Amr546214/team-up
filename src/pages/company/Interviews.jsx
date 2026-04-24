import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  Plus,
  CalendarDays,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
} from "lucide-react";

function Interviews() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [upcoming] = useState([
    {
      id: 1,
      candidateName: "Emma Wilson",
      title: "Technical Interview - Senior Frontend Developer",
      date: "Feb 10, 2026",
      time: "10:00 AM",
      mode: "Video Call",
      meetingLink: "https://meet.google.com/abc",
      notes: "Focus on React architecture and system design.",
    },
    {
      id: 2,
      candidateName: "Ahmed Hassan",
      title: "First Round - UI/UX Designer",
      date: "Feb 12, 2026",
      time: "2:00 PM",
      mode: "Onsite",
      location: "Cairo Office",
      notes: "Bring portfolio and case studies.",
    },
    {
      id: 3,
      candidateName: "Fatima Nour",
      title: "Technical Assessment - Backend Developer",
      date: "Feb 14, 2026",
      time: "11:00 AM",
      mode: "Video Call",
      meetingLink: "https://zoom.us/j/123",
      notes: "Live coding session - Node.js & databases.",
    },
  ]);

  const [past] = useState([
    {
      id: 4,
      candidateName: "Muhammed Ahmed",
      title: "Final Interview - Backend Developer",
      date: "Feb 3, 2026",
      time: "10:00 AM",
      result: "Passed",
      feedback: "Strong technical skills and excellent communication. Recommended for hire.",
    },
    {
      id: 5,
      candidateName: "Layla Ibrahim",
      title: "Technical Interview - Frontend Developer",
      date: "Jan 28, 2026",
      time: "3:00 PM",
      result: "Rejected",
      feedback: "Good fundamentals but lacks experience with modern frameworks.",
    },
    {
      id: 6,
      candidateName: "Khaled Mostafa",
      title: "Culture Fit - Product Designer",
      date: "Jan 25, 2026",
      time: "1:00 PM",
      result: "Passed",
      feedback: "Great cultural fit. Moving to final round.",
    },
  ]);

  const [scheduleForm, setScheduleForm] = useState({
    candidateName: "",
    jobTitle: "",
    interviewType: "Technical",
    date: "",
    time: "",
    mode: "Video Call",
    notes: "",
  });

  /* =========================
     UI Logic
  ========================== */
  const getResultStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "passed":
        return { bg: "bg-[#EAF8EE]", text: "text-[#22C55E]", icon: CheckCircle2 };
      case "rejected":
        return { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", icon: XCircle };
      default:
        return { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition"
              >
                <ArrowLeft size={20} className="text-[#111827]" />
              </button>
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">Interviews</h1>
                <p className="text-[14px] text-[#6B7280] mt-1">Manage your interview schedule.</p>
              </div>
            </div>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#095c5a] transition"
            >
              <Plus size={18} />
              Schedule
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl mb-6 w-fit">
            {["upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {tab} ({tab === "upcoming" ? upcoming.length : past.length})
              </button>
            ))}
          </div>

          {/* Interview Cards */}
          <div className="space-y-4">
            {activeTab === "upcoming" &&
              upcoming.map((interview) => (
                <div key={interview.id} className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                        <div>
                          <h3 className="text-[16px] font-semibold text-[#111827]">
                            {interview.candidateName}
                          </h3>
                          <p className="text-[13px] text-[#6B7280]">{interview.title}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4 text-[13px] text-[#6B7280]">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {interview.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {interview.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {interview.mode === "Video Call" ? <Video size={14} /> : <MapPin size={14} />}
                          {interview.mode === "Video Call" ? "Video Call" : interview.location}
                        </span>
                      </div>

                      {interview.notes && (
                        <p className="mt-3 text-[13px] text-[#9CA3AF] italic">Note: {interview.notes}</p>
                      )}
                    </div>

                    <button className="text-[#0B6F6C] hover:bg-[#F0FBFA] p-2 rounded-lg transition">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}

            {activeTab === "past" &&
              past.map((interview) => {
                const resultStyle = getResultStyle(interview.result);
                const ResultIcon = resultStyle.icon;

                return (
                  <div key={interview.id} className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                          <div>
                            <h3 className="text-[16px] font-semibold text-[#111827]">
                              {interview.candidateName}
                            </h3>
                            <p className="text-[13px] text-[#6B7280]">{interview.title}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-[#6B7280]">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={14} />
                            {interview.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} />
                            {interview.time}
                          </span>
                        </div>

                        {interview.feedback && (
                          <p className="mt-3 text-[13px] text-[#6B7280] leading-5">
                            Feedback: {interview.feedback}
                          </p>
                        )}
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${resultStyle.bg} ${resultStyle.text}`}>
                        <ResultIcon size={14} />
                        {interview.result}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-[520px] mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#111827]">Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Candidate Name</label>
                <input
                  type="text"
                  value={scheduleForm.candidateName}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, candidateName: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                  placeholder="Enter candidate name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Job Title</label>
                <input
                  type="text"
                  value={scheduleForm.jobTitle}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, jobTitle: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                  placeholder="e.g. Senior React Developer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Date</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5">Time</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Mode</label>
                <select
                  value={scheduleForm.mode}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, mode: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
                >
                  <option value="Video Call">Video Call</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
                  rows="3"
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none resize-none focus:border-[#0B6F6C]"
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Interview scheduled!");
                  setShowScheduleModal(false);
                }}
                className="flex-1 h-11 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interviews;
