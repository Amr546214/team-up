import React, { memo } from "react";
import {
  CircleCheckBig,
  CircleX,
  RotateCcw,
  Medal,
  Crown,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const rankConfig = {
  silver: {
    label: "Silver",
    icon: <Medal size={18} />,
    description: "Entry-level freelancers",
    permissions: [
      "Can join Silver teams only",
      "Cannot lead any team yet",
      "Best starting point for new developers",
    ],
    style: "bg-gray-50 border-gray-300 text-gray-800",
  },
  gold: {
    label: "Gold",
    icon: <ShieldCheck size={18} />,
    description: "Mid-level freelancers",
    permissions: [
      "Can join Gold teams",
      "Can lead Silver teams",
      "Eligible for stronger team opportunities",
    ],
    style: "bg-yellow-50 border-yellow-400 text-yellow-800",
  },
  platinum: {
    label: "Platinum",
    icon: <Sparkles size={18} />,
    description: "Advanced freelancers",
    permissions: [
      "Can join Platinum teams",
      "Can lead Silver and Gold teams",
      "Access to stronger collaboration opportunities",
    ],
    style: "bg-indigo-50 border-indigo-400 text-indigo-800",
  },
  topRanked: {
    label: "Top Ranked",
    icon: <Crown size={18} />,
    description: "Elite freelancers recognized platform-wide",
    permissions: [
      "Can join any team",
      "Can lead any team",
      "Access to premium and high-level opportunities",
    ],
    style: "bg-purple-50 border-purple-500 text-purple-800",
  },
  needsImprovement: {
    label: "Needs Improvement",
    icon: <TriangleAlert size={18} />,
    description: "You need to strengthen your core skills first",
    permissions: [
      "Review your mistakes carefully",
      "Improve your fundamentals before advanced opportunities",
      "Retake the quiz after more practice",
    ],
    style: "bg-red-50 border-red-400 text-red-700",
  },
};

const QuizResult = ({ result, onRestartRequest }) => {
  const currentRank =
    rankConfig[result.rank] || rankConfig.needsImprovement;

  const hasWrongAnswers = result.wrongAnswers.length > 0;
  const canRestart = typeof onRestartRequest === "function";

  return (
    <section className="w-full rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
      {/* Top */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Quiz Result
        </h2>

        {canRestart && (
          <button
            type="button"
            onClick={onRestartRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition"
          >
            <RotateCcw size={16} />
            <span>Restart Quiz</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-gray-50 p-4 border">
          <span className="text-xs text-gray-500">Score</span>
          <strong className="block text-lg text-gray-900">
            {result.score} / {result.total}
            {result.isRetry && result.rawScore !== undefined && (
              <span className="text-xs text-gray-400 ml-1">
                (original: {result.rawScore})
              </span>
            )}
          </strong>
        </div>

        <div className="rounded-xl bg-gray-50 p-4 border">
          <span className="text-xs text-gray-500">Percentage</span>
          <strong className="block text-lg text-gray-900">
            {result.percentage}%
          </strong>
        </div>

        <div className="rounded-xl bg-gray-50 p-4 border">
          <span className="text-xs text-gray-500">Correct</span>
          <strong className="block text-lg text-gray-900">
            {result.correctCount}
          </strong>
        </div>
      </div>

      {/* Rank */}
      <div
        className={`rounded-xl border p-5 mb-6 ${currentRank.style}`}
      >
        <div className="flex items-center gap-2 mb-2 font-medium">
          {currentRank.icon}
          <span>{currentRank.label}</span>
        </div>

        <p className="text-sm mb-4">{currentRank.description}</p>

        <div>
          <h4 className="text-sm font-semibold mb-2">
            What this rank allows you
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {currentRank.permissions.map((item, index) => (
              <li key={`${result.rank}-perm-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Wrong Answers */}
      {hasWrongAnswers ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Your Mistakes
          </h3>

          <div className="space-y-4">
            {result.wrongAnswers.map((item) => (
              <div
                key={item.number}
                className="rounded-xl border p-4 bg-white"
              >
                <p className="text-sm text-gray-500">
                  Question {item.number}
                </p>

                <h4 className="mt-1 text-gray-900 font-medium">
                  {item.question}
                </h4>

                <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                  <CircleX size={16} />
                  <span>Your answer: {item.yourAnswer}</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm text-emerald-600">
                  <CircleCheckBig size={16} />
                  <span>Correct answer: {item.correctAnswer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CircleCheckBig size={18} />
          <span>Excellent! All your answers are correct.</span>
        </div>
      )}
    </section>
  );
};

export default memo(QuizResult);