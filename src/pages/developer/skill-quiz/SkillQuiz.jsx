import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import SkillQuizHeader from "../../../components/skill-quiz/SkillQuizHeader";
import AssessmentIntro from "../../../components/skill-quiz/AssessmentIntro";
import TrackSelection from "../../../components/skill-quiz/TrackSelection";
import QuizSection from "../../../components/skill-quiz/QuizSection";
import PageLoader from "../../../components/common/PageLoader";
import useNotifications from "../../../hooks/useNotifications";
import usePageRefresh from "../../../hooks/usePageRefresh";
import { tracksData, quizData } from "../../../data/quizData";
import { markDeveloperSkillQuizCompletedForPendingEmail } from "../../../services/demoAuthService";

/**
 * SkillQuiz page component.
 * Handles track selection and quiz rendering based on URL parameters.
 * - "/" → Shows track selection only
 * - "/quiz" or "/quiz/:trackId" → Shows track selection + quiz section
 */
const SkillQuiz = () => {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle page refresh - redirect to home
  usePageRefresh("/");

  // Notifications system
  const {
    notifications,
    unreadCount,
    hasUnread,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  // Use trackId from URL as source of truth, fallback to "frontend"
  const selectedTrack = trackId || "frontend";

  // Local state for UI selection before navigation
  const [uiSelectedTrack, setUiSelectedTrack] = useState(selectedTrack);

  const selectedTrackData = useMemo(() => {
    return tracksData.find((track) => track.id === selectedTrack);
  }, [selectedTrack]);

  const selectedQuestions = useMemo(() => {
    return quizData[selectedTrack] || [];
  }, [selectedTrack]);

  // Determine if quiz should be shown based on URL path
  const isQuizStarted = location.pathname.startsWith("/quiz");

  // Loading state for async operations
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
    console.log("[SkillQuiz] Component mounted, loading data...");
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log("[SkillQuiz] Data loaded");
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Callback to add notification when quiz is completed
  const handleQuizComplete = useCallback(
    (result) => {
      const trackData = tracksData.find((t) => t.id === selectedTrack);

      addNotification({
        score: result.score,
        rank: result.rank,
        trackTitle: trackData?.title || "Quiz",
      });

      console.log("[SkillQuiz] Quiz completed, notification added:", result);
      markDeveloperSkillQuizCompletedForPendingEmail();
      navigate("/developer/profile");
    },
    [addNotification, navigate, selectedTrack]
  );

  const handleStartQuiz = () => {
    if (!uiSelectedTrack) {
      console.warn("[SkillQuiz] Cannot start quiz: no track selected");
      return;
    }

    console.log("[SkillQuiz] =======================================");
    console.log("[SkillQuiz] START QUIZ button clicked!");
    console.log("[SkillQuiz] Selected track:", uiSelectedTrack);
    console.log("[SkillQuiz] Navigating to: /quiz/" + uiSelectedTrack);
    console.log("[SkillQuiz] =======================================");

    // Show loading state briefly before navigation
    setIsLoading(true);

    // Navigate to quiz route with selected track
    navigate(`/quiz/${uiSelectedTrack}`, { replace: false });

    // Hide loader after navigation
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleTrackSelect = (newTrackId) => {
    setUiSelectedTrack(newTrackId);
    console.log("[SkillQuiz] Track selected:", newTrackId);
  };

  // Debug logging whenever key state changes
  useEffect(() => {
    console.log("[SkillQuiz] State changed:", {
      trackId,
      selectedTrack,
      uiSelectedTrack,
      isQuizStarted,
      path: location.pathname,
      questionCount: selectedQuestions.length,
      hasTrackData: !!selectedTrackData,
      isLoading,
    });
  }, [
    trackId,
    selectedTrack,
    uiSelectedTrack,
    isQuizStarted,
    location.pathname,
    selectedQuestions.length,
    selectedTrackData,
    isLoading,
  ]);

  // Log on mount/unmount
  useEffect(() => {
    console.log("[SkillQuiz] ✓ Component mounted");
    return () => {
      console.log("[SkillQuiz] ✗ Component unmounting");
    };
  }, []);

  // Show loader while initializing
  if (isLoading && !isQuizStarted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <SkillQuizHeader
        notifications={notifications}
        unreadCount={unreadCount}
        hasUnread={hasUnread}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAllNotifications={clearAll}
      />

      <main className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <AssessmentIntro />

        <TrackSelection
          tracks={tracksData}
          selectedTrack={uiSelectedTrack}
          onTrackSelect={handleTrackSelect}
          onStartQuiz={handleStartQuiz}
        />

        {/* Show loader during transition to quiz */}
        {isLoading && isQuizStarted && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <PageLoader />
          </div>
        )}

        {/* Quiz Section - only render when data is ready and not loading */}
        {isQuizStarted &&
          !isLoading &&
          selectedTrackData &&
          selectedQuestions.length > 0 && (
            <QuizSection
              key={selectedTrack}
              selectedTrackTitle={selectedTrackData.title}
              questions={selectedQuestions}
              onQuizComplete={handleQuizComplete}
            />
          )}

        {/* Fallback if quiz started but no questions found */}
        {isQuizStarted &&
          !isLoading &&
          (!selectedTrackData || selectedQuestions.length === 0) && (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Quiz Unavailable
              </h2>

              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {!selectedTrackData
                  ? "Selected track not found. Please go back and select a valid track."
                  : "No questions available for this track. Please try another track."}
              </div>

              <button
                type="button"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800"
                onClick={() => navigate("/", { replace: true })}
              >
                Back to Track Selection
              </button>
            </div>
          )}
      </main>
    </div>
  );
};

export default SkillQuiz;