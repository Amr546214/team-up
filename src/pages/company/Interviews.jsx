import { useEffect, useState } from "react";
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

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

function Interviews() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("upcoming");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    candidateName: "",
    jobTitle: "",
    interviewType: "technical",
    date: "",
    time: "",
    mode: "Video Call",
    notes: "",
  });

  const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("backendToken") ||
    localStorage.getItem("authToken");

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || `Request failed with status ${res.status}`);
    }

    return data?.data || data;
  };

  const normalizeUpcoming = (item) => ({
    id: item.interviewId || item.id,
    candidateName: item.candidateName || item.title || "Unknown Candidate",
    title: item.subtitle || item.title || "Interview",
    date: item.date || "",
    time: item.time || "",
    mode: item.modeLabel || item.mode || "Video Call",
    location: item.modeLabel || item.mode || "",
    notes: item.notes || "",
  });

  const normalizePast = (item) => ({
    id: item.interviewId || item.id,
    candidateName: item.candidateName || item.title || "Unknown Candidate",
    title: item.subtitle || item.title || "Interview",
    date: item.date || "",
    time: item.time || "",
    result: item.resultLabel || item.resultStatus || "Pending",
    feedback: item.feedback || "",
  });

  const loadInterviews = async () => {
    setLoading(true);

    try {
      const data = await apiRequest("/company/interviews");

      const upcomingList = data?.upcomingInterviews || data?.upcoming || [];
      const pastList = data?.pastInterviews || data?.past || data?.interviews?.past || [];

      setUpcoming(upcomingList.map(normalizeUpcoming));
      setPast(pastList.map(normalizePast));
    } catch (error) {
      console.error("[Interviews] Main API failed:", error);

      try {
        const [upcomingData, pastData] = await Promise.all([
          apiRequest("/company/interviews/upcoming"),
          apiRequest("/company/interviews/past"),
        ]);

        setUpcoming((upcomingData?.interviews || []).map(normalizeUpcoming));
        setPast((pastData?.interviews || []).map(normalizePast));
      } catch (fallbackError) {
        console.error("[Interviews] Tabs API failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleScheduleInterview = async () => {
    try {
      const payload = {
        candidateName: scheduleForm.candidateName.trim(),
        jobTitle: scheduleForm.jobTitle.trim(),
        interviewType: scheduleForm.interviewType,
        date: scheduleForm.date,
        time: scheduleForm.time,
        mode: scheduleForm.mode,
        notes: scheduleForm.notes.trim(),
      };

      await apiRequest("/company/interviews", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowScheduleModal(false);
      setScheduleForm({
        candidateName: "",
        jobTitle: "",
        interviewType: "technical",
        date: "",
        time: "",
        mode: "Video Call",
        notes: "",
      });

      await loadInterviews();
    } catch (error) {
      console.error("[Interviews] Schedule failed:", error);
      alert(error.message || "Schedule failed");
    }
  };

  const getResultStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "passed":
      case "accepted":
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

      <div className="pt-20 px-4 sm:px-5 md:px-8 pb-10 overflow-x-hidden">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition shrink-0"
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
              className="h-11 px-5 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#095c5a] transition w-full sm:w-auto"
            >
              <Plus size={18} />
              Schedule
            </button>
          </div>

          <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl mb-6 w-full sm:w-fit">
            {["upcoming", "past"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "bg-white text-[#111827] shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {tab} ({tab === "upcoming" ? upcoming.length : past.length})
              </button>
            ))}
          </div>

          {loading && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] text-[#6B7280]">
              Loading interviews...
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              {activeTab === "upcoming" &&
                upcoming.map((interview) => (
                  <div key={interview.id} className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E7EB]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-[16px] font-semibold text-[#111827] break-words">
                              {interview.candidateName}
                            </h3>
                            <p className="text-[13px] text-[#6B7280] break-words">{interview.title}</p>
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
                          <p className="mt-3 text-[13px] text-[#9CA3AF] italic break-words">
                            Note: {interview.notes}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/company/interviews/${interview.id}`)}
                        className="text-[#0B6F6C] hover:bg-[#F0FBFA] p-2 rounded-lg transition shrink-0"
                      >
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
                    <div key={interview.id} className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E7EB]">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-[#D9D9D9] shrink-0" />
                            <div className="min-w-0">
                              <h3 className="text-[16px] font-semibold text-[#111827] break-words">
                                {interview.candidateName}
                              </h3>
                              <p className="text-[13px] text-[#6B7280] break-words">{interview.title}</p>
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
                            <p className="mt-3 text-[13px] text-[#6B7280] leading-5 break-words">
                              Feedback: {interview.feedback}
                            </p>
                          )}
                        </div>

                        <span className={`w-fit inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${resultStyle.bg} ${resultStyle.text}`}>
                          <ResultIcon size={14} />
                          {interview.result}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-[#111827]">Schedule Interview</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-[#6B7280] hover:text-[#111827]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={scheduleForm.candidateName}
                onChange={(e) => setScheduleForm((p) => ({ ...p, candidateName: e.target.value }))}
                className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                placeholder="Candidate name"
              />

              <input
                type="text"
                value={scheduleForm.jobTitle}
                onChange={(e) => setScheduleForm((p) => ({ ...p, jobTitle: e.target.value }))}
                className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                placeholder="Job title"
              />

              <select
                value={scheduleForm.interviewType}
                onChange={(e) => setScheduleForm((p) => ({ ...p, interviewType: e.target.value }))}
                className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
              >
                <option value="technical">Technical</option>
                <option value="first-round">First Round</option>
                <option value="final">Final</option>
                <option value="culture-fit">Culture Fit</option>
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                />

                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                  className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none focus:border-[#0B6F6C]"
                />
              </div>

              <select
                value={scheduleForm.mode}
                onChange={(e) => setScheduleForm((p) => ({ ...p, mode: e.target.value }))}
                className="w-full h-11 rounded-xl border border-[#D1D5DB] px-4 text-sm outline-none bg-white focus:border-[#0B6F6C]"
              >
                <option value="Video Call">Video Call</option>
                <option value="Cairo Office">Cairo Office</option>
              </select>

              <textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
                rows="3"
                className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none resize-none focus:border-[#0B6F6C]"
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 h-11 rounded-xl border border-[#E5E7EB] text-[#6B7280] text-sm font-medium hover:bg-[#F8FAFC] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
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