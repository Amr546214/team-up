import React, { useEffect, useMemo, useState } from "react";
import SkillQuizHeader from "../../../components/skill-quiz/SkillQuizHeader";
import PageLoader from "../../../components/common/PageLoader";
import useNotifications from "../../../hooks/useNotifications";
import { Code, Database, Sparkles, PenTool, Clock, CheckCircle } from "lucide-react";

const API_BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const getToken = () => localStorage.getItem("teamup_access_token");

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.log("QUIZ API ERROR:", data);
    throw new Error(data?.message || data?.error_message || data?.error || "Request failed");
  }

  return data;
};

const iconMap = {
  code: Code,
  server: Database,
  sparkles: Sparkles,
  pen: PenTool,
};

const accentMap = {
  blue: "border-blue-200 bg-blue-50 text-blue-600",
  green: "border-green-200 bg-green-50 text-green-600",
  purple: "border-purple-200 bg-purple-50 text-purple-600",
  pink: "border-pink-200 bg-pink-50 text-pink-600",
};

const formatTime = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export default function SkillQuiz() {
  const notificationsHook = useNotifications();
  const [pageData, setPageData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState("frontend");
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];

  const loadTracks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await apiRequest("/developer/skill-quiz/tracks");
      const data = res?.data || {};

      setPageData(data);
      setTracks(data.tracks || []);

      if (data.activeAttempt) {
        setAttempt(data.activeAttempt);
        setQuestions(data.activeAttempt.questions || []);
        setRemainingSeconds(data.activeAttempt.remainingSeconds || 0);
      }
    } catch (err) {
      setError(err.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    if (!attempt || result) return;
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, remainingSeconds, result]);

  const startQuiz = async () => {
    try {
      setStarting(true);
      setError("");

      const res = await apiRequest("/developer/skill-quiz/start", {
        method: "POST",
        body: JSON.stringify({ trackKey: selectedTrack }),
      });

      const newAttempt = res?.data?.attempt;

      setAttempt(newAttempt);
      setQuestions(newAttempt?.questions || []);
      setRemainingSeconds(newAttempt?.remainingSeconds || 900);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || "Failed to start quiz");
    } finally {
      setStarting(false);
    }
  };

  const saveAnswer = async (questionId, selectedOptionId) => {
    if (!attempt?.attemptId) return;

    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === questionId ? { ...q, selectedOptionId } : q
      )
    );

    try {
      setSaving(true);

      const res = await apiRequest(
        `/developer/skill-quiz/${attempt.attemptId}/answer`,
        {
          method: "PATCH",
          body: JSON.stringify({ questionId, selectedOptionId }),
        }
      );

      const latestAttempt = res?.data?.attempt;
      setAttempt((prev) => ({
        ...prev,
        ...latestAttempt,
        questions: prev?.questions || questions,
      }));
    } catch (err) {
      alert(err.message || "Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  const submitQuiz = async () => {
    if (!attempt?.attemptId) return;

    try {
      setLoading(true);

      const res = await apiRequest(
        `/developer/skill-quiz/${attempt.attemptId}/submit`,
        { method: "POST" }
      );

      setResult(res?.data?.result);
    } catch (err) {
      alert(err.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  const answeredCount = useMemo(() => {
    return questions.filter((q) => q.selectedOptionId).length;
  }, [questions]);

  if (loading && !attempt && !result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <SkillQuizHeader
        notifications={notificationsHook.notifications}
        unreadCount={notificationsHook.unreadCount}
        hasUnread={notificationsHook.hasUnread}
        onMarkAsRead={notificationsHook.markAsRead}
        onMarkAllAsRead={notificationsHook.markAllAsRead}
        onDeleteNotification={notificationsHook.deleteNotification}
        onClearAllNotifications={notificationsHook.clearAll}
      />

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!attempt && !result && (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <h1 className="text-xl font-bold md:text-2xl">
                {pageData?.pageTitle || "Skill Assessment"}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                {pageData?.intro ||
                  "Choose the primary track you want to be assessed on, then complete the timed quiz."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <h2 className="text-xl font-bold md:text-2xl">Choose Your Track</h2>
              <p className="mt-3 text-sm text-slate-600">
                Select the primary track you want to be assessed on.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {tracks.map((track) => {
                  const Icon = iconMap[track.icon] || Code;
                  const active = selectedTrack === track.key;

                  return (
                    <button
                      key={track.key}
                      type="button"
                      onClick={() => setSelectedTrack(track.key)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        active
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 bg-white hover:border-teal-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`grid h-10 w-10 place-items-center rounded-xl ${
                            accentMap[track.accent] || accentMap.blue
                          }`}
                        >
                          <Icon size={18} />
                        </span>

                        <span
                          className={`h-5 w-5 rounded-full border ${
                            active
                              ? "border-teal-600 bg-teal-600"
                              : "border-slate-300"
                          }`}
                        />
                      </div>

                      <h3 className="mt-4 font-bold">{track.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {track.description}
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        {track.questionsCount} questions • {track.estimatedMinutes} mins
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={startQuiz}
                  disabled={starting}
                  className="h-12 w-full rounded-xl bg-teal-700 px-6 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
                >
                  {starting ? "Starting..." : "Start Quiz"}
                </button>
              </div>
            </section>
          </>
        )}

        {attempt && !result && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-7">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold md:text-2xl">
                  {attempt.track?.title || "Quiz"}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Answered {answeredCount} of {attempt.totalQuestions || questions.length}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 font-semibold text-teal-700">
                <Clock size={18} />
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {currentQuestion ? (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-teal-700">
                    Question {currentQuestion.number || currentIndex + 1}
                  </p>

                  <h2 className="mt-3 text-lg font-bold leading-7 md:text-xl">
                    {currentQuestion.prompt}
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {currentQuestion.options.map((option) => {
                      const selected =
                        currentQuestion.selectedOptionId === option.optionId;

                      return (
                        <button
                          key={option.optionId}
                          type="button"
                          onClick={() =>
                            saveAnswer(currentQuestion.questionId, option.optionId)
                          }
                          className={`rounded-xl border px-4 py-4 text-left text-sm transition md:text-base ${
                            selected
                              ? "border-teal-600 bg-teal-50 text-teal-800"
                              : "border-slate-200 bg-white hover:border-teal-300"
                          }`}
                        >
                          <span className="font-semibold">
                            {option.optionId.toUpperCase()}.
                          </span>{" "}
                          {option.text}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {questions.map((q, index) => (
                    <button
                      key={q.questionId}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                        index === currentIndex
                          ? "bg-teal-700 text-white"
                          : q.selectedOptionId
                          ? "bg-teal-100 text-teal-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {q.number || index + 1}
                    </button>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) =>
                          Math.min(prev + 1, questions.length - 1)
                        )
                      }
                      className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submitQuiz}
                      disabled={saving}
                      className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                No questions returned for this attempt. Start a new quiz or ask backend to return questions in current attempt.
              </div>
            )}
          </section>
        )}

        {result && (
          <section className="mx-auto w-full max-w-[700px] rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm md:p-10">
            <CheckCircle className="mx-auto text-teal-700" size={56} />

            <h1 className="mt-4 text-2xl font-bold">Quiz Completed</h1>
            <p className="mt-2 text-slate-600">{result.track?.title}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ResultCard label="Score" value={`${result.score}/${result.totalQuestions}`} />
              <ResultCard label="Percentage" value={`${result.percentage}%`} />
              <ResultCard label="Rank" value={result.updatedRank} />
              <ResultCard label="Level" value={result.updatedExperienceLevel} />
            </div>

            <button
              type="button"
              onClick={() => {
                setAttempt(null);
                setQuestions([]);
                setResult(null);
                loadTracks();
              }}
              className="mt-7 h-11 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white"
            >
              Back to Tracks
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="rounded-xl bg-teal-50 p-4">
      <p className="text-xl font-bold text-teal-800">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{label}</p>
    </div>
  );
}