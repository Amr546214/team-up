import React, { memo } from "react";
import { ScanSearch } from "lucide-react";

const AssessmentIntro = () => {
  return (
    <section className="w-full rounded-2xl bg-white border border-gray-200 p-5 md:p-6 shadow-sm">
      {/* Title Row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-teal-50 text-teal-700">
          <ScanSearch size={14} strokeWidth={2} />
        </span>

        <h2 className="text-[18px] md:text-[20px] font-semibold text-gray-900">
          Skill Assessment
        </h2>
      </div>

      {/* Description */}
      <p className="text-[14px] md:text-[15px] leading-relaxed text-gray-500 max-w-[700px]">
        To perfectly match you with the right projects and teams, we need to
        evaluate your technical proficiency. This short quiz will determine your
        rank and help us recommend the best opportunities for your specific
        skill set.
      </p>
    </section>
  );
};

export default memo(AssessmentIntro);