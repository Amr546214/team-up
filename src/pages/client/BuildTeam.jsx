import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

function BuildTeam() {
  const navigate = useNavigate();

  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [availableDevelopers] = useState([
    {
      id: 1,
      name: "Hanan Muhammed",
      role: "Frontend Developer",
      skills: ["React", "Tailwind", "TypeScript"],
      rating: 4.9,
      rank: "Gold",
      hourlyRate: "$45/hr",
      avatar: "",
      available: true,
    },
    {
      id: 2,
      name: "Sara Ahmed",
      role: "Backend Developer",
      skills: ["Node.js", "Python", "MongoDB"],
      rating: 4.7,
      rank: "Gold",
      hourlyRate: "$50/hr",
      avatar: "",
      available: true,
    },
    {
      id: 3,
      name: "Omar Essam",
      role: "UI/UX Designer",
      skills: ["Figma", "Adobe XD", "Prototyping"],
      rating: 4.5,
      rank: "Silver",
      hourlyRate: "$40/hr",
      avatar: "",
      available: true,
    },
    {
      id: 4,
      name: "Youssef Khaled",
      role: "Fullstack Developer",
      skills: ["React", "Node.js", "AWS"],
      rating: 4.8,
      rank: "Gold",
      hourlyRate: "$55/hr",
      avatar: "",
      available: false,
    },
    {
      id: 5,
      name: "Eman Ali",
      role: "DevOps Engineer",
      skills: ["Docker", "Kubernetes", "CI/CD"],
      rating: 4.6,
      rank: "Silver",
      hourlyRate: "$48/hr",
      avatar: "",
      available: true,
    },
  ]);

  const [selectedMembers, setSelectedMembers] = useState([]);

  const roles = [
    "All",
    "Frontend Developer",
    "Backend Developer",
    "UI/UX Designer",
    "Fullstack Developer",
    "DevOps Engineer",
  ];

  /* =========================
     UI Logic
  ========================== */
  const filteredDevelopers = availableDevelopers.filter((dev) => {
    const matchesSearch =
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.skills.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesRole = selectedRole === "All" || dev.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddMember = (dev) => {
    if (selectedMembers.find((m) => m.id === dev.id)) return;
    setSelectedMembers((prev) => [...prev, dev]);
  };

  const handleRemoveMember = (devId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== devId));
  };

  const getRankBadgeStyle = (rank) => {
    switch (rank.toLowerCase()) {
      case "gold":
        return "bg-[#FEF3C7] text-[#D97706]";
      case "silver":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#EEF2FF] text-[#4F46E5]";
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F9]">
      <Header />

      <div className="pt-20 px-4 md:px-8 pb-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center hover:bg-[#F8FAFC] transition"
            >
              <ArrowLeft size={20} className="text-[#111827]" />
            </button>

            <div>
              <h1 className="text-[24px] md:text-[28px] font-bold text-[#111827]">
                Build Your Team
              </h1>
              <p className="text-[14px] text-[#6B7280] mt-1">
                Search and select developers to build your project team.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
            {/* Left: Developer Search */}
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="bg-white rounded-[16px] p-5 border border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or skill..."
                      className="w-full h-11 pl-11 pr-4 rounded-xl border border-[#E5E7EB] text-sm outline-none focus:border-[#0B6F6C]"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 px-4 rounded-xl border border-[#E5E7EB] flex items-center gap-2 text-sm text-[#6B7280] hover:bg-[#F8FAFC] transition"
                  >
                    <Filter size={16} />
                    Filters
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedRole === role
                            ? "bg-[#0B6F6C] text-white"
                            : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Developer Cards */}
              <div className="space-y-4">
                {filteredDevelopers.map((dev) => {
                  const isSelected = selectedMembers.find(
                    (m) => m.id === dev.id
                  );

                  return (
                    <div
                      key={dev.id}
                      className={`bg-white rounded-[16px] p-5 border transition ${
                        isSelected
                          ? "border-[#0B6F6C] bg-[#F0FBFA]"
                          : "border-[#E5E7EB]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#D9D9D9] shrink-0" />

                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-[16px] font-semibold text-[#111827]">
                                {dev.name}
                              </h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${getRankBadgeStyle(
                                  dev.rank
                                )}`}
                              >
                                {dev.rank}
                              </span>
                            </div>

                            <p className="text-[14px] text-[#6B7280] mt-0.5">
                              {dev.role}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {dev.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-3 py-1 rounded-lg bg-[#F3F4F6] text-[12px] text-[#4B5563] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-[13px] text-[#6B7280]">
                              <span className="flex items-center gap-1">
                                <Star
                                  size={14}
                                  className="text-[#EAB308] fill-[#EAB308]"
                                />
                                {dev.rating}
                              </span>
                              <span>{dev.hourlyRate}</span>
                              <span
                                className={
                                  dev.available
                                    ? "text-[#22C55E]"
                                    : "text-[#EF4444]"
                                }
                              >
                                {dev.available ? "Available" : "Busy"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            isSelected
                              ? handleRemoveMember(dev.id)
                              : handleAddMember(dev)
                          }
                          disabled={!dev.available && !isSelected}
                          className={`h-10 px-4 rounded-xl text-sm font-medium transition shrink-0 ${
                            isSelected
                              ? "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
                              : dev.available
                              ? "bg-[#0B6F6C] text-white hover:bg-[#095c5a]"
                              : "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                          }`}
                        >
                          {isSelected ? (
                            <span className="flex items-center gap-1">
                              <X size={14} /> Remove
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Plus size={14} /> Add
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredDevelopers.length === 0 && (
                  <div className="bg-white rounded-[16px] p-8 border border-[#E5E7EB] text-center">
                    <p className="text-[#6B7280]">
                      No developers found matching your criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Team */}
            <div className="bg-white rounded-[16px] p-5 border border-[#E5E7EB] h-fit sticky top-24">
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
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D9D9D9] shrink-0" />
                        <div>
                          <p className="text-[14px] font-medium text-[#111827]">
                            {member.name}
                          </p>
                          <p className="text-[12px] text-[#6B7280]">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-[#EF4444] hover:text-[#DC2626] transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedMembers.length > 0 && (
                <button
                  onClick={() => {
                    alert(
                      "Team created with: " +
                        selectedMembers.map((m) => m.name).join(", ")
                    );
                  }}
                  className="w-full mt-5 h-11 rounded-xl bg-[#0B6F6C] text-white text-sm font-medium hover:bg-[#095c5a] transition"
                >
                  Confirm Team ({selectedMembers.length} members)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuildTeam;
