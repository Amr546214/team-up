import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Clock3, AlertTriangle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import QuestionCard from "./QuestionCard";
import QuestionNavigator from "./QuestionNavigator";
import QuizResult from "./QuizResult";

// Total quiz time in seconds (5 minutes)
const QUIZ_DURATION = 60 * 5;

// Rank label + Tailwind style map used in the review screen header
const RANK_LABELS = {
  topRanked: {
    label: "Top Ranked",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
  },
  platinum: {
    label: "Platinum",
    className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  },
  gold: {
    label: "Gold",
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  silver: {
    label: "Silver",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },
  needsImprovement: {
    label: "Needs Improvement",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

// Main QuizSection component
const QuizSection = ({ selectedTrackTitle, questions, onQuizComplete }) => {
  const navigate = useNavigate();

  // Log mount/unmount for debugging
  useEffect(() => {
    console.log("[QuizSection] Component mounted for track:", selectedTrackTitle);
    console.log("[QuizSection] Questions count:", questions?.length || 0);
    return () => {
      console.log("[QuizSection] Component unmounting for track:", selectedTrackTitle);
    };
  }, [selectedTrackTitle, questions]);

  // Index of the currently displayed question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Stores user answers as { [questionIndex]: selectedOptionIndex }
  const [answers, setAnswers] = useState({});
  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  // Tracks the last navigation direction to style the active nav button
  const [lastAction, setLastAction] = useState("next");
  // Holds the final result object after submission; null while quiz is ongoing
  const [quizResult, setQuizResult] = useState(null);
  // When true, renders the interactive review screen instead of the full result card
  const [showReview, setShowReview] = useState(false);
  // When true, shows the retry warning section instead of quiz/review content
  const [showWarning, setShowWarning] = useState(false);
  // Tracks if this is a retry attempt; initialized from localStorage
  const [isRetry, setIsRetry] = useState(() => {
    return localStorage.getItem("quizIsRetry") === "true";
  });

  // Resets every piece of state back to its initial value.
  const resetQuizState = useCallback(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(QUIZ_DURATION);
    setLastAction("next");
    setQuizResult(null);
    setShowReview(false);
    setShowWarning(false);
  }, []);

  // Builds a lookup map { [questionIndex]: boolean } used in review mode.
  const correctAnswersMap = useMemo(() => {
    if (!showReview) return null;
    return questions.reduce((acc, question, index) => {
      const userAnswer = answers[index];
      acc[index] = userAnswer === question.correctAnswer;
      return acc;
    }, {});
  }, [showReview, questions, answers]);

  // Calculate rank based on effective score
  const getRankFromScore = useCallback((effectiveScore) => {
    if (effectiveScore >= 8) return "gold";
    if (effectiveScore >= 5) return "silver";
    return "needsImprovement";
  }, []);

  /**
   * Calculate raw score based on correct answers
   */
  const calculateScore = useCallback((questions, answers) => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  }, []);

  // Shared result-calculation logic
  const calculateResults = useCallback(
    (isAutoSubmit = false) => {
      console.log("[calculateResults] =======================================");
      console.log("[calculateResults] Questions count:", questions?.length);
      console.log("[calculateResults] Answers:", answers);

      const wrongAnswers = questions
        .map((question, index) => {
          const selectedAnswerIndex = answers[index];

          if (selectedAnswerIndex === undefined) {
            return {
              number: index + 1,
              question: question.question,
              yourAnswer: isAutoSubmit ? "No answer (time ran out)" : "Not answered",
              correctAnswer: question.options[question.correctAnswer],
            };
          }

          const isCorrect = selectedAnswerIndex === question.correctAnswer;
          if (isCorrect) return null;

          return {
            number: index + 1,
            question: question.question,
            yourAnswer: question.options[selectedAnswerIndex],
            correctAnswer: question.options[question.correctAnswer],
          };
        })
        .filter(Boolean);

      const rawScore = calculateScore(questions, answers);
      console.log("[calculateResults] Raw Score (correct answers):", rawScore);

      const effectiveScore = isRetry ? Math.round(rawScore * 0.5) : rawScore;
      console.log("[calculateResults] isRetry:", isRetry, "| Effective Score:", effectiveScore);

      const percentage = Math.round((effectiveScore / questions.length) * 100);
      const rank = getRankFromScore(effectiveScore);

      const result = {
        score: effectiveScore,
        rawScore,
        total: questions.length,
        correctCount: rawScore,
        wrongCount: questions.length - rawScore,
        wrongAnswers,
        percentage,
        rank,
        isAutoSubmitted: isAutoSubmit,
        isRetry,
      };

      console.log("[calculateResults] Final Result:", result);
      console.log("[calculateResults] =======================================");

      return result;
    },
    [questions, answers, isRetry, getRankFromScore, calculateScore]
  );

  // Triggered automatically when the countdown reaches zero.
  const handleAutoSubmit = useCallback(() => {
    const results = calculateResults(true);
    setQuizResult(results);
    onQuizComplete?.(results);
  }, [calculateResults, onQuizComplete]);

  const handleAutoSubmitRef = useRef(handleAutoSubmit);

  useEffect(() => {
    handleAutoSubmitRef.current = handleAutoSubmit;
  }, [handleAutoSubmit]);

  // Countdown timer
  useEffect(() => {
    if (quizResult || !questions?.length) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizResult, questions]);

  // Converts raw seconds into a "M:SS remaining" display string.
  const formattedTime = useMemo(() => {
    if (!questions?.length) return "0:00 remaining";
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")} remaining`;
  }, [timeLeft, questions]);

  // Saves the selected answer for the current question.
  const handleSelectAnswer = useCallback(
    (answerIndex) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: answerIndex,
      }));
    },
    [currentQuestionIndex]
  );

  const handlePrevious = useCallback(() => {
    setLastAction("previous");
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setLastAction("next");
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1));
  }, [questions.length]);

  const handleNavigate = useCallback((index) => {
    setCurrentQuestionIndex(index);
  }, []);

  // Called when user clicks "Restart Quiz" button.
  const handleRestartRequest = useCallback(() => {
    console.log("[QuizSection] Restart Quiz clicked, showing warning");
    setShowWarning(true);
  }, []);

  // Called when user clicks "Restart Anyway" in the warning section.
  const handleRestartAnyway = useCallback(() => {
    console.log("[QuizSection] Restart Anyway clicked");
    console.log("[QuizSection] Setting isRetry = true");

    setIsRetry(true);
    localStorage.setItem("quizIsRetry", "true");

    console.log("[QuizSection] Resetting quiz state");
    resetQuizState();

    console.log("[QuizSection] Navigating to /quiz");
    navigate("/quiz", { replace: true });
  }, [resetQuizState, navigate]);

  // Called when the user clicks "Submit Quiz".
  const handleSubmit = useCallback(async () => {
    const unansweredCount = questions.filter((_, index) => answers[index] === undefined).length;
    const hasUnanswered = unansweredCount > 0;

    const result = await Swal.fire({
      title: hasUnanswered ? "Are you sure?" : "Submit Quiz?",
      text: hasUnanswered
        ? `You still have ${unansweredCount} unanswered question${
            unansweredCount > 1 ? "s" : ""
          }. Do you want to submit anyway?`
        : "Are you sure you want to submit your answers?",
      icon: hasUnanswered ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0e6b67",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    const results = calculateResults(false);
    setQuizResult(results);
    setShowReview(true);
    onQuizComplete?.(results);
  }, [questions, answers, calculateResults, onQuizComplete]);

  // Empty Set passed to QuestionNavigator
  const missingQuestionsSet = useMemo(() => new Set(), []);

  const currentQuestion = questions[currentQuestionIndex];

  // Loading state
  if (!questions) {
    console.log("[QuizSection] Questions not loaded yet, showing loader");
    return (
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{selectedTrackTitle} Quiz</h2>

        <div className="flex flex-col items-center justify-center py-10 text-slate-500">
          <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
          <p className="text-sm">Loading questions...</p>
        </div>
      </section>
    );
  }

  // No questions check
  if (questions.length === 0) {
    console.log("[QuizSection] No questions available for track:", selectedTrackTitle);
    return (
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{selectedTrackTitle} Quiz</h2>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          No questions found for this track.
        </div>
      </section>
    );
  }

  // Retry warning section
  if (showWarning) {
    return (
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <AlertTriangle size={24} className="text-amber-500" />
            <span>⚠️ Retry Attempt</span>
          </h2>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              This is a retry. Your final score will be calculated as 50% of your result.
            </span>
          </div>

          <div>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800"
              onClick={handleRestartAnyway}
            >
              Restart Anyway
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Review screen
  if (showReview && quizResult) {
    const canRestart = quizResult.score < 5;

    console.log(
      "[QuizSection] Rendering Review Screen, canRestart:",
      canRestart,
      "score:",
      quizResult.score
    );

    return (
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        {/* Summary header with score stats */}
        <div className="mb-6 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">Quiz Review</h2>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              Correct: {quizResult.correctCount}
            </span>

            <span className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              Wrong: {quizResult.wrongCount}
            </span>

            <span className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              {quizResult.percentage}%
            </span>

            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                (RANK_LABELS[quizResult.rank] ?? RANK_LABELS.needsImprovement).className
              }`}
            >
              Your current rank:{" "}
              {(RANK_LABELS[quizResult.rank] ?? RANK_LABELS.needsImprovement).label}
            </span>
          </div>

          {canRestart && (
            <div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={handleRestartRequest}
              >
                <RotateCcw size={16} />
                Restart Quiz
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <QuestionCard
              question={currentQuestion}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestionIndex]}
              onSelectAnswer={() => {}}
              showResults={true}
              correctAnswer={currentQuestion?.correctAnswer}
            />

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition ${
                  lastAction === "previous"
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>

              <button
                type="button"
                className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition ${
                  lastAction === "next"
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={handleNext}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </button>
            </div>
          </div>

          <div>
            <QuestionNavigator
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              missingQuestionsSet={missingQuestionsSet}
              onNavigate={handleNavigate}
              showResults={true}
              correctAnswers={correctAnswersMap}
            />
          </div>
        </div>
      </section>
    );
  }

  if (quizResult) {
    const canRestart = quizResult.score < 5;
    return (
      <QuizResult
        result={quizResult}
        onRestartRequest={canRestart ? handleRestartRequest : null}
      />
    );
  }

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-2xl font-semibold text-slate-900">{selectedTrackTitle} Quiz</h2>

      <div className="mt-3 flex items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          <Clock3 size={14} />
          <span>{formattedTime}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <QuestionCard
            question={currentQuestion}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            selectedAnswer={answers[currentQuestionIndex]}
            onSelectAnswer={handleSelectAnswer}
            showResults={false}
          />

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition ${
                lastAction === "previous"
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>

            <button
              type="button"
              className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium transition ${
                lastAction === "next"
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </button>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800"
              onClick={handleSubmit}
            >
              Submit Quiz
            </button>
          </div>
        </div>

        <div>
          <QuestionNavigator
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            missingQuestionsSet={missingQuestionsSet}
            onNavigate={handleNavigate}
            showResults={false}
          />
        </div>
      </div>
    </section>
  );
};

export default QuizSection;