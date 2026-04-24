import { useRef, useState } from "react";
import {
  Users,
  MapPin,
  Globe,
  Mail,
  X,
  ImagePlus,
  CircleCheck,
  BriefcaseBusiness,
  UsersRound,
  Plus,
  CalendarDays,
  Monitor,
} from "lucide-react";
import Header from "../../../components/common/Header";
import teamupLogo from "../../../assets/logo/teamup-logo.png";

function CompanyProfile() {
  /* =========================
     Fake API Data (Data only)
  ========================== */
  const [company, setCompany] = useState({
    name: "TeamUP",
    type: "Software house",
    size: "Medium (50-200 employees)",
    location: "Bani-sueif",
    website: "https://teamup.com",
    email: "contact@teamup.com",
    logo: teamupLogo,
  });

  const [aboutCompany, setAboutCompany] = useState({
    description:
      "Teamup Solutions is a leading software development company specializing in enterprise-level applications and cutting-edge technology solutions. We pride ourselves on delivering innovative products that transform businesses and enhance user experiences",
    projectTypes: [
      "Web Application",
      "Mobile App",
      "AI/ML",
      "Cloud",
      "Enterprise Software",
    ],
  });

  const [companyStats] = useState({
    activeJobs: 12,
    closedJobs: 12,
    totalApplications: 200,
  });

  const [postedJobs, setPostedJobs] = useState([
    {
      id: 1,
      title: "Senior React Developer",
      postedTime: "Posted 5 day ago",
      type: "Full-Time",
      workMode: "Remote",
      applicationsCount: 40,
      status: "active",
      description: "Build scalable React interfaces for enterprise products.",
      requirements: "React, Tailwind, REST APIs",
    },
    {
      id: 2,
      title: "UI/UX Designer",
      postedTime: "Posted 1 week ago",
      type: "Full-Time",
      workMode: "Hybrid",
      applicationsCount: 10,
      status: "active",
      description: "Design modern user experiences and wireframes.",
      requirements: "Figma, UX Research, Prototyping",
    },
    {
      id: 3,
      title: "Backend Node.js",
      postedTime: "Posted 2 week ago",
      type: "Part-Time",
      workMode: "Onsite",
      applicationsCount: 20,
      status: "closed",
      description: "Develop APIs and handle backend integrations.",
      requirements: "Node.js, Express, MongoDB",
    },
  ]);

  /* =========================
     Company Profile Edit State
  ========================== */
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: "TeamUP",
    type: "Software house",
    size: "Medium (50-200 employees)",
    location: "Bani-sueif",
    website: "https://teamup.com",
    email: "contact@teamup.com",
    logo: teamupLogo,
  });

  /* =========================
     About Company Edit State
  ========================== */
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutForm, setAboutForm] = useState({
    description:
      "Teamup Solutions is a leading software development company specializing in enterprise-level applications and cutting-edge technology solutions. We pride ourselves on delivering innovative products that transform businesses and enhance user experiences",
    projectTypes: [
      "Web Application",
      "Mobile App",
      "AI/ML",
      "Cloud",
      "Enterprise Software",
    ],
    newTag: "",
  });

  /* =========================
     Posted Jobs Modal State
  ========================== */
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showViewJobModal, setShowViewJobModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showCloseJobModal, setShowCloseJobModal] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);

  const [jobForm, setJobForm] = useState({
    title: "",
    postedTime: "Posted just now",
    type: "Full-Time",
    workMode: "Remote",
    applicationsCount: 0,
    status: "active",
    description: "",
    requirements: "",
  });

  /* =========================
     Interview Modal State
  ========================== */
  const [interviews, setInterviews] = useState({
    upcoming: [
      {
        id: 1,
        candidateName: "Emma Wilson",
        title: "Technical Interview - Senior Frontend Developer",
        date: "Feb 10, 2026",
        time: "10:00 AM",
        mode: "Onsite",
        notes: "Bring portfolio and previous frontend project examples.",
      },
    ],
    past: [
      {
        id: 2,
        candidateName: "Muhammed Ahmed",
        result: "Passed",
        title: "Final Interview",
        feedback:
          "Strong technical skills and excellent communication, Recommended for hire",
        date: "Feb 10, 2026",
        time: "10:00 AM",
      },
    ],
  });

  const [showScheduleInterviewModal, setShowScheduleInterviewModal] =
    useState(false);
  const [showInterviewDetailsModal, setShowInterviewDetailsModal] =
    useState(false);
  const [showInterviewFeedbackModal, setShowInterviewFeedbackModal] =
    useState(false);

  const [selectedInterview, setSelectedInterview] = useState(null);

  const [interviewForm, setInterviewForm] = useState({
    candidateName: "",
    jobTitle: "",
    interviewType: "Technical",
    date: "",
    time: "",
    mode: "Onsite",
    meetingLink: "",
    notes: "",
  });

  const fileInputRef = useRef(null);

  /* =========================
     Helpers
  ========================== */
  const formatWebsiteText = (website) => {
    if (!website) return "";
    return website.replace(/^https?:\/\//, "").replace(/^www\./i, "WWW.");
  };

  const getJobTypeBadgeStyle = (type) => {
    switch (type.toLowerCase()) {
      case "full-time":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      case "part-time":
        return "bg-[#FFF7ED] text-[#D97706]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const getWorkModeBadgeStyle = (mode) => {
    switch (mode.toLowerCase()) {
      case "remote":
        return "bg-[#F3E8FF] text-[#9333EA]";
      case "hybrid":
        return "bg-[#FEF3C7] text-[#D97706]";
      case "onsite":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const getJobStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "closed":
        return "bg-[#F3F4F6] text-[#6B7280]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  const getInterviewResultStyle = (result) => {
    switch (result.toLowerCase()) {
      case "passed":
        return "bg-[#EAF8EE] text-[#22C55E]";
      case "accepted":
        return "bg-[#EAF8EE] text-[#15803D]";
      case "rejected":
        return "bg-[#FEE2E2] text-[#DC2626]";
      case "moved to next step":
        return "bg-[#EEF2FF] text-[#4F46E5]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280]";
    }
  };

  /* =========================
     Interaction: Open Edit Profile Modal
  ========================== */
  const handleOpenEditProfileModal = () => {
    setEditProfileForm({
      name: company.name,
      type: company.type,
      size: company.size,
      location: company.location,
      website: company.website,
      email: company.email,
      logo: company.logo,
    });
    setShowEditProfileModal(true);
  };

  /* =========================
     Interaction: Close Edit Profile Modal
  ========================== */
  const handleCloseEditProfileModal = () => {
    setShowEditProfileModal(false);
  };

  /* =========================
     Interaction: Edit Profile Form Change
  ========================== */
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     Interaction: Change Company Logo
  ========================== */
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setEditProfileForm((prev) => ({
      ...prev,
      logo: imageUrl,
    }));
  };

  /* =========================
     Interaction: Save Profile Changes
  ========================== */
  const handleSaveProfile = (e) => {
    e.preventDefault();

    setCompany({
      name: editProfileForm.name,
      type: editProfileForm.type,
      size: editProfileForm.size,
      location: editProfileForm.location,
      website: editProfileForm.website,
      email: editProfileForm.email,
      logo: editProfileForm.logo,
    });

    setShowEditProfileModal(false);
  };

  /* =========================
     Interaction: Open About Modal
  ========================== */
  const handleOpenAboutModal = () => {
    setAboutForm({
      description: aboutCompany.description,
      projectTypes: [...aboutCompany.projectTypes],
      newTag: "",
    });
    setShowAboutModal(true);
  };

  /* =========================
     Interaction: Close About Modal
  ========================== */
  const handleCloseAboutModal = () => {
    setShowAboutModal(false);
  };

  /* =========================
     Interaction: Change About Description
  ========================== */
  const handleAboutDescriptionChange = (e) => {
    setAboutForm((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  /* =========================
     Interaction: Change New Tag Input
  ========================== */
  const handleNewTagChange = (e) => {
    setAboutForm((prev) => ({
      ...prev,
      newTag: e.target.value,
    }));
  };

  /* =========================
     Interaction: Add New Project Type Tag
  ========================== */
  const handleAddProjectType = () => {
    const trimmedTag = aboutForm.newTag.trim();

    if (!trimmedTag) return;

    if (aboutForm.projectTypes.includes(trimmedTag)) {
      setAboutForm((prev) => ({
        ...prev,
        newTag: "",
      }));
      return;
    }

    setAboutForm((prev) => ({
      ...prev,
      projectTypes: [...prev.projectTypes, trimmedTag],
      newTag: "",
    }));
  };

  /* =========================
     Interaction: Delete Project Type Tag
  ========================== */
  const handleDeleteProjectType = (tagToDelete) => {
    setAboutForm((prev) => ({
      ...prev,
      projectTypes: prev.projectTypes.filter((tag) => tag !== tagToDelete),
    }));
  };

  /* =========================
     Interaction: Edit Existing Project Type Tag
  ========================== */
  const handleEditProjectType = (index, value) => {
    setAboutForm((prev) => ({
      ...prev,
      projectTypes: prev.projectTypes.map((tag, i) =>
        i === index ? value : tag
      ),
    }));
  };

  /* =========================
     Interaction: Save About Changes
  ========================== */
  const handleSaveAbout = (e) => {
    e.preventDefault();

    setAboutCompany({
      description: aboutForm.description,
      projectTypes: aboutForm.projectTypes.filter((tag) => tag.trim() !== ""),
    });

    setShowAboutModal(false);
  };

  /* =========================
     Interaction: Open Post New Job Modal
  ========================== */
  const handleOpenPostJobModal = () => {
    setJobForm({
      title: "",
      postedTime: "Posted just now",
      type: "Full-Time",
      workMode: "Remote",
      applicationsCount: 0,
      status: "active",
      description: "",
      requirements: "",
    });
    setShowPostJobModal(true);
  };

  /* =========================
     Interaction: Close Post New Job Modal
  ========================== */
  const handleClosePostJobModal = () => {
    setShowPostJobModal(false);
  };

  /* =========================
     Interaction: Open View Job Modal
  ========================== */
  const handleOpenViewJobModal = (job) => {
    setSelectedJob(job);
    setShowViewJobModal(true);
  };

  /* =========================
     Interaction: Close View Job Modal
  ========================== */
  const handleCloseViewJobModal = () => {
    setSelectedJob(null);
    setShowViewJobModal(false);
  };

  /* =========================
     Interaction: Open Edit Job Modal
  ========================== */
  const handleOpenEditJobModal = (job) => {
    setSelectedJob(job);
    setJobForm({
      title: job.title,
      postedTime: job.postedTime,
      type: job.type,
      workMode: job.workMode,
      applicationsCount: job.applicationsCount,
      status: job.status,
      description: job.description || "",
      requirements: job.requirements || "",
    });
    setShowEditJobModal(true);
  };

  /* =========================
     Interaction: Close Edit Job Modal
  ========================== */
  const handleCloseEditJobModal = () => {
    setSelectedJob(null);
    setShowEditJobModal(false);
  };

  /* =========================
     Interaction: Open Close Job Modal
  ========================== */
  const handleOpenCloseJobModal = (job) => {
    setSelectedJob(job);
    setShowCloseJobModal(true);
  };

  /* =========================
     Interaction: Close Close Job Modal
  ========================== */
  const handleCloseCloseJobModal = () => {
    setSelectedJob(null);
    setShowCloseJobModal(false);
  };

  /* =========================
     Interaction: Change Job Form
  ========================== */
  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobForm((prev) => ({
      ...prev,
      [name]: name === "applicationsCount" ? Number(value) : value,
    }));
  };

  /* =========================
     Interaction: Save New Job
  ========================== */
  const handleSaveNewJob = (e) => {
    e.preventDefault();

    const newJob = {
      id: Date.now(),
      ...jobForm,
    };

    setPostedJobs((prev) => [newJob, ...prev]);
    setShowPostJobModal(false);
  };

  /* =========================
     Interaction: Save Edited Job
  ========================== */
  const handleSaveEditedJob = (e) => {
    e.preventDefault();

    setPostedJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id ? { ...job, ...jobForm } : job
      )
    );

    setSelectedJob(null);
    setShowEditJobModal(false);
  };

  /* =========================
     Interaction: Confirm Close Job
  ========================== */
  const handleConfirmCloseJob = () => {
    setPostedJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id ? { ...job, status: "closed" } : job
      )
    );
    setSelectedJob(null);
    setShowCloseJobModal(false);
  };

  /* =========================
     Interaction: Open Schedule Interview Modal
  ========================== */
  const handleOpenScheduleInterviewModal = () => {
    setSelectedInterview(null);
    setInterviewForm({
      candidateName: "",
      jobTitle: "",
      interviewType: "Technical",
      date: "",
      time: "",
      mode: "Onsite",
      meetingLink: "",
      notes: "",
    });
    setShowScheduleInterviewModal(true);
  };

  /* =========================
     Interaction: Close Schedule Interview Modal
  ========================== */
  const handleCloseScheduleInterviewModal = () => {
    setSelectedInterview(null);
    setShowScheduleInterviewModal(false);
  };

  /* =========================
     Interaction: Change Interview Form
  ========================== */
  const handleInterviewFormChange = (e) => {
    const { name, value } = e.target;
    setInterviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     Interaction: Save New Interview
  ========================== */
  const handleSaveInterview = (e) => {
    e.preventDefault();

    const newInterview = {
      id: Date.now(),
      candidateName: interviewForm.candidateName,
      title: `${interviewForm.interviewType} Interview - ${interviewForm.jobTitle}`,
      date: interviewForm.date || "No date",
      time: interviewForm.time || "No time",
      mode: interviewForm.mode,
      notes: interviewForm.notes,
      meetingLink: interviewForm.meetingLink,
    };

    setInterviews((prev) => ({
      ...prev,
      upcoming: [newInterview, ...prev.upcoming],
    }));

    setShowScheduleInterviewModal(false);
  };

  /* =========================
     Interaction: Open Interview Details Modal
  ========================== */
  const handleOpenInterviewDetailsModal = (interview) => {
    setSelectedInterview(interview);
    setShowInterviewDetailsModal(true);
  };

  /* =========================
     Interaction: Close Interview Details Modal
  ========================== */
  const handleCloseInterviewDetailsModal = () => {
    setSelectedInterview(null);
    setShowInterviewDetailsModal(false);
  };

  /* =========================
     Interaction: Open Interview Feedback Modal
  ========================== */
  const handleOpenInterviewFeedbackModal = (interview) => {
    setSelectedInterview(interview);
    setShowInterviewFeedbackModal(true);
  };

  /* =========================
     Interaction: Close Interview Feedback Modal
  ========================== */
  const handleCloseInterviewFeedbackModal = () => {
    setSelectedInterview(null);
    setShowInterviewFeedbackModal(false);
  };

  /* =========================
     Interaction: Cancel Upcoming Interview
  ========================== */
  const handleCancelInterview = (interviewId) => {
    setInterviews((prev) => ({
      ...prev,
      upcoming: prev.upcoming.filter((item) => item.id !== interviewId),
    }));
  };

  /* =========================
     Interaction: Mark Upcoming Interview as Completed
  ========================== */
  const handleMarkInterviewCompleted = (interview) => {
    const completedInterview = {
      id: interview.id,
      candidateName: interview.candidateName,
      result: "Passed",
      title: interview.title,
      feedback: "Interview completed successfully.",
      date: interview.date,
      time: interview.time,
    };

    setInterviews((prev) => ({
      upcoming: prev.upcoming.filter((item) => item.id !== interview.id),
      past: [completedInterview, ...prev.past],
    }));
  };

  /* =========================
     Interaction: Reschedule Upcoming Interview
  ========================== */
  const handleRescheduleInterview = (interview) => {
    setSelectedInterview(interview);
    setInterviewForm({
      candidateName: interview.candidateName,
      jobTitle: interview.title.replace(/^.*Interview - /, ""),
      interviewType: interview.title.includes("Technical")
        ? "Technical"
        : interview.title.includes("HR")
        ? "HR"
        : "Final",
      date: interview.date,
      time: interview.time,
      mode: interview.mode,
      meetingLink: interview.meetingLink || "",
      notes: interview.notes || "",
    });
    setShowScheduleInterviewModal(true);
  };

  /* =========================
     Interaction: Save Rescheduled Interview
  ========================== */
  const handleSaveRescheduledInterview = (e) => {
    e.preventDefault();

    if (selectedInterview) {
      setInterviews((prev) => ({
        ...prev,
        upcoming: prev.upcoming.map((item) =>
          item.id === selectedInterview.id
            ? {
                ...item,
                candidateName: interviewForm.candidateName,
                title: `${interviewForm.interviewType} Interview - ${interviewForm.jobTitle}`,
                date: interviewForm.date,
                time: interviewForm.time,
                mode: interviewForm.mode,
                meetingLink: interviewForm.meetingLink,
                notes: interviewForm.notes,
              }
            : item
        ),
      }));

      setSelectedInterview(null);
      setShowScheduleInterviewModal(false);
      return;
    }

    handleSaveInterview(e);
  };

  /* =========================
     Interaction: Move Candidate To Next Step
  ========================== */
  const handleMoveCandidateToNextStep = (interviewId) => {
    setInterviews((prev) => ({
      ...prev,
      past: prev.past.map((item) =>
        item.id === interviewId
          ? { ...item, result: "Moved to Next Step" }
          : item
      ),
    }));
  };

  /* =========================
     Interaction: Accept Candidate
  ========================== */
  const handleAcceptCandidate = (interviewId) => {
    setInterviews((prev) => ({
      ...prev,
      past: prev.past.map((item) =>
        item.id === interviewId ? { ...item, result: "Accepted" } : item
      ),
    }));
  };

  /* =========================
     Interaction: Reject Candidate
  ========================== */
  const handleRejectCandidate = (interviewId) => {
    setInterviews((prev) => ({
      ...prev,
      past: prev.past.map((item) =>
        item.id === interviewId ? { ...item, result: "Rejected" } : item
      ),
    }));
  };

  return (
    <>
      <Header profileImage={company.logo} />
      <div className="min-h-screen bg-[#F4FAF9] px-4 md:px-6">
        <div className="max-w-[980px] mx-auto mt-[72px]">
        {/* Company Info (Header Card) */}
        <section className="bg-white rounded-[14px] border border-[#E7ECEB] px-6 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={company.logo}
                alt={company.name}
                className="w-[58px] h-[58px] object-contain shrink-0"
              />

              <div className="pt-1">
                <h1 className="text-[18px] md:text-[20px] font-semibold text-[#111827] leading-none">
                  {company.name}
                </h1>

                <p className="mt-3 text-[14px] text-[#2AA7A0] font-medium">
                  {company.type}
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenEditProfileModal}
              className="self-start h-[38px] px-5 rounded-[8px] bg-[#0B756F] text-white text-[13px] font-medium hover:bg-[#095f5a] transition"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-8 w-full max-w-[760px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-[#0B756F] shrink-0" />
              <p className="text-[14px] text-[#111827] leading-none">
                <span className="font-medium">Company Size:</span>{" "}
                {company.size}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[#0B756F] shrink-0" />
              <p className="text-[14px] text-[#111827] leading-none break-all">
                <span className="font-medium">Website :</span>{" "}
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2AA7A0] hover:underline"
                >
                  {formatWebsiteText(company.website)}
                </a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[#0B756F] shrink-0" />
              <p className="text-[14px] text-[#111827] leading-none">
                <span className="font-medium">Location:</span>{" "}
                {company.location}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[#0B756F] shrink-0" />
              <p className="text-[14px] text-[#111827] leading-none break-all">
                <span className="font-medium">Contact:</span>{" "}
                <a href={`mailto:${company.email}`} className="hover:underline">
                  {company.email}
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* About Company */}
        <section className="mt-5 bg-white rounded-[14px] border border-[#E7ECEB] px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[18px] md:text-[20px] font-semibold text-[#111827]">
              About Company
            </h2>

            <button
              onClick={handleOpenAboutModal}
              className="h-[38px] px-5 rounded-[8px] bg-[#0B756F] text-white text-[13px] font-medium hover:bg-[#095f5a] transition shrink-0"
            >
              Edit About
            </button>
          </div>

          <div className="mt-5">
            <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827]">
              Company Description
            </h3>

            <p className="mt-3 text-[14px] md:text-[15px] leading-8 text-[#6B7280] max-w-[760px]">
              {aboutCompany.description}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-[15px] md:text-[16px] font-semibold text-[#111827]">
              Types of projects
            </h3>

            <div className="mt-4 flex flex-wrap gap-3">
              {aboutCompany.projectTypes.map((type, index) => (
                <span
                  key={index}
                  className="h-[28px] px-4 rounded-full bg-[#CFEAE8] text-[#2AA7A0] text-[13px] font-medium inline-flex items-center justify-center"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Company Stats */}
        <section className="mt-5 bg-white rounded-[14px] border border-[#E7ECEB] px-5 md:px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#CFEAE8] rounded-[10px] px-4 py-4 min-h-[95px] flex flex-col justify-between">
              <CircleCheck size={18} className="text-[#0B756F]" />
              <div>
                <h3 className="text-[18px] font-semibold text-[#111827] leading-none">
                  {companyStats.activeJobs}
                </h3>
                <p className="mt-2 text-[14px] text-[#111827]">Active jobs</p>
              </div>
            </div>

            <div className="bg-[#CFEAE8] rounded-[10px] px-4 py-4 min-h-[95px] flex flex-col justify-between">
              <BriefcaseBusiness size={18} className="text-[#111827]" />
              <div>
                <h3 className="text-[18px] font-semibold text-[#111827] leading-none">
                  {companyStats.closedJobs}
                </h3>
                <p className="mt-2 text-[14px] text-[#111827]">Close jobs</p>
              </div>
            </div>

            <div className="bg-[#CFEAE8] rounded-[10px] px-4 py-4 min-h-[95px] flex flex-col justify-between">
              <UsersRound size={18} className="text-[#111827]" />
              <div>
                <h3 className="text-[18px] font-semibold text-[#111827] leading-none">
                  {companyStats.totalApplications}
                </h3>
                <p className="mt-2 text-[14px] text-[#111827]">
                  Total Applications
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Posted Jobs */}
        <section className="mt-5 bg-white rounded-[14px] border border-[#E7ECEB] px-5 md:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[18px] md:text-[20px] font-semibold text-[#111827]">
              Posted Jobs
            </h2>

            <button
              onClick={handleOpenPostJobModal}
              className="h-[36px] px-4 rounded-[8px] bg-[#0B756F] text-white text-[13px] font-medium hover:bg-[#095f5a] transition inline-flex items-center gap-2"
            >
              <Plus size={14} />
              Post New Job
            </button>
          </div>

          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] gap-4 mt-6 px-2">
            <p className="text-[12px] text-[#9CA3AF]">Job Title</p>
            <p className="text-[12px] text-[#9CA3AF]">Type</p>
            <p className="text-[12px] text-[#9CA3AF]">Work Mode</p>
            <p className="text-[12px] text-[#9CA3AF]">Application</p>
            <p className="text-[12px] text-[#9CA3AF]">Status</p>
            <p className="text-[12px] text-[#9CA3AF]">Actions</p>
          </div>

          <div className="mt-4 space-y-3">
            {postedJobs.map((job) => (
              <div
                key={job.id}
                className="md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] md:gap-4 px-2 py-3 rounded-[10px] hover:bg-[#FAFAFA] transition"
              >
                <div>
                  <p className="text-[14px] font-medium text-[#111827]">
                    {job.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    {job.postedTime}
                  </p>
                </div>

                <div className="mt-3 md:mt-0">
                  <span
                    className={`h-[24px] px-3 rounded-full text-[11px] font-medium inline-flex items-center ${getJobTypeBadgeStyle(
                      job.type
                    )}`}
                  >
                    {job.type}
                  </span>
                </div>

                <div className="mt-3 md:mt-0">
                  <span
                    className={`h-[24px] px-3 rounded-full text-[11px] font-medium inline-flex items-center ${getWorkModeBadgeStyle(
                      job.workMode
                    )}`}
                  >
                    {job.workMode}
                  </span>
                </div>

                <div className="mt-3 md:mt-0 text-[13px] text-[#111827]">
                  {job.applicationsCount}
                </div>

                <div className="mt-3 md:mt-0">
                  <span
                    className={`h-[24px] px-3 rounded-full text-[11px] font-medium inline-flex items-center ${getJobStatusStyle(
                      job.status
                    )}`}
                  >
                    {job.status === "active" ? "Active" : "Closed"}
                  </span>
                </div>

                <div className="mt-3 md:mt-0 flex items-center gap-3 text-[12px]">
                  <button
                    onClick={() => handleOpenViewJobModal(job)}
                    className="text-[#0B756F] hover:underline"
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleOpenEditJobModal(job)}
                    className="text-[#6B7280] hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleOpenCloseJobModal(job)}
                    className="text-[#EF4444] hover:underline disabled:text-[#D1D5DB] disabled:no-underline"
                    disabled={job.status === "closed"}
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interviews */}
        <section className="mt-5 bg-white rounded-[14px] border border-[#E7ECEB] px-5 md:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[18px] md:text-[20px] font-semibold text-[#111827]">
              Interviews
            </h2>

            <button
              onClick={handleOpenScheduleInterviewModal}
              className="h-[28px] px-3 rounded-[8px] border border-[#D1D5DB] text-[#6B7280] text-[11px] font-medium hover:bg-[#F9FAFB] transition"
            >
              Schedule New
            </button>
          </div>

          {/* Upcoming */}
          <div className="mt-5">
            <h3 className="text-[13px] text-[#6B7280] uppercase">Upcoming</h3>

            <div className="mt-3 space-y-3">
              {interviews.upcoming.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-[10px] border border-[#DDEBE9] bg-[#F2FBFA] px-4 py-4"
                >
                  <p className="text-[16px] font-medium text-[#111827]">
                    {interview.candidateName}
                  </p>

                  <p className="mt-2 text-[12px] text-[#6B7280]">
                    {interview.title}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-6 text-[12px] text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-[#0B756F]" />
                      <span>
                        {interview.date} at {interview.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-[#0B756F]" />
                      <span>{interview.mode}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenInterviewDetailsModal(interview)}
                      className="text-[12px] text-[#0B756F] hover:underline"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleRescheduleInterview(interview)}
                      className="text-[12px] text-[#6B7280] hover:underline"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => handleMarkInterviewCompleted(interview)}
                      className="text-[12px] text-[#15803D] hover:underline"
                    >
                      Mark as Completed
                    </button>

                    <button
                      onClick={() => handleCancelInterview(interview.id)}
                      className="text-[12px] text-[#DC2626] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past */}
          <div className="mt-6">
            <h3 className="text-[13px] text-[#6B7280] uppercase">Past</h3>

            <div className="mt-3 space-y-3">
              {interviews.past.map((interview) => (
                <div
                  key={interview.id}
                  className="rounded-[10px] border border-[#E5E7EB] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[16px] font-medium text-[#111827]">
                      {interview.candidateName}
                    </p>

                    <span
                      className={`h-[22px] px-3 rounded-full text-[11px] font-medium inline-flex items-center ${getInterviewResultStyle(
                        interview.result
                      )}`}
                    >
                      {interview.result}
                    </span>
                  </div>

                  <p className="mt-3 text-[12px] text-[#6B7280]">
                    {interview.title}
                  </p>

                  <p className="mt-4 text-[12px] text-[#6B7280] leading-6">
                    {interview.feedback}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-[12px] text-[#6B7280]">
                    <CalendarDays size={14} />
                    <span>
                      {interview.date} at {interview.time}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenInterviewDetailsModal(interview)}
                      className="text-[12px] text-[#0B756F] hover:underline"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => handleOpenInterviewFeedbackModal(interview)}
                      className="text-[12px] text-[#6B7280] hover:underline"
                    >
                      View Feedback
                    </button>

                    <button
                      onClick={() =>
                        handleMoveCandidateToNextStep(interview.id)
                      }
                      className="text-[12px] text-[#4F46E5] hover:underline"
                    >
                      Move to Next Step
                    </button>

                    <button
                      onClick={() => handleAcceptCandidate(interview.id)}
                      className="text-[12px] text-[#15803D] hover:underline"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleRejectCandidate(interview.id)}
                      className="text-[12px] text-[#DC2626] hover:underline"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================
           Modals
        ========================== */}

        {/* Edit Profile Modal */}
        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[620px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Edit Company Profile
                </h2>

                <button
                  onClick={handleCloseEditProfileModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Company Logo
                  </label>

                  <div className="flex items-center gap-4">
                    <img
                      src={editProfileForm.logo}
                      alt="Company Logo Preview"
                      className="w-[58px] h-[58px] object-contain rounded-[8px] border border-[#E5E7EB] p-1"
                    />

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[42px] px-4 rounded-[10px] border border-[#D1D5DB] text-[#374151] text-[14px] font-medium inline-flex items-center gap-2 hover:bg-[#F9FAFB] transition"
                    >
                      <ImagePlus size={16} />
                      Change Logo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editProfileForm.name}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Company Type
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={editProfileForm.type}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Company Size
                  </label>
                  <input
                    type="text"
                    name="size"
                    value={editProfileForm.size}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editProfileForm.location}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={editProfileForm.website}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editProfileForm.email}
                    onChange={handleProfileChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-[42px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseEditProfileModal}
                    className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit About Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[720px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Edit About Company
                </h2>

                <button
                  onClick={handleCloseAboutModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <form onSubmit={handleSaveAbout} className="space-y-5">
                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={aboutForm.description}
                    onChange={handleAboutDescriptionChange}
                    rows={5}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Add Project Type
                  </label>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={aboutForm.newTag}
                      onChange={handleNewTagChange}
                      className="flex-1 h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                      placeholder="Enter project type"
                    />

                    <button
                      type="button"
                      onClick={handleAddProjectType}
                      className="h-[44px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-3">
                    Edit Project Types
                  </label>

                  <div className="space-y-3">
                    {aboutForm.projectTypes.map((tag, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) =>
                            handleEditProjectType(index, e.target.value)
                          }
                          className="flex-1 h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteProjectType(tag)}
                          className="h-[44px] px-4 rounded-[10px] border border-[#F3CACA] text-[#DC2626] text-[14px] font-medium hover:bg-[#FEF2F2] transition"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-[42px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseAboutModal}
                    className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Post New Job Modal */}
        {showPostJobModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[620px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Post New Job
                </h2>

                <button
                  onClick={handleClosePostJobModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <form onSubmit={handleSaveNewJob} className="space-y-4">
                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Type
                    </label>
                    <select
                      name="type"
                      value={jobForm.type}
                      onChange={handleJobFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Full-Time</option>
                      <option>Part-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Work Mode
                    </label>
                    <select
                      name="workMode"
                      value={jobForm.workMode}
                      onChange={handleJobFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Remote</option>
                      <option>Hybrid</option>
                      <option>Onsite</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Applications Count
                  </label>
                  <input
                    type="number"
                    name="applicationsCount"
                    value={jobForm.applicationsCount}
                    onChange={handleJobFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={jobForm.description}
                    onChange={handleJobFormChange}
                    rows={4}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    value={jobForm.requirements}
                    onChange={handleJobFormChange}
                    rows={3}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-[42px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                  >
                    Save Job
                  </button>

                  <button
                    type="button"
                    onClick={handleClosePostJobModal}
                    className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Job Modal */}
        {showViewJobModal && selectedJob && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[560px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  View Job
                </h2>

                <button
                  onClick={handleCloseViewJobModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <div className="space-y-4 text-[14px] text-[#374151]">
                <div>
                  <span className="font-semibold text-[#111827]">Title:</span>{" "}
                  {selectedJob.title}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Posted:</span>{" "}
                  {selectedJob.postedTime}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Type:</span>{" "}
                  {selectedJob.type}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">
                    Work Mode:
                  </span>{" "}
                  {selectedJob.workMode}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">
                    Applications:
                  </span>{" "}
                  {selectedJob.applicationsCount}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Status:</span>{" "}
                  {selectedJob.status}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">
                    Description:
                  </span>{" "}
                  {selectedJob.description}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">
                    Requirements:
                  </span>{" "}
                  {selectedJob.requirements}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Job Modal */}
        {showEditJobModal && selectedJob && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[620px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Edit Job
                </h2>

                <button
                  onClick={handleCloseEditJobModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedJob} className="space-y-4">
                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Type
                    </label>
                    <select
                      name="type"
                      value={jobForm.type}
                      onChange={handleJobFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Full-Time</option>
                      <option>Part-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Work Mode
                    </label>
                    <select
                      name="workMode"
                      value={jobForm.workMode}
                      onChange={handleJobFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Remote</option>
                      <option>Hybrid</option>
                      <option>Onsite</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Applications Count
                  </label>
                  <input
                    type="number"
                    name="applicationsCount"
                    value={jobForm.applicationsCount}
                    onChange={handleJobFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={jobForm.description}
                    onChange={handleJobFormChange}
                    rows={4}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    value={jobForm.requirements}
                    onChange={handleJobFormChange}
                    rows={3}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-[42px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseEditJobModal}
                    className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Close Job Confirmation Modal */}
        {showCloseJobModal && selectedJob && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[420px] bg-white rounded-[16px] p-6 shadow-lg">
              <h3 className="text-[20px] font-semibold text-[#111827]">
                Close Job
              </h3>

              <p className="mt-3 text-[14px] text-[#6B7280] leading-7">
                Are you sure you want to close this job?
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleConfirmCloseJob}
                  className="h-[42px] px-5 rounded-[10px] bg-[#EF4444] text-white text-[14px] font-medium hover:bg-[#DC2626] transition"
                >
                  Yes, Close
                </button>

                <button
                  onClick={handleCloseCloseJobModal}
                  className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleInterviewModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[620px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  {selectedInterview
                    ? "Reschedule Interview"
                    : "Schedule Interview"}
                </h2>

                <button
                  onClick={handleCloseScheduleInterviewModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <form
                onSubmit={
                  selectedInterview
                    ? handleSaveRescheduledInterview
                    : handleSaveInterview
                }
                className="space-y-4"
              >
                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={interviewForm.candidateName}
                    onChange={handleInterviewFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Job Title / Position
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={interviewForm.jobTitle}
                    onChange={handleInterviewFormChange}
                    className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Interview Type
                    </label>
                    <select
                      name="interviewType"
                      value={interviewForm.interviewType}
                      onChange={handleInterviewFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Technical</option>
                      <option>HR</option>
                      <option>Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Mode
                    </label>
                    <select
                      name="mode"
                      value={interviewForm.mode}
                      onChange={handleInterviewFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none bg-white"
                    >
                      <option>Onsite</option>
                      <option>Online</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Date
                    </label>
                    <input
                      type="text"
                      name="date"
                      value={interviewForm.date}
                      onChange={handleInterviewFormChange}
                      placeholder="Feb 10, 2026"
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Time
                    </label>
                    <input
                      type="text"
                      name="time"
                      value={interviewForm.time}
                      onChange={handleInterviewFormChange}
                      placeholder="10:00 AM"
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                    />
                  </div>
                </div>

                {interviewForm.mode === "Online" && (
                  <div>
                    <label className="block text-[14px] text-[#374151] mb-2">
                      Meeting Link
                    </label>
                    <input
                      type="text"
                      name="meetingLink"
                      value={interviewForm.meetingLink}
                      onChange={handleInterviewFormChange}
                      className="w-full h-[44px] rounded-[10px] border border-[#D1D5DB] px-4 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[14px] text-[#374151] mb-2">
                    Notes / Instructions
                  </label>
                  <textarea
                    name="notes"
                    value={interviewForm.notes}
                    onChange={handleInterviewFormChange}
                    rows={4}
                    className="w-full rounded-[10px] border border-[#D1D5DB] px-4 py-3 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="h-[42px] px-5 rounded-[10px] bg-[#0B756F] text-white text-[14px] font-medium hover:bg-[#095f5a] transition"
                  >
                    Save Interview
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseScheduleInterviewModal}
                    className="h-[42px] px-5 rounded-[10px] border border-[#D1D5DB] text-[#6B7280] text-[14px] font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Interview Details Modal */}
        {showInterviewDetailsModal && selectedInterview && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[560px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Interview Details
                </h2>

                <button
                  onClick={handleCloseInterviewDetailsModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <div className="space-y-4 text-[14px] text-[#374151]">
                <div>
                  <span className="font-semibold text-[#111827]">
                    Candidate:
                  </span>{" "}
                  {selectedInterview.candidateName}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Title:</span>{" "}
                  {selectedInterview.title}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Date:</span>{" "}
                  {selectedInterview.date}
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">Time:</span>{" "}
                  {selectedInterview.time}
                </div>
                {"mode" in selectedInterview && (
                  <div>
                    <span className="font-semibold text-[#111827]">Mode:</span>{" "}
                    {selectedInterview.mode}
                  </div>
                )}
                {"notes" in selectedInterview && (
                  <div>
                    <span className="font-semibold text-[#111827]">Notes:</span>{" "}
                    {selectedInterview.notes || "No notes"}
                  </div>
                )}
                {"result" in selectedInterview && (
                  <div>
                    <span className="font-semibold text-[#111827]">
                      Result:
                    </span>{" "}
                    {selectedInterview.result}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interview Feedback Modal */}
        {showInterviewFeedbackModal && selectedInterview && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="w-full max-w-[560px] bg-white rounded-[16px] p-6 md:p-7 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#111827]">
                  Interview Feedback
                </h2>

                <button
                  onClick={handleCloseInterviewFeedbackModal}
                  className="w-[36px] h-[36px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition"
                >
                  <X size={18} className="text-[#6B7280]" />
                </button>
              </div>

              <p className="text-[14px] leading-7 text-[#6B7280]">
                {selectedInterview.feedback || "No feedback available"}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default CompanyProfile;