import React, { memo } from "react";

/**
 * QuestionCard
 * Displays a single quiz question and its answer options.
 *
 * Props:
 *   showResults   - false during the quiz (interactive), true in review mode (read-only)
 *   correctAnswer - index of the correct option; only used when showResults=true
 *
 * Answer option states (showResults=true):
 *   correct        - user picked this AND it is the right answer  → green bg + border
 *   wrong          - user picked this BUT it is wrong            → red bg + border
 *   correct-answer - the right answer that the user did NOT pick  → dashed green border
 *   (default)      - any option the user didn't interact with     → no change
 */
const QuestionCard = ({
  question,
  currentQuestionIndex,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  showResults,
  correctAnswer,
}) => {
  if (!question) return null;

  /**
   * Returns a status object for each answer option.
   * During the quiz: only tracks whether this option is currently selected.
   * In review mode: also determines if the selection was correct or wrong,
   * and whether this option is the right answer (even if not selected).
   */
  const getOptionStatus = (optionIndex) => {
    if (!showResults) {
      return {
        isSelected: selectedAnswer === optionIndex,
        isCorrect: false,
        isWrong: false,
        isCorrectAnswer: false,
      };
    }

    const isSelected = selectedAnswer === optionIndex;
    const isCorrectAnswer = optionIndex === correctAnswer;

    return {
      isSelected,
      isCorrect: isSelected && isCorrectAnswer,
      isWrong: isSelected && !isCorrectAnswer,
      isCorrectAnswer,
    };
  };

  const getOptionClasses = (status) => {
    let classes =
      "w-full rounded-xl border px-4 py-4 text-left transition flex items-center gap-3";

    if (status.isCorrect) {
      classes += " border-emerald-500 bg-emerald-50";
    } else if (status.isWrong) {
      classes += " border-red-500 bg-red-50";
    } else if (status.isSelected) {
      classes += " border-teal-600 bg-teal-50";
    } else if (status.isCorrectAnswer && showResults) {
      classes += " border-2 border-dashed border-emerald-500 bg-white";
    } else {
      classes += " border-gray-200 bg-white hover:border-gray-300";
    }

    if (showResults) {
      classes += " cursor-default";
    } else {
      classes += " cursor-pointer";
    }

    return classes;
  };

  const getRadioClasses = (status) => {
    let classes =
      "mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center";

    if (status.isCorrect) {
      classes += " border-emerald-600 bg-emerald-600";
    } else if (status.isWrong) {
      classes += " border-red-600 bg-red-600";
    } else if (status.isSelected) {
      classes += " border-teal-600 bg-teal-600";
    } else {
      classes += " border-gray-300 bg-white";
    }

    return classes;
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <p className="text-sm font-medium text-gray-500">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </p>

      <h3 className="mt-3 text-lg font-semibold leading-8 text-gray-900 md:text-xl">
        {question.question}
      </h3>

      <div className="mt-5 space-y-3">
        {question.options.map((option, index) => {
          const status = getOptionStatus(index);

          return (
            <button
              type="button"
              key={`q${question.id}-opt${index}`}
              className={getOptionClasses(status)}
              onClick={() => !showResults && onSelectAnswer(index)}
              disabled={showResults}
            >
              <span className={getRadioClasses(status)}>
                {(status.isSelected || status.isCorrect || status.isWrong) && (
                  <span className="h-2.5 w-2.5 rounded-full bg-white"></span>
                )}
              </span>

              <span className="flex-1 text-sm font-medium text-gray-800 md:text-[15px]">
                {option}
              </span>

              {showResults && status.isCorrect && (
                <span className="text-sm font-semibold text-emerald-600">✓</span>
              )}

              {showResults && status.isWrong && (
                <span className="text-sm font-semibold text-red-600">✗</span>
              )}

              {showResults && status.isCorrectAnswer && !status.isCorrect && (
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Correct
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(QuestionCard);