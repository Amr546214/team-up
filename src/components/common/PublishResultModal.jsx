function PublishResultModal({ job, onAcceptTeam, onRejectTeam }) {
  const budget = Number(
    String(job?.salary || job?.budget || "0").replace(/[^0-9]/g, "")
  ) || 0;

  const teamSize = Number(job?.team_size) || Number(job?.teamSize) || 0;

  const skills = Array.isArray(job?.skills)
    ? job.skills
    : [];

  const handleAccept = () => {
    onAcceptTeam(job);
  };

  const handleReject = () => {
    onRejectTeam();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-[980px] max-h-[90vh] overflow-y-auto bg-white rounded-[24px] border border-[#D9EFEF] shadow-xl p-6 md:p-8">
        {/* Header */}
        <h2 className="text-[24px] font-semibold text-[#111827] mb-2">
          Job Preview
        </h2>
        <p className="text-[15px] text-[#6B7280] mb-6">
          Review your job details before publishing.
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Team Size</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              {teamSize || "—"}
            </p>
          </div>
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Budget</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              ${budget.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Job Type</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              {job?.jobType || "—"}
            </p>
          </div>
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Duration</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              {job?.duration || "—"}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <div className="mb-6">
          <h3 className="text-[14px] font-semibold text-[#374151] mb-3 uppercase tracking-wide">
            Job Title
          </h3>
          <p className="text-[16px] text-[#111827] font-medium">
            {job?.title || "Untitled Job"}
          </p>
        </div>

        {job?.description && (
          <div className="mb-6">
            <h3 className="text-[14px] font-semibold text-[#374151] mb-3 uppercase tracking-wide">
              Description
            </h3>
            <p className="text-[14px] text-[#374151] leading-relaxed">
              {job.description}
            </p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-semibold text-[#374151] mb-3 uppercase tracking-wide">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block bg-[#D9EFEF] text-[#0B6B63] text-[13px] px-3 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Team Note */}
        <div className="bg-[#F0FDF4] border border-[#D9EFEF] rounded-[12px] p-4 mb-6">
          <h3 className="text-[14px] font-semibold text-[#0B6B63] mb-2">
            AI Team Recommendation
          </h3>
          <p className="text-[14px] text-[#374151]">
            After publishing this job, you can use the &quot;Auto Suggest Full Team&quot; feature to generate an AI-powered team recommendation based on your requirements.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleReject}
            type="button"
            className="h-[48px] min-w-[160px] rounded-[10px] border border-red-300 text-red-700 text-[15px] font-medium hover:bg-red-50 transition"
          >
            Close Preview
          </button>
          <button
            onClick={handleAccept}
            type="button"
            className="h-[48px] min-w-[160px] rounded-[10px] bg-emerald-600 text-white text-[15px] font-medium hover:bg-emerald-700 transition"
          >
            Publish Job
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublishResultModal;
