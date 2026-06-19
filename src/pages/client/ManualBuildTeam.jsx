import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/common/Header";
import {
  ArrowLeft,
  Search,
  Star,
  Users,
  Filter,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";

const BASE_URL = "https://team-up-backend-production-6c43.up.railway.app";

const ManualBuildTeam = () => {
  const navigate = useNavigate();
  const location = useLocation();

  console.log("MANUAL location.state:", location.state);
  console.log("MANUAL job:", location.state?.job);
  console.log(
    "MANUAL jobId:",
    location.state?.job?.jobId || location.state?.job?.id
  );
  const job = location.state?.job;
  const jobId = job?.jobId || job?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [availability, setAvailability] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [developers, setDevelopers] = useState([]);
  const [allApplicants, setAllApplicants] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const token = localStorage.getItem("teamup_access_token");
  const role = localStorage.getItem("teamup_user_role") || "client";
  const apiRole = role === "company" ? "company" : "client";

  const getDevId = (dev) =>
    dev?.applicationId ||
    dev?._id ||
    dev?.userId ||
    dev?.developerId ||
    dev?.id ||
    dev?.user?._id ||
    dev?.user?.id;

  const getName = (dev) =>
    dev?.name || dev?.fullName || dev?.user?.name || dev?.user?.fullName || "Unknown";

  const getRoleTitle = (dev) =>
    dev?.role || dev?.title || dev?.jobTitle || "Developer";

  const fetchDevelopers = async () => {
    try {
      setLoading(true);

      if (jobId) {
        const res = await fetch(
          `${BASE_URL}/project/jobs/my-posts/${jobId}/applicants?page=1&limit=3`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to fetch applicants:", data);
          setDevelopers([]);
          setAllApplicants([]);
          return;
        }

        const fetched = data?.data?.applicants || data?.applicants || [];
        let list = fetched.map((item) => ({
          applicationId: item.applicationId,
          _id: item.applicationId,
          name: item.developer?.name || "Unknown Developer",
          role: item.developer?.profile?.title || item.developer?.title || "Developer",
          skills: item.developer?.skills || [],
          rating: item.developer?.rankScore || 0,
          rank: item.developer?.rank || "Bronze",
          hourlyRate: `$${item.proposedBudget || 0}/hr`,
          availability: "available",
          available: true,
          avatar: item.developer?.profilePicture || item.developer?.avatar || "",
          developer: item.developer,
        }));

        setAllApplicants(list);

        // Apply filters locally
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          list = list.filter(
            (dev) =>
              dev.name.toLowerCase().includes(query) ||
              dev.role.toLowerCase().includes(query) ||
              dev.skills.some((s) => s.toLowerCase().includes(query))
          );
        }
        if (selectedSkill.trim()) {
          const skillQuery = selectedSkill.toLowerCase().trim();
          list = list.filter((dev) =>
            dev.skills.some((s) => s.toLowerCase().includes(skillQuery))
          );
        }
        if (selectedRank) {
          const rankQuery = selectedRank.toLowerCase();
          list = list.filter((dev) => dev.rank.toLowerCase() === rankQuery);
        }

        setDevelopers(list);
      } else {
        const selectedDeveloperIds = selectedMembers
          .map((dev) => getDevId(dev))
          .filter(Boolean)
          .join(",");

        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          search: searchQuery,
          skill: selectedSkill,
          rank: selectedRank,
          availability,
          selectedDeveloperIds,
        });

        const res = await fetch(
          `${BASE_URL}/${apiRole}/team-builder/developers?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed developers response:", data);
          setDevelopers([]);
          return;
        }

        const list =
          data?.data?.developers ||
          data?.developers ||
          data?.data ||
          [];

        setDevelopers(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error("Failed to fetch developers:", error);
      setDevelopers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, [searchQuery, selectedSkill, selectedRank, availability]);

  const handleAddMember = (dev) => {
    const id = getDevId(dev);

    console.log("ADD DEV:", dev);
    console.log("DEV ID:", id);

    if (!id) {
      alert("Developer ID Missing");
      return;
    }

    const exists = selectedMembers.some((m) => getDevId(m) === id);

    if (exists) return;

    setSelectedMembers((prev) => [...prev, dev]);
  };

  const handleRemoveMember = (devId) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => getDevId(m) !== devId)
    );
  };

  const handleConfirmTeam = async () => {
    const selectedIds = selectedMembers
      .map((dev) => getDevId(dev))
      .filter(Boolean);

    if (selectedIds.length === 0) {
      alert("Please select developers first");
      return;
    }

    try {
      setConfirmLoading(true);

      if (jobId) {
        const unselectedIds = allApplicants
          .map((app) => app.applicationId)
          .filter((id) => !selectedIds.includes(id));

        console.log("Job-specific build team confirm:");
        console.log("Selected IDs:", selectedIds);
        console.log("Unselected IDs:", unselectedIds);

        // 1. PATCH status of selected applicants to "accepted"
        const acceptPromises = selectedIds.map(async (appId) => {
          const res = await fetch(
            `${BASE_URL}/project/jobs/my-posts/${jobId}/applicants/${appId}/status`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "accepted" }),
            }
          );
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.message || `Failed to accept applicant ${appId}`);
          }
        });

        // 2. PATCH status of unselected applicants to "rejected"
        const rejectPromises = unselectedIds.map(async (appId) => {
          const res = await fetch(
            `${BASE_URL}/project/jobs/my-posts/${jobId}/applicants/${appId}/status`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "rejected" }),
            }
          );
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.message || `Failed to reject applicant ${appId}`);
          }
        });

        // Wait for all PATCH requests
        await Promise.all([...acceptPromises, ...rejectPromises]);

        // 3. POST /client/job/${jobId}/build-team
        const buildRes = await fetch(
          `${BASE_URL}/client/job/${jobId}/build-team`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              applicationIds: selectedIds,
              closeJob: true,
              projectTitle: `${job?.title || "Project"} Team`,
            }),
          }
        );

        const buildData = await buildRes.json();

        if (!buildRes.ok) {
          throw new Error(buildData?.message || "Failed to build team for the project.");
        }

        alert("Team confirmed successfully");
        navigate("/client/my-jobs");
      } else {
        // Fallback generic team builder confirm flow
        console.log("Fallback generic build team confirm. IDs:", selectedIds);

        const res = await fetch(`${BASE_URL}/${apiRole}/team-builder/confirm`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            developerIds: selectedIds,
            closeJob: false,
            projectTitle: "Frontend Core Team",
            description: "Team selected manually from Build Your Team page",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Confirm failed:", data);
          alert(data?.message || "Failed to confirm team");
          return;
        }

        alert("Team confirmed successfully");
        console.log("Confirm team:", data);
      }
    } catch (error) {
      console.error("Failed to confirm team:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleViewProfile = (dev) => {
    const id = getDevId(dev);

    if (!id) {
      alert("Developer ID Missing");
      return;
    }

    navigate(`/${apiRole}/developers/${id}/profile`);
  };

  const getRankBadgeStyle = (rank = "") => {
    switch (rank.toLowerCase()) {
      case "gold":
        return "bg-[#FEF3C7] text-[#D97706]";
      case "silver":
        return "bg-[#F3F4F6] text-[#6B7280]";
      case "bronze":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      default:
        return "bg-[#EEF2FF] text-[#4F46E5]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                {job?.title ? `Build Team for ${job.title}` : "Build Your Team"}
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                {job?.title
                  ? "Search and select applicants to build your project team."
                  : "Search and select developers to build your project team."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-[16px] p-5 border border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or skill..."
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 px-4 rounded-xl border border-[#E5E7EB] flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:bg-[#F8FAFC] transition"
                  >
                    <Filter size={16} />
                    Filters
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      placeholder="Skill"
                      className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    />

                    <select
                      value={selectedRank}
                      onChange={(e) => setSelectedRank(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    >
                      <option value="">All ranks</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="bronze">Bronze</option>
                    </select>

                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    >
                      <option value="all">All</option>
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {loading && (
                  <div className="bg-white rounded-[16px] p-8 border border-[#E5E7EB] text-center text-[#6B7280]">
                    Loading developers...
                  </div>
                )}

                {!loading &&
                  developers.map((dev, index) => {
                    const devId = getDevId(dev);
                    const name = getName(dev);
                    const roleTitle = getRoleTitle(dev);
                    const skills = dev?.skills || [];
                    const rating = dev?.rating || dev?.averageRating || 0;
                    const rank = dev?.rank || "Bronze";
                    const hourlyRate = dev?.hourlyRate || dev?.rate || "$0/hr";
                    const status = dev?.availability || dev?.status;
                    const available =
                      status === "available" ||
                      dev?.available === true ||
                      !status;

                    const isSelected = selectedMembers.some(
                      (m) => getDevId(m) === devId
                    );

                    return (
                      <div
                        key={devId || dev?.email || name || index}
                        className={`bg-white rounded-[16px] p-5 border transition ${
                          isSelected
                            ? "border-[#0B6F6C] bg-[#F0FBFA]"
                            : "border-[#E5E7EB]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#D9D9D9] shrink-0 overflow-hidden">
                              {dev?.avatar && (
                                <img
                                  src={dev.avatar}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-[16px] font-semibold text-[#111827]">
                                  {name}
                                </h3>

                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getRankBadgeStyle(
                                    rank
                                  )}`}
                                >
                                  {rank}
                                </span>
                              </div>

                              <p className="text-[14px] text-[#6B7280] mt-0.5">
                                {roleTitle}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-3">
                                {skills.map((skill, skillIndex) => (
                                  <span
                                    key={`${devId || index}-${skill}-${skillIndex}`}
                                    className="px-3 py-1 rounded-lg bg-[#F3F4F6] text-[12px] text-[#4B5563] font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-[#6B7280]">
                                <span className="flex items-center gap-1">
                                  <Star
                                    size={14}
                                    className="text-[#EAB308] fill-[#EAB308]"
                                  />
                                  {rating}
                                </span>

                                <span>{hourlyRate}</span>

                                <span
                                  className={
                                    available
                                      ? "text-[#22C55E]"
                                      : "text-[#EF4444]"
                                  }
                                >
                                  {available ? "Available" : "Busy"}
                                </span>
                              </div>

                              <button
                                onClick={() => handleViewProfile(dev)}
                                className="mt-3 text-sm text-[#0B6F6C] font-medium hover:underline"
                              >
                                View Profile
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              isSelected
                                ? handleRemoveMember(devId)
                                : handleAddMember(dev)
                            }
                            disabled={!available && !isSelected}
                            className={`h-10 px-4 rounded-xl text-sm font-medium transition shrink-0 ${
                              isSelected
                                ? "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
                                : available
                                ? "bg-[#0B6F6C] text-white hover:bg-[#095c5a]"
                                : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                            }`}
                          >
                            {isSelected ? (
                              <span className="flex items-center gap-1 justify-center">
                                <X size={14} /> Remove
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 justify-center">
                                <Plus size={14} /> Add
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {!loading && developers.length === 0 && (
                  <div className="bg-white rounded-[16px] p-8 border border-[#E5E7EB] text-center">
                    <p className="text-[#6B7280]">
                      No developers found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[16px] p-5 border border-[#E5E7EB] h-fit xl:sticky xl:top-24">
              <div className="flex items-center gap-2 mb-5">
                <Users size={20} className="text-[#0B6F6C]" />
                <h2 className="text-[18px] font-bold text-[#111827]">
                  Your Team ({selectedMembers.length})
                </h2>
              </div>

              {selectedMembers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[14px] text-[#9CA3AF]">
                    No members selected yet.
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] mt-1">
                    Add developers from the list to build your team.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMembers.map((member, index) => {
                    const memberId = getDevId(member);
                    const name = getName(member);
                    const roleTitle = getRoleTitle(member);

                    return (
                      <div
                        key={memberId || member?.email || name || index}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
                      >
                        <div>
                          <p className="text-[14px] font-medium text-[#111827]">
                            {name}
                          </p>
                          <p className="text-[12px] text-[#6B7280]">
                            {roleTitle}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="text-[#EF4444] hover:text-[#DC2626] transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedMembers.length > 0 && (
                <button
                  onClick={handleConfirmTeam}
                  disabled={confirmLoading}
                  className="w-full mt-5 h-11 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmLoading ? "Confirming..." : `Confirm Team (${selectedMembers.length} members)`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManualBuildTeam;