import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import OAuthCallback from "../pages/auth/OAuthCallback";
import Home from "../pages/public/Home";
import DeploymentPage from "../pages/public/DeploymentPage";
import NotFound from "../pages/public/NotFound";
import ChatTest from "../pages/dev/ChatTest";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import { isLocalhost, shouldShowDeploymentPage } from "../utils/environment";

import SkillQuiz from "../pages/developer/skill-quiz/SkillQuiz";

import DeveloperDashboard from "../pages/developer/dashboard/DeveloperDashboard";
import DevProfile from "../pages/developer/dashboard/DevProfile";
import ProjectsList from "../pages/developer/ProjectsList";
import DeveloperProjectDetails from "../pages/developer/DeveloperProjectDetails";
import JobDetails from "../pages/developer/jobs/JobDetails";
import CompleteProfile from "../pages/developer/CompleteProfile";

import ClientProfile from "../pages/client/dashboard/ClientProfile";
import PostNewJob from "../pages/client/job-post/PostNewJob";
import MyJobPosts from "../pages/client/job-post/MyJobPosts";
import ClientJobDetails from "../pages/client/ClientJobDetails";
import ClientApplicants from "../pages/client/job-post/Applicants";
import BuildTeam from "../pages/client/BuildTeam";
import ProjectDetails from "../pages/client/ProjectDetails";


import CompanyProfile from "../pages/company/dashboard/CompanyProfile";
import CompanyDashboard from "../pages/company/CompanyDashboard";
import PostJob from "../pages/company/PostJob";
import JobManagement from "../pages/company/JobManagement";
import Applicants from "../pages/company/Applicants";
import Interviews from "../pages/company/Interviews";
import AutoSuggestTeam from "../pages/company/AutoSuggestTeam";

import TeamDashboard from "../pages/team-leader/TeamDashboard";

import AdminDashboard from "../pages/admin/AdminDashboard";

function AppRoutes() {
  // Check environment - localhost should NEVER show deployment page
  const onLocalhost = isLocalhost();
  const showDeploymentPage = shouldShowDeploymentPage();

  // Show DeploymentPage only on production (not localhost) when enabled
  if (showDeploymentPage && !onLocalhost) {
    return <DeploymentPage />;
  }

  return (
    <Routes>
      {/* Public routes - Real app for Netlify and localhost */}
      <Route path="/" element={<Home/>} />
      <Route path="/deployment" element={<DeploymentPage />} />
      <Route path="/under-deployment" element={<DeploymentPage />} />

      {/* Public only routes - redirect authenticated users to their dashboard */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      <Route path="/skill-quiz" element={<SkillQuiz />} />
      <Route path="/quiz" element={<SkillQuiz />} />
      <Route path="/quiz/:trackId" element={<SkillQuiz />} />

      {/* Auth-protected routes */}
      <Route element={<PrivateRoute />}>
        {/* Developer routes */}
        <Route element={<RoleRoute role="developer" />}>
          <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
          <Route path="/developer/profile" element={<DevProfile />} />
          <Route path="/developer/projects" element={<ProjectsList />} />
          <Route path="/developer/project/:id" element={<DeveloperProjectDetails />} />
          <Route path="/developer/jobs/:id" element={<JobDetails />} />
          <Route path="/developer/jobs/:id/apply" element={<JobDetails />} />
          <Route path="/developer/proposals/:id" element={<DeveloperProjectDetails />} />
          <Route path="/developer/complete-profile" element={<CompleteProfile />} />
        </Route>

        {/* Client routes */}
        <Route element={<RoleRoute role="client" />}>
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/job-post" element={<PostNewJob />} />
          <Route path="/client/my-jobs" element={<MyJobPosts />} />

          <Route path="/client/job/:id" element={<ProjectDetails />} />
          <Route path="/client/job/:id/applicants" element={<ClientApplicants />}/>
          <Route path="/client/build-team" element={<BuildTeam />} />
          <Route path="/client/project/:id" element={<ProjectDetails />} />
        </Route>

        {/* Company routes */}
        <Route element={<RoleRoute role="company" />}>
          <Route path="/company/profile" element={<CompanyProfile />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/jobs" element={<JobManagement />} />
          <Route path="/company/post-job" element={<PostJob />} />
          <Route path="/company/applicants" element={<Applicants />} />
          <Route path="/company/interviews" element={<Interviews />} />
          <Route path="/company/auto-suggest-team" element={<AutoSuggestTeam />} />
        </Route>

        {/* Team Leader routes */}
        <Route element={<RoleRoute role="team-leader" />}>
          <Route path="/team-leader/dashboard" element={<TeamDashboard />} />
          {/* <Route path="/team-leader/team" element={<Team />} /> */}
          {/* <Route path="/team-leader/tasks" element={<Tasks />} /> */}
          {/* <Route path="/team-leader/progress" element={<Progress />} /> */}
          {/* <Route path="/team-leader/reports" element={<Reports />} /> */}
        </Route>

        {/* Admin routes */}
        <Route element={<RoleRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      {/* Dev-only routes - NOT available in production */}
      <Route path="/dev/chat-test" element={<ChatTest />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
