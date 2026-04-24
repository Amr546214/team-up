import { notifyAcceptedTeamDevelopers } from "../../lib/developerInvites";

function safeJsonParse(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeN8nResponse(rawResponse) {
  if (!rawResponse) return {};

  let response = rawResponse;

  // If response is a JSON string, parse it
  response = safeJsonParse(response);

  // n8n sometimes returns an array with one item
  if (Array.isArray(response)) {
    response = response[0] || {};
  }

  // n8n sometimes wraps output in json/body/data/result/output
  response = safeJsonParse(response);

  if (response?.json) {
    response = safeJsonParse(response.json);
  }

  if (response?.body) {
    response = safeJsonParse(response.body);
  }

  if (response?.data) {
    response = safeJsonParse(response.data);
  }

  if (response?.result) {
    response = safeJsonParse(response.result);
  }

  if (response?.output) {
    response = safeJsonParse(response.output);
  }

  // If after unwrapping we got an array again
  if (Array.isArray(response)) {
    response = response[0] || {};
  }

  return response || {};
}

// Helper functions for extracting developer data
const getDeveloperId = (developer) =>
  developer?.id ??
  developer?.ID ??
  developer?.userId ??
  developer?.user_id ??
  developer?._id;

const getDeveloperName = (developer) =>
  developer?.name ??
  developer?.Name ??
  developer?.fullName ??
  developer?.full_name ??
  developer?.username ??
  developer?.developer_name ??
  developer?.["Developer Name"] ??
  "Unknown Developer";

const getDeveloperTrack = (developer) =>
  developer?.track ??
  developer?.Track ??
  developer?.role ??
  developer?.Role ??
  developer?.title ??
  developer?.position ??
  developer?.specialization ??
  "—";

const getDeveloperHourRate = (developer) =>
  Number(
    developer?.hour_rate_usd ??
    developer?.hour_rate ??
    developer?.hourRate ??
    developer?.rate ??
    developer?.rate_usd ??
    developer?.["Hour Rate ($)"] ??
    developer?.["Hour Rate"] ??
    developer?.["Hourly Rate"] ??
    0
  );

const getDeveloperHoursPerWeek = (developer) =>
  Number(
    developer?.hours_per_week ??
    developer?.hoursPerWeek ??
    developer?.weekly_hours ??
    developer?.weeklyHours ??
    developer?.["Hours / Week"] ??
    developer?.["Hours Per Week"] ??
    0
  );

const getDeveloperWeeklyCost = (developer) => {
  const existingWeeklyCost = Number(
    developer?.weekly_cost_usd ??
    developer?.weekly_cost ??
    developer?.weeklyCost ??
    developer?.cost_per_week ??
    developer?.costPerWeek ??
    developer?.total_weekly_cost ??
    developer?.["Weekly Cost"] ??
    developer?.["Weekly Cost ($)"] ??
    0
  );

  if (existingWeeklyCost > 0) return existingWeeklyCost;

  const hourRate = getDeveloperHourRate(developer);
  const hoursPerWeek = getDeveloperHoursPerWeek(developer);

  return hourRate * hoursPerWeek;
};

function normalizeDeveloper(rawDeveloper) {
  if (!rawDeveloper) return {};

  let developer = safeJsonParse(rawDeveloper);

  if (developer?.json) developer = safeJsonParse(developer.json);
  if (developer?.data) developer = safeJsonParse(developer.data);
  if (developer?.body) developer = safeJsonParse(developer.body);
  if (developer?.developer) developer = safeJsonParse(developer.developer);
  if (developer?.user) developer = safeJsonParse(developer.user);
  if (developer?.profile) developer = safeJsonParse(developer.profile);

  return developer || {};
}

const getProjectDurationInWeeks = (duration) => {
  if (!duration) return 1;

  const value = String(duration).trim().toLowerCase();
  const numberMatch = value.match(/\d+(\.\d+)?/);
  const amount = numberMatch ? Number(numberMatch[0]) : 1;

  if (value.includes("day")) {
    return Math.max(1, Math.ceil(amount / 7));
  }

  if (value.includes("week")) {
    return Math.max(1, Math.ceil(amount));
  }

  if (value.includes("month")) {
    return Math.max(1, Math.ceil(amount * 4));
  }

  if (value.includes("year")) {
    return Math.max(1, Math.ceil(amount * 52));
  }

  return Math.max(1, Math.ceil(amount || 1));
};

function extractTeam(response) {
  if (!response) return [];

  const possibleTeams = [
    response.team,
    response.selected_team,
    response.selectedTeam,
    response.selected_developers,
    response.selectedDevelopers,
    response.developers,
    response.recommended_team,
    response.recommendedTeam,
    response.result?.team,
    response.result?.selected_team,
    response.result?.selected_developers,
    response.output?.team,
    response.output?.selected_team,
    response.output?.selected_developers,
    response.data?.team,
    response.data?.selected_team,
    response.data?.selected_developers,
  ];

  const found = possibleTeams.find((item) => Array.isArray(item));
  return found || [];
}

function PublishResultModal({ job, onAcceptTeam, onRejectTeam }) {
  const isSuccess = job.n8nStatus === "success";

  const rawResponse = job?.n8nResponse;
  const response = normalizeN8nResponse(rawResponse);

  console.log("[PublishResultModal] normalized response:", response);

  const selectedTeam = extractTeam(response);

  console.log("[PublishResultModal] extracted selectedTeam:", selectedTeam);

  // Normalize each developer (unwrap nested JSON if needed)
  const normalizedTeam = selectedTeam.map(normalizeDeveloper);

  console.log("[PublishResultModal] normalized team:", normalizedTeam);

  // Calculate summary values from normalized developers
  const calculatedTeamSize = normalizedTeam.length;
  const calculatedWeeklyCost = normalizedTeam.reduce(
    (total, developer) => total + getDeveloperWeeklyCost(developer),
    0
  );

  // Calculate project duration and total cost
  const projectDuration =
    job?.duration ??
    job?.estimatedDuration ??
    job?.requirements?.duration ??
    "";

  const projectDurationInWeeks = getProjectDurationInWeeks(projectDuration);

  const calculatedTotalCost =
    calculatedWeeklyCost * projectDurationInWeeks;

  const budget = Number(
    response?.budget_usd ??
    job?.requirements?.budget ??
    0
  );

  const budgetStatus =
    calculatedTotalCost > 0 && budget > 0
      ? calculatedTotalCost <= budget
        ? "Within budget"
        : "Over budget"
      : "—";

  const isOverBudget =
    calculatedTotalCost > 0 && budget > 0 && calculatedTotalCost > budget;

  const canAcceptTeam = selectedTeam.length > 0 && !isOverBudget;

  const handleAcceptTeam = () => {
    if (!canAcceptTeam) return;

    // Build the accepted job object with team decision
    const acceptedJob = {
      ...job,
      teamDecision: "accepted",
      acceptedTeam: normalizedTeam,
      acceptedAt: new Date().toISOString(),
      finalCost: calculatedTotalCost,
      budgetStatus,
    };

    // Notify matched developers and create invites
    const { matched, unmatched } = notifyAcceptedTeamDevelopers(acceptedJob, normalizedTeam);
    console.log("[AcceptTeam] Matched developers:", matched.length, "Unmatched:", unmatched.length);

    onAcceptTeam(acceptedJob);
  };

  const handleRejectTeam = () => {
    // Just close the modal - nothing is saved to localStorage
    onRejectTeam();
  };

  const skills = Array.isArray(response?.skills_required)
    ? response.skills_required
    : response?.required_skill
      ? [response.required_skill]
      : job?.requirements?.skills || job?.skills || [];

  const notes =
    response?.notes ??
    response?.summary?.notes ??
    "";

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-[980px] max-h-[90vh] overflow-y-auto bg-white rounded-[24px] border border-[#D9EFEF] shadow-xl p-6 md:p-8">
        {/* Header */}
        <h2 className="text-[24px] font-semibold text-[#111827] mb-2">
          Recommended Team
        </h2>
        <p className="text-[15px] text-[#6B7280] mb-6">
          AI matched this team based on your job requirements.
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Team Size</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              {calculatedTeamSize || response?.team_size || job?.requirements?.team_size || "—"}
            </p>
          </div>
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Budget</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              ${budget.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#F9FAFB] rounded-[12px] border border-[#E5E7EB] p-4">
            <p className="text-[13px] text-[#6B7280] mb-1">Total Cost</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              ${calculatedTotalCost.toLocaleString()}
            </p>
            <p className="text-[12px] text-[#6B7280] mt-1">
              {projectDurationInWeeks} week(s)
            </p>
          </div>
          <div className={`rounded-[12px] border p-4 ${
            isOverBudget
              ? "bg-red-50 border-red-200"
              : calculatedTotalCost > 0
                ? "bg-emerald-50 border-emerald-200"
                : "bg-[#F9FAFB] border-[#E5E7EB]"
          }`}>
            <p className="text-[13px] text-[#6B7280] mb-1">Budget Status</p>
            <p className={`text-[16px] font-semibold ${
              isOverBudget ? "text-red-700" : calculatedTotalCost > 0 ? "text-emerald-700" : "text-[#0B6B63]"
            }`}>
              {budgetStatus}
            </p>
          </div>
        </div>

        {/* Over Budget Warning */}
        {isOverBudget && (
          <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
            <p className="text-[15px] text-red-700 font-medium">
              This team exceeds your budget and cannot be accepted.
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

        {/* Notes */}
        {notes && (
          <div className="bg-[#F0FDF4] border border-[#D9EFEF] rounded-[12px] p-4 mb-6">
            <h3 className="text-[14px] font-semibold text-[#0B6B63] mb-2">Notes</h3>
            <p className="text-[14px] text-[#374151]">{notes}</p>
          </div>
        )}

        {/* Error State */}
        {!isSuccess && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] p-4 mb-6">
            <h3 className="text-[16px] font-semibold text-[#DC2626] mb-2">
              AI matching failed
            </h3>
            {job.n8nError && (
              <p className="text-[14px] text-[#991B1B]">{job.n8nError}</p>
            )}
          </div>
        )}

        {/* Empty State */}
        {isSuccess && selectedTeam.length === 0 && (
          <div className="text-center py-8 mb-6">
            <p className="text-[16px] text-[#6B7280]">
              No team members were returned.
            </p>
            <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-left">
              <p className="mb-2 text-sm font-semibold text-[#111827]">
                Debug: Response
              </p>
              <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap text-xs text-[#374151]">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Team Cards Grid */}
        {normalizedTeam.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[14px] font-semibold text-[#374151] mb-4 uppercase tracking-wide">
              Selected Developers ({normalizedTeam.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {normalizedTeam.map((developer) => {
                const developerId = getDeveloperId(developer);
                const developerName = getDeveloperName(developer);
                const developerTrack = getDeveloperTrack(developer);
                const hourRate = getDeveloperHourRate(developer);
                const hoursPerWeek = getDeveloperHoursPerWeek(developer);
                const weeklyCost = getDeveloperWeeklyCost(developer);
                const initial = developerName.charAt(0).toUpperCase();

                return (
                  <div
                    key={developerId}
                    className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar Placeholder */}
                      <div className="w-14 h-14 rounded-full bg-[#D9EFEF] flex items-center justify-center text-[#0B6B63] text-lg font-semibold border-2 border-[#D9EFEF] shrink-0">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[16px] font-semibold text-[#111827] truncate">
                          {developerName}
                        </h4>
                        <p className="text-[13px] text-[#0B6B63] font-medium">
                          {developerTrack}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-[13px] text-[#6B7280]">
                      <p>
                        <span className="font-medium">Hour Rate:</span> $
                        {hourRate}/hr
                      </p>
                      <p>
                        <span className="font-medium">Hours/Week:</span>{" "}
                        {hoursPerWeek} hrs/week
                      </p>
                      <p>
                        <span className="font-medium">Weekly Cost:</span> $
                        {weeklyCost}/week
                      </p>
                    </div>


                    <a
                      href={`/developer/profile/${developerId}`}
                      className="mt-4 inline-flex items-center justify-center w-full h-[40px] rounded-[8px] bg-[#0B6B63] text-white text-[14px] font-medium hover:opacity-90 transition"
                    >
                      View Profile
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleRejectTeam}
            type="button"
            className="h-[48px] min-w-[160px] rounded-[10px] border border-red-300 text-red-700 text-[15px] font-medium hover:bg-red-50 transition"
          >
            Reject Team
          </button>
          <button
            onClick={handleAcceptTeam}
            type="button"
            disabled={!canAcceptTeam}
            className={`h-[48px] min-w-[160px] rounded-[10px] text-white text-[15px] font-medium transition ${
              canAcceptTeam
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-emerald-600 opacity-50 cursor-not-allowed"
            }`}
          >
            Accept Team
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublishResultModal;
