import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
// import Home from "../pages/public/Home";
import DeploymentPage from "../pages/public/DeploymentPage";
import NotFound from "../pages/public/NotFound";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";

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
import BuildTeam from "../pages/client/BuildTeam";
import ProjectDetails from "../pages/client/ProjectDetails";

import CompanyProfile from "../pages/company/dashboard/CompanyProfile";
import CompanyDashboard from "../pages/company/CompanyDashboard";
import PostJob from "../pages/company/PostJob";
import Applicants from "../pages/company/Applicants";
import Interviews from "../pages/company/Interviews";

import TeamDashboard from "../pages/team-leader/TeamDashboard";
import Team from "../pages/team-leader/Team";
import Tasks from "../pages/team-leader/Tasks";
import Progress from "../pages/team-leader/Progress";
import Reports from "../pages/team-leader/Reports";

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - Temporary deployment page */}
      <Route path="/" element={<DeploymentPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
          <Route path="/client/job/:id" element={<ClientJobDetails />} />
          <Route path="/client/build-team" element={<BuildTeam />} />
          <Route path="/client/project/:id" element={<ProjectDetails />} />
        </Route>

        {/* Company routes */}
        <Route element={<RoleRoute role="company" />}>
          <Route path="/company/profile" element={<CompanyProfile />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/post-job" element={<PostJob />} />
          <Route path="/company/applicants" element={<Applicants />} />
          <Route path="/company/interviews" element={<Interviews />} />
        </Route>

        {/* Team Leader routes */}
        <Route element={<RoleRoute role="team-leader" />}>
          <Route path="/team-leader/dashboard" element={<TeamDashboard />} />
          <Route path="/team-leader/team" element={<Team />} />
          <Route path="/team-leader/tasks" element={<Tasks />} />
          <Route path="/team-leader/progress" element={<Progress />} />
          <Route path="/team-leader/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;