import React, { memo } from "react";

/**
 * QuestionNavigator
 * Renders a grid of numbered buttons — one per question.
 */
const QuestionNavigator = ({
  questions,
  currentQuestionIndex,
  answers,
  missingQuestionsSet,
  onNavigate,
  showResults,
  correctAnswers,
}) => {
  const getButtonClasses = ({
    isCurrent,
    isAnswered,
    isMissing,
    isCorrect,
    isWrong,
  }) => {
    let classes =
      "w-10 h-10 rounded-lg text-sm font-medium border transition flex items-center justify-center";

    // Base state
    if (isAnswered) {
      classes += " bg-white border-gray-300 text-gray-800";
    } else {
      classes += " bg-white border-gray-200 text-gray-400 opacity-40";
    }

    // Current question
    if (isCurrent) {
      classes += " ring-2 ring-teal-600";
    }

    // Missing (during quiz)
    if (isMissing && !showResults) {
      classes += " border-red-500";
    }

    // Review mode colors
    if (showResults) {
      if (isCorrect) {
        classes = "w-10 h-10 rounded-lg text-sm font-medium bg-emerald-500 text-white";
      } else if (isWrong) {
        classes = "w-10 h-10 rounded-lg text-sm font-medium bg-red-500 text-white";
      }
    }

    // Hover only if clickable
    if (showResults || isAnswered) {
      classes += " hover:scale-105 cursor-pointer";
    } else {
      classes += " cursor-not-allowed";
    }

    return classes;
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h4 className="text-[15px] font-semibold text-gray-900 mb-4">
        Question Navigator
      </h4>

      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {questions.map((question, index) => {
          const isCurrent = currentQuestionIndex === index;
          const isAnswered = answers[index] !== undefined;
          const isMissing = missingQuestionsSet?.has(index) ?? false;

          const isCorrect =
            showResults && correctAnswers?.[index] === true;
          const isWrong =
            showResults && correctAnswers?.[index] === false;

          return (
            <button
              key={question.id ?? index}
              type="button"
              className={getButtonClasses({
                isCurrent,
                isAnswered,
                isMissing,
                isCorrect,
                isWrong,
              })}
              onClick={() => onNavigate(index)}
              disabled={!showResults && !isAnswered}
              title={
                showResults
                  ? isCorrect
                    ? "Correct"
                    : isWrong
                    ? "Wrong"
                    : "Not answered"
                  : isAnswered
                  ? "Answered"
                  : "Not answered"
              }
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(QuestionNavigator);